const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const { generateLookupToken } = require('../../../helper/reference');

// A week. Long enough to survive a weekend and a reminder, short enough that a link
// forwarded on to someone else goes dead quickly. Reissuing is one click.
const VALID_FOR_DAYS = 7;

const inviteUrl = (token) => `${String(CONFIG.siteURL || '').replace(/\/+$/, '')}/review/${token}`

const isLive = (invite) => Boolean(
    invite &&
    !invite.isRevoked &&
    !invite.usedAt &&
    (!invite.expiresAt || new Date(invite.expiresAt) > new Date())
)

const publicShape = (invite) => ({
    _id: invite._id,
    token: invite.token,
    url: inviteUrl(invite.token),
    booking: invite.booking,
    bookingId: invite.bookingId,
    propertyId: invite.propertyId,
    propertyName: invite.propertyName,
    guestName: invite.guestName,
    guestEmail: invite.guestEmail,
    dates: invite.dates || [],
    createdBy: invite.createdBy || null,
    createdDate: invite.createdDate,
    expiresAt: invite.expiresAt,
    usedAt: invite.usedAt || null,
    review: invite.review || null,
    isRevoked: Boolean(invite.isRevoked),
    isLive: isLive(invite),
})

// The CMS has the Mongo id in hand on the booking screen and the human booking id
// everywhere else - a printout, an email, a WhatsApp thread. Accept either.
const findBooking = async (reference) => {
    const value = String(reference || '').trim()
    if (!value) { throw { statusCode: 400, message: 'A booking is required' } }

    if (ObjectId.isValid(value)) {
        const byId = await MODELS.Booking.findOne({ _id: value }).lean()
        if (byId) { return byId }
    }

    const byBookingId = await MODELS.Booking.findOne({
        bookingId: { $regex: `^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
    }).lean()

    if (!byBookingId) { throw { statusCode: 404, message: 'No booking found with that ID' } }
    return byBookingId
}

module.exports = {
    createReviewInvite: async (req, res) => {
        try {
            const { bookingId } = req.body || {}
            const booking = await findBooking(bookingId)

            const info = booking.propertiesInfo || {}
            if (!info.properties) {
                throw { statusCode: 400, message: 'This booking has no property on it, so there is nothing to review' }
            }

            // Whatever the guest writes is published against this property, so take the
            // name from the property itself and fall back to the booking's snapshot.
            const property = await MODELS.Properties.findOne({ _id: info.properties })
                .select('name propertyImage').lean()

            const propertyImage = [
                (info.placeImage || [])[0],
                ((property && property.propertyImage) || [])[0],
            ].find(Boolean) || ''

            const guest = booking.guestInfo || {}
            const guestName = [guest.name, [guest.firstName, guest.lastName].filter(Boolean).join(' ')]
                .map((value) => (value || '').trim())
                .find(Boolean) || ''

            const existingReview = await MODELS.Reviews.findOne({
                isDeleted: { $ne: true },
                $or: [
                    { booking: booking._id },
                    ...(booking.user ? [{ propertyId: info.properties, user: booking.user }] : []),
                ]
            }).lean()

            if (existingReview) {
                throw { statusCode: 409, message: 'This guest has already reviewed this stay', data: { reviewId: existingReview._id } }
            }

            // Reissuing for the same booking hands back the link that is already out
            // there rather than minting a second one - two live links for one stay is
            // how you end up with two reviews.
            const live = await MODELS.ReviewInvites.findOne({
                booking: booking._id,
                isRevoked: { $ne: true },
                usedAt: null,
                expiresAt: { $gt: new Date() },
            }).sort({ createdDate: -1 }).lean()

            if (live) { return OUTPUT.responseSuccess(res, publicShape(live)) }

            const expiresAt = new Date(Date.now() + VALID_FOR_DAYS * 24 * 60 * 60 * 1000)

            let invite = await MODELS.ReviewInvites.create({
                token: generateLookupToken(),
                booking: booking._id,
                bookingId: booking.bookingId,
                propertyId: info.properties,
                propertyName: (property && property.name) || info.propertiesName || '',
                propertyImage,
                user: booking.user || null,
                guestName,
                guestEmail: guest.email || '',
                dates: booking.dates || [],
                createdBy: req.admin ? {
                    _id: req.admin._id,
                    name: req.admin.name,
                    username: req.admin.username,
                } : null,
                expiresAt,
            })

            OUTPUT.responseSuccess(res, publicShape(invite.toObject()))
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },

    getReviewInvites: async (req, res) => {
        try {
            const { bookingId } = req.query || {}

            const queryParams = {}
            if (bookingId) {
                const booking = await findBooking(bookingId)
                queryParams.booking = booking._id
            }

            const data = await MODELS.ReviewInvites.find(queryParams)
                .sort({ createdDate: -1 })
                .limit(bookingId ? 20 : 100)
                .lean()

            OUTPUT.responseSuccess(res, { data: data.map(publicShape), totalData: data.length })
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },

    revokeReviewInvite: async (req, res) => {
        try {
            const { id } = req.params
            if (!ObjectId.isValid(id)) { throw { statusCode: 400, message: 'Invalid link id' } }

            const invite = await MODELS.ReviewInvites.findOne({ _id: id }).lean()
            if (!invite) { throw { statusCode: 404, message: 'Link not found' } }

            // A used link cannot be un-sent; revoking it would only hide the trail of
            // where a published review came from.
            if (invite.usedAt) { throw { statusCode: 409, message: 'This link has already been used' } }

            const updated = await MODELS.ReviewInvites.findOneAndUpdate(
                { _id: id },
                { $set: { isRevoked: true, updatedDate: new Date() } },
                { new: true }
            ).lean()

            OUTPUT.responseSuccess(res, publicShape(updated))
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
}
