module.exports = {
    createAdmin: async (req, res) => {
        try {
            let { body } = req;
            // check existing user
            let existingAdmin = await MODELS.Admin.find({
                username: body.username
            }).count()
            if (existingAdmin > 0) { throw { message: 'Username already registered' } }
            let newAdmin = await MODELS.Admin.create(body)
            OUTPUT.responseSuccess(res, newAdmin)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error);
        }
    },
    getAdmins: async (req, res) => {
        try {
            let { query } = req;
            // check existing user
            let admins = await MODELS.Admin.find({}).lean()
            OUTPUT.responseSuccess(res, admins)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error);
        }
    },
    getAdmin: async (req, res) => {
        try {
            let { params } = req;
            let { adminId } = params
            // check existing user
            let admin = await MODELS.Admin.findOne({
                _id: adminId
            }).lean()
            OUTPUT.responseSuccess(res, admin)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error);
        }
    },
    updateAdmin: async (req, res) => {
        try {
            let { body } = req;
            // check existing user
            let existingAdmin = await MODELS.Admin.findOne({
                _id: body._id
            })
            if (!existingAdmin) { throw { message: 'User not exist' } }
            let newAdmin = await MODELS.Admin.findOneAndUpdate({
                _id: body._id
            }, {
                ...body
            })
            OUTPUT.responseSuccess(res, newAdmin)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error);
        }
    },
    deleteAdmin: async (req, res) => {
        try {
            let { params } = req;
            let { adminId } = params;
            // check existing user
            await MODELS.Admin.deleteMany({
                _id: adminId
            })
            let admins = await MODELS.Admin.find({}).lean()
            OUTPUT.responseSuccess(res, admins)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    }
}