const { sendEmail } = require("../../../helper/email")
const { emailLBVNewBooking } = require("../../../helper/emailHTML/_emailFormat")
const { randomString, createPaymentLink } = require("../../../helper/order")
const { checkUser } = require("../../../helper/user")
const { ObjectId } = require('mongoose').Types

module.exports = {
    getCoupons: async (req, res) => { 
        try {
            let listCoupon = await MODELS.Coupon.find({

            }).lean()
            OUTPUT.responseSuccess(res, listCoupon)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
}