const { sendEmail } = require("../../../helper/email")

module.exports = {
    sendEmail: async (req, res) => {
        try {
            let { query } = req
            sendEmail()
            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    }
}