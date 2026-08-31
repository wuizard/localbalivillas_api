// A JWT is signed, not encrypted - anyone holding one can base64-decode the payload.
// So the payload carries an id and a role and nothing else. It used to carry the
// bcrypt hash, which handed every admin's password hash to the browser.
function tokenPayload(admin) {
    return {
        user: {
            _id: admin._id,
            username: admin.username,
            role: admin.role,
        },
    };
}

// What the CMS is allowed to hold. The password hash and the full token list stay
// on the server.
function publicAdmin(admin, token) {
    return {
        _id: admin._id,
        name: admin.name,
        username: admin.username,
        role: admin.role,
        allowedPermission: admin.allowedPermission || [],
        token,
    };
}

// Old sessions are kept so a second device stays signed in, but not forever - an
// unbounded array grows the document on every login.
const MAX_SESSIONS = 5;

module.exports = {
    login: async (req, res) => {
        try {
            let { body } = req;
            let { username, password } = body;

            let adminInfo = await MODELS.Admin.findOne({ username }).lean()

            // One message for an unknown username and a wrong password. Telling them
            // apart turns the form into a way to enumerate accounts.
            const rejected = { statusCode: 401, message: 'Wrong username or password' }

            if (!adminInfo) { throw rejected }
            if (adminInfo.isActive === false) {
                throw { statusCode: 403, message: 'This account has been disabled.' }
            }
            if (!password || !adminInfo.password) { throw rejected }
            if (LIBRARY.bcrypt.compareSync(password, adminInfo.password) === false) { throw rejected }

            const token = LIBRARY.jwt.sign(
                tokenPayload(adminInfo),
                CONFIG.sessionSecret,
                { expiresIn: CONFIG.adminSessionExpirationInSeconds },
            );

            const tokens = (adminInfo.tokenList || []).concat(token).slice(-MAX_SESSIONS)

            await MODELS.Admin.updateOne(
                { _id: adminInfo._id },
                { token, tokenList: tokens, updatedDate: new Date() },
            )

            OUTPUT.responseSuccess(res, publicAdmin(adminInfo, token))
        } catch (error) {
            console.log('login failed for', req.body && req.body.username)
            OUTPUT.responseError(res, error && error.statusCode ? error : {
                statusCode: 401,
                message: 'Wrong username or password',
            });
        }
    },

    /** Drops the presented token so it stops working immediately. */
    logout: async (req, res) => {
        try {
            const admin = req.admin
            const token = req.adminToken

            const current = await MODELS.Admin.findOne({ _id: admin._id }).lean()
            const tokens = (current.tokenList || []).filter((entry) => entry !== token)

            await MODELS.Admin.updateOne(
                { _id: admin._id },
                { tokenList: tokens, token: tokens[tokens.length - 1] || null },
            )

            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },

    /** Who the presented token belongs to. The CMS calls this to confirm a session. */
    me: async (req, res) => {
        try {
            OUTPUT.responseSuccess(res, req.admin)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
}
