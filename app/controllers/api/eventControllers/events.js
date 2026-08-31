const { Types } = require('mongoose');
const { ObjectId } = Types;

const PUBLIC_PROJECTION = { __v: 0 };

const publicFilter = (extra = {}) => ({
    status: { $ne: 'draft' },
    isDeleted: { $ne: true },
    isActive: { $ne: false },
    ...extra,
});

module.exports = {
    getEventPackages: async (req, res) => {
        try {
            let data = await MODELS.EventPackage.find(publicFilter(), PUBLIC_PROJECTION)
                .sort({ sortOrder: 1, createdDate: 1 })
                .lean()

            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },

    getEventPackageDetail: async (req, res) => {
        try {
            let { params } = req
            let { id } = params

            let isObjectId = ObjectId.isValid(id)
            let data = await MODELS.EventPackage.findOne(
                publicFilter(isObjectId ? { _id: id } : { key: id }),
                PUBLIC_PROJECTION
            ).lean()

            if (!data) { throw { statusCode: 404, message: "Event package not found" } }

            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },
}
