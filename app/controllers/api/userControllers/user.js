
module.exports = {
    getUsers: async (req, res) => { 
        try {
            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
}