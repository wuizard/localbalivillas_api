module.exports = {
    getUsers: async (req, res) => {
        try {
            let { query } = req;
            // check existing user
            let users = await MODELS.User.find({})
            .select('_id name')
            .lean()
            OUTPUT.responseSuccess(res, users)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error);
        }
    },
    getUsersId: async (req, res) => {
        try {
            let { query } = req;
            // check existing user
            let users = await MODELS.User.find({})
            .select('_id name')
            .lean()
            OUTPUT.responseSuccess(res, users)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error);
        }
    }
}