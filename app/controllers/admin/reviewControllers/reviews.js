const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

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
                const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                const term = { $regex: escaped, $options: 'i' }

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
                    .populate([
                        {
                            path: 'user',
                            model: MODELS.User,
                            select: 'name firstName lastName email country',
                        },
                    ])
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
            
            const properties = await MODELS.Properties.find({
                _id: { $in: data.map((row) => row.propertyId).filter(Boolean) }
            }).select('name region location').lean()

            const propertyById = {}
            properties.forEach((property) => { propertyById[String(property._id)] = property })

            data = data.map((row) => ({
                ...row,
                property: propertyById[String(row.propertyId)] || null,
            }))

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
