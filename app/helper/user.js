module.exports = {
    checkUser: async function ({
        name,
        phoneNumber,
        firstName,
        lastName,
        title,
        email,
        country
    }) {
        console.log({
            name,
            phoneNumber,
            email
        })
        try {
            // check user info
            let user = await MODELS.User.findOne({
                $or: [
                    { phoneNumber },
                    { email }
                ]
            }).lean()

            if (!user) {
                user = await MODELS.User.create({
                    name,
                    firstName,
                    lastName,
                    title,
                    phoneNumber,
                    email,
                    country
                })
            }
            console.log(user)

            return user
        } catch (error) {
            console.log('here check error', error)
            return error
        }
    },
    registerUser: async function (
        body
    ) {
        try {
            let user = await MODELS.User.create(body)
            return user
        } catch (error) {
            console.log('here check error', error)
            return error
        }
    }
}