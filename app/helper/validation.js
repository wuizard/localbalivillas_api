/**
 * Admin authentication.
 *
 * Every /admin route except /login goes through `requireAdmin`. Until this existed
 * the routes were open: the CMS had a login screen, but it only gated the React
 * router, so anyone who could reach the host could read the enquiry inbox and delete
 * properties with a plain curl.
 *
 * The token is verified twice over: the signature proves we issued it, and the
 * lookup against `tokenList` proves it has not been revoked since. A signature check
 * alone would leave a stolen token valid until it expired, which is six months.
 */

const AUTH_HEADER = 'x-access-token';

/** Accepts `x-access-token: <jwt>` or `Authorization: Bearer <jwt>`. */
function readToken(req) {
    const direct = req.headers[AUTH_HEADER];
    if (direct) { return String(direct).trim(); }

    const authorization = req.headers.authorization;
    if (authorization && authorization.startsWith('Bearer ')) {
        return authorization.slice('Bearer '.length).trim();
    }

    return null;
}

async function requireAdmin(req, res, next) {
    try {
        const token = readToken(req);
        if (!token) {
            throw { statusCode: 401, message: 'Not signed in' };
        }

        let payload;
        try {
            payload = LIBRARY.jwt.verify(token, CONFIG.sessionSecret);
        } catch (error) {
            // Expired and malformed are the same answer to the caller. Saying which
            // helps nobody but someone probing the endpoint.
            throw { statusCode: 401, message: 'Session expired. Please sign in again.' };
        }

        const adminId = payload && payload.user && payload.user._id;
        if (!adminId) {
            throw { statusCode: 401, message: 'Session expired. Please sign in again.' };
        }

        const admin = await MODELS.Admin.findOne({ _id: adminId }).lean();

        if (!admin || admin.isActive === false) {
            throw { statusCode: 401, message: 'Session expired. Please sign in again.' };
        }

        // Revocation: logout removes the token from the list, so an old one stops
        // working immediately rather than lingering until it expires.
        if (!Array.isArray(admin.tokenList) || admin.tokenList.indexOf(token) < 0) {
            throw { statusCode: 401, message: 'Session expired. Please sign in again.' };
        }

        // Downstream controllers get the caller without another round trip, and
        // without the password hash.
        req.admin = {
            _id: admin._id,
            username: admin.username,
            name: admin.name,
            role: admin.role,
        };
        req.adminToken = token;

        next();
    } catch (error) {
        OUTPUT.responseError(res, error && error.statusCode ? error : {
            statusCode: 401,
            message: 'Not signed in',
        });
    }
}

/**
 * Routes only a superadmin may call. Layered on top of `requireAdmin`, never instead
 * of it — it assumes `req.admin` is already populated.
 *
 * Matches the CMS's own rule, where a missing role counts as superadmin because the
 * earliest admin records predate the field.
 */
function requireSuperAdmin(req, res, next) {
    const role = req.admin && req.admin.role;
    if (role && role !== 'superadmin') {
        return OUTPUT.responseError(res, {
            statusCode: 403,
            message: 'This account cannot make that change.',
        });
    }
    next();
}

module.exports = { requireAdmin, requireSuperAdmin };
