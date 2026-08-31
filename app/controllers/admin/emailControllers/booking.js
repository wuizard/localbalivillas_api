const moment = require("moment");
const { sendEmail } = require("../../../helper/email");
const { emailConfirmationBody, emailLBVBody, emailLBVRefund, emailLBVCheckOut } = require("../../../helper/emailHTML/_emailFormat");

module.exports = {
    resendConfirmationBookingEmail: async (req, res) => {
        try {
            let { query } = req
            let { _id, bookingId, email, allowCC } = query

            if (!bookingId) { throw { message: "Booking id can't be empty" }}
            if (!email) { throw { message: "Email can't be empty" }}

            let orderInfo = await MODELS.Booking.findOne({
                bookingId
            }).populate([
                {
                    path:'user',
                    model: MODELS.User
                }
            ])
            .lean()

            console.log(`Confirmation Booking for ${orderInfo.propertiesInfo.propertiesName}: Check-in on ${moment(orderInfo.dates[0]).format('dddd, MMM DD, YYYY')}. NON REFUNDABLE`)
            console.log(emailConfirmationBody({data: orderInfo}))

            // Tuesday, October 30, 2023
            if (allowCC) {
                await sendEmail({
                    title: `Confirmation Booking for ${orderInfo.propertiesInfo.propertiesName}: Check-in on ${moment(orderInfo.dates[0]).format('dddd, MMM DD, YYYY')}. NON REFUNDABLE`,
                    textBody: '',
                    htmlBody: emailConfirmationBody({data: orderInfo}),
                    email: email,
                    allowCC: true
                })   
            } else {
                await sendEmail({
                    title: `Confirmation Booking for ${orderInfo.propertiesInfo.propertiesName}: Check-in on ${moment(orderInfo.dates[0]).format('dddd, MMM DD, YYYY')}. NON REFUNDABLE`,
                    textBody: '',
                    htmlBody: emailConfirmationBody({data: orderInfo}),
                    email: email,
                })
            }

            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },
}