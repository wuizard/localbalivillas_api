const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const VALID_STATUS = ['waiting_payment', 'paid', 'confirmed', 'cancelled', 'refunded'];

module.exports = {
    getActivityOrders: async (req, res) => {
        try {
            let { page, limit, status, search, date } = req.query
            page = Number(page) || 0
            limit = Number(limit) || 20

            const params = { isDeleted: { $ne: true } }

            if (status && VALID_STATUS.indexOf(status) >= 0) { params.lastStatus = status }
            if (date) { params.date = date }
            if (search) {
                params.$or = [
                    { activityBookingId: { $regex: search, $options: 'i' } },
                    { 'guestInfo.name': { $regex: search, $options: 'i' } },
                    { 'guestInfo.email': { $regex: search, $options: 'i' } },
                    { 'activityInfo.name': { $regex: search, $options: 'i' } },
                ]
            }

            // Soonest departure first. An activity running tomorrow needs confirming
            // with the supplier today; one in six months does not.
            const [data, totalData] = await Promise.all([
                MODELS.ActivityBooking.find(params)
                    .sort({ date: 1, createdDate: -1 })
                    .limit(limit)
                    .skip(page * limit)
                    .lean(),
                MODELS.ActivityBooking.countDocuments(params),
            ])

            OUTPUT.responseSuccess(res, { data, totalData, page, limit })
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },

    getActivityOrder: async (req, res) => {
        try {
            const { id } = req.params
            const data = ObjectId.isValid(id)
                ? await MODELS.ActivityBooking.findOne({ _id: id }).lean()
                : await MODELS.ActivityBooking.findOne({ activityBookingId: id }).lean()

            if (!data) { throw { statusCode: 404, message: 'Order not found' } }

            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },

    updateActivityOrderStatus: async (req, res) => {
        try {
            const { _id, status } = req.body || {}

            if (!ObjectId.isValid(_id)) { throw { statusCode: 400, message: 'Invalid order id' } }
            if (VALID_STATUS.indexOf(status) < 0) {
                throw { statusCode: 400, message: `Status must be one of: ${VALID_STATUS.join(', ')}` }
            }

            const current = await MODELS.ActivityBooking.findOne({ _id }).lean()
            if (!current) { throw { statusCode: 404, message: 'Order not found' } }

            // The status array is a timeline, not a single value - stamp the entry
            // rather than replacing the history, the way villa bookings do.
            const stamped = (current.status || []).map((entry) => (
                entry.status === status ? { ...entry, date: new Date() } : entry
            ))

            const updated = await MODELS.ActivityBooking.findOneAndUpdate(
                { _id },
                { lastStatus: status, status: stamped, updatedDate: new Date() },
                { new: true },
            )

            OUTPUT.responseSuccess(res, updated)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
};
