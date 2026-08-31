const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const VALID_STATUS = ['new', 'in_conversation', 'quoted', 'won', 'lost', 'closed'];

// An enquiry with no team response after this long is the thing the panel exists to
// catch - the guest may have opened WhatsApp and never sent anything.
const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

module.exports = {
    getEnquiries: async (req, res) => {
        try {
            let { query } = req
            let { page, limit, kind, status, source, reference, search } = query
            page = Number(page) || 0
            limit = Number(limit) || 20

            let queryParams = { isDeleted: { $ne: true } }

            if (kind) { queryParams['subject.kind'] = kind }
            if (status && VALID_STATUS.indexOf(status) >= 0) { queryParams.lastStatus = status }
            if (source) { queryParams.source = source }
            if (reference) { queryParams.reference = String(reference).trim().toUpperCase() }
            if (search) {
                queryParams.$or = [
                    { 'guest.name': { $regex: search, $options: 'i' } },
                    { 'guest.email': { $regex: search, $options: 'i' } },
                    { 'guest.phoneNumber': { $regex: search, $options: 'i' } },
                    { propertyName: { $regex: search, $options: 'i' } },
                ]
            }

            // Soonest event first. A party next week outranks one in eight months,
            // which a created-date sort gets exactly backwards.
            let [data, totalData] = await Promise.all([
                MODELS.Enquiry.find(queryParams)
                    .sort({ eventDate: 1, createdDate: -1 })
                    .limit(limit)
                    .skip(page * limit)
                    .lean(),
                MODELS.Enquiry.countDocuments(queryParams),
            ])

            const now = Date.now()
            data = data.map((row) => ({
                ...row,
                // "Opened WhatsApp", never "chatted" - we cannot see whether they
                // pressed send, and a team that trusts a false signal stops chasing.
                handoffOpened: Boolean(row.handoff && row.handoff.clickedAt),
                needsReply:
                    row.lastStatus === 'new' &&
                    now - new Date(row.createdDate).getTime() > STALE_AFTER_MS,
            }))

            OUTPUT.responseSuccess(res, { data, totalData, page, limit })
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },

    getEnquiryDetail: async (req, res) => {
        try {
            let { id } = req.params

            const data = ObjectId.isValid(id)
                ? await MODELS.Enquiry.findOne({ _id: id }).lean()
                : await MODELS.Enquiry.findOne({ reference: String(id).toUpperCase() }).lean()

            if (!data) { throw { statusCode: 404, message: "Enquiry not found" } }

            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },

    updateEnquiryStatus: async (req, res) => {
        try {
            let { body } = req
            let { _id, status, quoteAmount, quoteValidUntil, internalNote } = body

            if (!ObjectId.isValid(_id)) { throw { statusCode: 400, message: 'Invalid enquiry id' } }

            const current = await MODELS.Enquiry.findOne({ _id }).lean()
            if (!current) { throw { statusCode: 404, message: "Enquiry not found" } }

            const set = { updatedDate: new Date() }
            const push = {}

            if (status) {
                if (VALID_STATUS.indexOf(status) < 0) {
                    throw { statusCode: 400, message: `Status must be one of: ${VALID_STATUS.join(', ')}` }
                }
                set.lastStatus = status
                push.status = { status, date: new Date() }
            }

            if (quoteAmount !== undefined && quoteAmount !== null && quoteAmount !== '') {
                const amount = Math.round(Number(quoteAmount))
                if (!Number.isFinite(amount) || amount < 0) {
                    throw { statusCode: 400, message: 'Quote amount must be a positive number' }
                }
                set['quote.amount'] = amount
                set['quote.sentAt'] = new Date()
                if (quoteValidUntil) { set['quote.validUntil'] = new Date(quoteValidUntil) }
            }

            if (internalNote !== undefined) { set.internalNote = String(internalNote).slice(0, 8000) }

            const update = { $set: set }
            if (push.status) { update.$push = push }

            const updated = await MODELS.Enquiry.findOneAndUpdate({ _id }, update, { new: true })

            OUTPUT.responseSuccess(res, updated)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },
}
