const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// A review carries no booking id, so the stay behind it has to be matched the same
// way submitReview validated it in the first place: same property, same guest - by
// account where there is one, by email where the booking was made as a guest.
const findBookings = async (rows) => {
    const clauses = []

    // A review left through an admin-issued link names its booking outright; only the
    // website flow has to be matched by guest and property.
    const exact = rows.map((row) => row.booking).filter(Boolean)
    if (exact.length) { clauses.push({ _id: { $in: exact } }) }

    rows.forEach((row) => {
        if (row.booking) { return }
        if (!row.propertyId) { return }

        const guest = []
        if (row.userId) { guest.push({ user: row.userId }) }
        if (row.user && row.user.email) {
            guest.push({ 'guestInfo.email': { $regex: `^${escapeRegex(row.user.email)}$`, $options: 'i' } })
        }
        if (!guest.length) { return }

        clauses.push({ 'propertiesInfo.properties': row.propertyId, $or: guest })
    })

    if (!clauses.length) { return [] }

    return MODELS.Booking.find({ $or: clauses })
        .select('bookingId user guestInfo.email propertiesInfo.properties dates lastStatus createdDate')
        .sort({ createdDate: -1 })
        .lean()
}

const trimBooking = (booking) => ({
    _id: booking._id,
    bookingId: booking.bookingId,
    lastStatus: booking.lastStatus,
    dates: booking.dates || [],
    createdDate: booking.createdDate,
})

const bookingForReview = (row, bookings) => {
    if (row.booking) {
        const exact = bookings.find((booking) => String(booking._id) === String(row.booking))
        return exact ? { ...trimBooking(exact), otherBookings: 0, exact: true } : null
    }

    const email = row.user && row.user.email ? String(row.user.email).toLowerCase() : null

    const matches = bookings.filter((booking) => {
        const info = booking.propertiesInfo || {}
        if (String(info.properties) !== String(row.propertyId)) { return false }
        if (row.userId && String(booking.user) === String(row.userId)) { return true }
        const bookingEmail = booking.guestInfo && booking.guestInfo.email
        return Boolean(email && bookingEmail && String(bookingEmail).toLowerCase() === email)
    })

    if (!matches.length) { return null }

    // Newest first already. The stay that prompted the review is the last one booked
    // before it was written; anything after it is a return visit, not this review.
    const reviewedAt = new Date(row.createdDate)
    const booking = matches.find((row) => new Date(row.createdDate) <= reviewedAt) || matches[0]

    return {
        ...trimBooking(booking),
        // More than one stay at this property by this guest - the link points at the
        // one above, so say so rather than letting it look like the only booking.
        otherBookings: matches.length - 1,
        exact: false,
    }
}

module.exports = {
    getReviews: async (req, res) => {
        try {
            let { query } = req
            let { page, limit, search, rating, propertyId } = query
            page = Number(page) || 0
            limit = Number(limit) || 20

            let queryParams = { isDeleted: { $ne: true } }

            if (rating) {
                const score = Number(rating)
                if (score >= 1 && score <= 5) { queryParams.rating = score }
            }

            if (propertyId && ObjectId.isValid(propertyId)) {
                queryParams.propertyId = new ObjectId(propertyId)
            }

            if (search) {
                const term = { $regex: escapeRegex(String(search).trim()), $options: 'i' }

                let [users, properties] = await Promise.all([
                    MODELS.User.find({
                        $or: [
                            { name: term },
                            { firstName: term },
                            { lastName: term },
                            { email: term },
                        ]
                    }).select('_id').lean(),
                    MODELS.Properties.find({ name: term }).select('_id').lean(),
                ])

                queryParams.$or = [
                    { review: term },
                    { user: { $in: users.map((row) => row._id) } },
                    { propertyId: { $in: properties.map((row) => row._id) } },
                ]
            }

            let [data, totalData, summary] = await Promise.all([
                MODELS.Reviews.find(queryParams)
                    .sort({ createdDate: -1 })
                    .limit(limit)
                    .skip(page * limit)
                    .lean(),
                MODELS.Reviews.countDocuments(queryParams),
                MODELS.Reviews.aggregate([
                    { $match: queryParams },
                    { $group: { _id: null, averageRating: { $avg: '$rating' } } },
                ]),
            ])

            // Looked up rather than populated: populate nulls the id out when the
            // document is gone, and a booking can still be matched on that id.
            const [properties, users] = await Promise.all([
                MODELS.Properties.find({
                    _id: { $in: data.map((row) => row.propertyId).filter(Boolean) }
                }).select('name region location').lean(),
                MODELS.User.find({
                    _id: { $in: data.map((row) => row.user).filter(Boolean) }
                }).select('name firstName lastName email country').lean(),
            ])

            const propertyById = {}
            properties.forEach((property) => { propertyById[String(property._id)] = property })

            const userById = {}
            users.forEach((user) => { userById[String(user._id)] = user })

            data = data.map((row) => ({
                ...row,
                userId: row.user || null,
                user: userById[String(row.user)] || null,
                property: propertyById[String(row.propertyId)] || null,
            }))

            const bookings = await findBookings(data)
            data = data.map((row) => ({ ...row, booking: bookingForReview(row, bookings) }))

            OUTPUT.responseSuccess(res, {
                data,
                totalData,
                page,
                limit,
                averageRating: summary.length ? summary[0].averageRating : null,
            })
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },
}
