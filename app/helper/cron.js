const moment = require("moment");
const { emailRemindCheckIn } = require("./emailHTML/_emailFormat");
const { sendEmail } = require("./email");
const { getCurrencyAPI } = require("./currencyApi");

module.exports = {
    cronCustCheckin : async () => {
        // remind in h-2 of check in date
        try {
            let currentDate = moment().add(2, 'days').format('YYYY-MM-DD')
            // dates
            // arrivalTime
            console.log(currentDate)
            let listCheckin = await MODELS.Booking.find({
                'dates.0' : currentDate,
                lastStatus: 'confirmed'
            }).lean()

            if (listCheckin.length > 0) {
                await sendEmail({
                    title: `[Notification] Guest will arrive at ${currentDate}`,
                    textBody: '',
                    htmlBody: emailRemindCheckIn({data: listCheckin}),
                    email: 'rsv@localbalivillas.com',
                    allowCC: true
                })
            }
            return;
        } catch (error) {
            console.log(error)
            return error;
        }
    },
    cronCheckCurrency: async () => {
        try {
            let currency = await getCurrencyAPI()
            await MODELS.Currency.create({
                currency: "IDR",
                currencyList: currency.data,
                createdDate: new Date(),
                lastUpdatedDate: currency.meta ? moment(currency.meta.last_updated_at).add(-7, 'hours') : new Date(),
            })
        } catch (error) { console.log(error) }
    }
}