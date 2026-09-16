const { allow } = require('../../../helper/throttle');

const MIN_TOKEN_LENGTH = 32;
const MAX_REVIEW_LENGTH = 4000;

const clientKey = (req) => String(
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.ip ||
    'unknown'
)

const notFound = { statusCode: 404, message: 'This review link is not valid' };

/**
 * What the guest is shown before writing anything. Deliberately thin: the villa they
 * stayed at, their own name and the dates. No email, no booking total, no other
 * guest's data - whoever holds this link has proved nothing about who they are.
 */
const invitePayload = (invite, review) => ({
    propertyName: invite.propertyName || '',
    propertyImage: invite.propertyImage || '',
    guestName: invite.guestName || '',
    dates: invite.dates || [],
    bookingId: invite.bookingId || '',
    status: review ? 'submitted' : inviteStatus(invite),
    review: review ? {
        rating: review.rating,
        review: review.review,
        createdDate: review.createdDate,
    } : null,
})

const inviteStatus = (invite) => {
    if (invite.isRevoked) { return 'revoked' }
    if (invite.usedAt) { return 'submitted' }
    if (invite.expiresAt && new Date(invite.expiresAt) <= new Date()) { return 'expired' }
    return 'open'
}

const loadInvite = async (token) => {
    if (!token || String(token).length < MIN_TOKEN_LENGTH) { throw notFound }

    const invite = await MODELS.ReviewInvites.findOne({ token: String(token) }).lean()
    if (!invite) { throw notFound }

    return invite
}

module.exports = {
    // GET /review-invite/:token
    getReviewInvite: async (req, res) => {
        try {
            const { token } = req.params

            if (!allow(`review-invite:${clientKey(req)}`, { max: 30, windowMs: 10 * 60 * 1000 })) {
                throw { statusCode: 429, message: 'Too many attempts. Please try again shortly.' }
            }

            const invite = await loadInvite(token)

            const review = invite.review
                ? await MODELS.Reviews.findOne({ _id: invite.review, isDeleted: { $ne: true } }).lean()
                : null

            OUTPUT.responseSuccess(res, invitePayload(invite, review))
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },

    // POST /review-invite/:token
    // The link is the proof of stay. There is no email check here on purpose: it exists
    // for the guest whose booking was made under an address they cannot receive on -
    // an agent's, a partner's, a typo - which is exactly who the website form locks out.
    submitReviewInvite: async (req, res) => {
        try {
            const { token } = req.params
            const { rating, review, images } = req.body || {}

            if (!allow(`review-invite-submit:${clientKey(req)}`, { max: 10, windowMs: 10 * 60 * 1000 })) {
                throw { statusCode: 429, message: 'Too many attempts. Please try again shortly.' }
            }

            const invite = await loadInvite(token)
            const status = inviteStatus(invite)

            if (status === 'submitted') { throw { statusCode: 409, message: 'A review has already been submitted with this link' } }
            if (status === 'revoked') { throw notFound }
            if (status === 'expired') { throw { statusCode: 410, message: 'This review link has expired. Please ask us for a new one.' } }

            const score = Math.round(Number(rating))
            if (!Number.isFinite(score) || score < 1 || score > 5) {
                throw { statusCode: 400, message: 'Please choose a rating between 1 and 5 stars' }
            }

            const body = String(review || '').trim()
            if (!body) { throw { statusCode: 400, message: 'Please write a few words about your stay' } }

            // Guards a race between two tabs on the same link, and the case where the
            // guest also reviewed through the website in the meantime.
            const existing = await MODELS.Reviews.findOne({
                isDeleted: { $ne: true },
                $or: [
                    { booking: invite.booking },
                    ...(invite.user ? [{ propertyId: invite.propertyId, user: invite.user }] : []),
                ]
            }).lean()

            if (existing) {
                await MODELS.ReviewInvites.findOneAndUpdate(
                    { _id: invite._id, usedAt: null },
                    { $set: { usedAt: new Date(), review: existing._id, updatedDate: new Date() } }
                )
                throw { statusCode: 409, message: 'A review for this stay has already been submitted' }
            }

            const created = await MODELS.Reviews.create({
                propertyId: invite.propertyId,
                booking: invite.booking,
                user: invite.user || null,
                guestName: invite.guestName || '',
                rating: score,
                review: body.slice(0, MAX_REVIEW_LENGTH),
                images: Array.isArray(images) ? images.filter((image) => typeof image === 'string').slice(0, 6) : [],
                source: 'invite',
            })

            // Conditional on usedAt so two simultaneous submits cannot both claim it.
            await MODELS.ReviewInvites.findOneAndUpdate(
                { _id: invite._id, usedAt: null },
                { $set: { usedAt: new Date(), review: created._id, updatedDate: new Date() } }
            )

            OUTPUT.responseSuccess(res, invitePayload(invite, created.toObject()))
        } catch (error) {
            console.log('review invite submit error', error)
            OUTPUT.responseError(res, error)
        }
    },
}
