const moment = require("moment");
const { getCurrencyAPI } = require("../../../helper/currencyApi")

module.exports = {
    getLastCurrency: async (req, res) => {
        try {
            let currency = await getCurrencyAPI()
            await MODELS.Currency.create({
                currency: "IDR",
                currencyList: currency.data,
                createdDate: new Date(),
                lastUpdatedDate: currency.meta ? moment(currency.meta.last_updated_at).add(-7, 'hours') : new Date(),
            })
            OUTPUT.responseSuccess(res, currency)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
}