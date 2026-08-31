const mongoose = require("mongoose");
const moment = require("moment");
const { ObjectId } = mongoose.Types;

const { WEEKDAYS } = require("../../../helper/activityRates");

// Only these come off the request body. Spreading the raw body would let a caller
// set isDeleted, createdDate or anything else the CMS happens to be holding.
const ACTIVITY_FIELDS = [
    'activityImage',
    'name',
    'key',
    'summary',
    'description',
    'highlights',
    'category',
    'region',
    'regionId',
    'location',
    'locationId',
    'meetingPoint',
    'mapInfo',
    'durationMinutes',
    'pricing',
    'childMaxAge',
    'capacityPerDay',
    'disabledDate',
    'inclusions',
    'exclusions',
    'whatToBring',
    'cancellationPolicy',
    'supplier',
    'sortOrder',
];

const VALID_STATUS = ['draft', 'published'];
const CATEGORIES = ['tour', 'transfer', 'wellness', 'water', 'culture', 'adventure', 'class'];

function resolveStatus(value) {
    return VALID_STATUS.indexOf(value) >= 0 ? value : 'published';
}

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

/**
 * A draft can be as incomplete as ops likes. A published activity is a public URL
 * with a price on it, so the things a guest needs are required at the moment of
 * publishing rather than at the moment of typing.
 */
function assertPublishable(body) {
    if (!body.name || !String(body.name).trim()) {
        throw { statusCode: 400, message: 'Name is required to publish' }
    }
    if (!body.summary || !String(body.summary).trim()) {
        throw { statusCode: 400, message: 'Summary is required to publish - it is the card and the meta description' }
    }
    if (!CATEGORIES.includes(body.category)) {
        throw { statusCode: 400, message: `Category must be one of: ${CATEGORIES.join(', ')}` }
    }
    if (!Array.isArray(body.activityImage) || body.activityImage.length === 0) {
        throw { statusCode: 400, message: 'At least one image is required to publish' }
    }
    const adult = body.pricing && Number(body.pricing.adult)
    if (!adult || adult <= 0) {
        throw { statusCode: 400, message: 'An adult price is required to publish' }
    }
}

function pick(body) {
    const doc = {}
    for (const field of ACTIVITY_FIELDS) {
        if (body[field] !== undefined) { doc[field] = body[field] }
    }

    // Money is IDR integers everywhere else in this system; keep it that way here.
    if (doc.pricing) {
        doc.pricing = {
            basis: doc.pricing.basis === 'per_group' ? 'per_group' : 'per_person',
            adult: Math.round(Number(doc.pricing.adult) || 0),
            child: Math.round(Number(doc.pricing.child) || 0),
            minPax: Number(doc.pricing.minPax) > 0 ? Math.floor(Number(doc.pricing.minPax)) : 1,
            maxPax: Number(doc.pricing.maxPax) > 0 ? Math.floor(Number(doc.pricing.maxPax)) : undefined,
        }
    }

    return doc
}

function getDates(startDate, stopDate) {
    const out = []
    let cursor = moment(startDate)
    const stop = moment(stopDate)
    let guard = 0
    while (cursor.isSameOrBefore(stop) && guard < 400) {
        out.push(cursor.format('YYYY-MM-DD'))
        cursor = cursor.add(1, 'days')
        guard += 1
    }
    return out
}

// `day` arrives from the CMS as a bare string, a { label } option, or an array.
// The schema declares an Array, so normalise before it reaches Mongoose.
function normaliseDays(value) {
    const raw = Array.isArray(value) ? value : (value === null || value === undefined || value === '' ? [] : [value])
    const days = raw
        .map((entry) => (entry && typeof entry === 'object') ? (entry.label || entry.value) : entry)
        .filter((day) => WEEKDAYS.indexOf(day) >= 0)
    return days.length > 0 ? days : null
}

function normaliseDates(rule) {
    if (rule.dateStart && rule.dateEnd) { return getDates(new Date(rule.dateStart), new Date(rule.dateEnd)) }
    if (Array.isArray(rule.date) && rule.date.length > 0) { return rule.date }
    if (typeof rule.date === 'string' && rule.date) { return [rule.date] }
    return null
}

/**
 * Rules the CMS sent, plus the base row built from the activity's own pricing so a
 * lookup always terminates somewhere. Mirrors buildPriceDocs for rooms.
 */
function buildPriceDocs(body, activityId, basePricing) {
    const rules = Array.isArray(body.priceList) ? body.priceList : []

    const docs = rules
        .filter((rule) => Number(rule.adultPrice) > 0 || Number(rule.childPrice) > 0)
        .map((rule) => ({
            activity: activityId,
            date: normaliseDates(rule),
            day: normaliseDays(rule.day),
            adultPrice: Math.round(Number(rule.adultPrice) || 0),
            childPrice: Math.round(Number(rule.childPrice) || 0),
            isDeleted: false,
        }))
        // A rule matching neither a date nor a weekday is the base row in disguise; it
        // would shadow nothing and confuse the editor, so it is dropped.
        .filter((doc) => doc.date || doc.day)

    docs.push({
        activity: activityId,
        date: null,
        day: null,
        adultPrice: basePricing.adult,
        childPrice: basePricing.child,
        isDeleted: false,
    })

    return docs
}

/** Slugs are the public URL. Two activities sharing one would make a page unreachable. */
async function uniqueKey(desired, name, excludeId) {
    const base = slugify(desired) || slugify(name) || 'activity'
    let candidate = base
    for (let i = 2; i < 50; i++) {
        const clash = await MODELS.Activity.findOne({
            key: candidate,
            isDeleted: { $ne: true },
            ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        }).lean()
        if (!clash) { return candidate }
        candidate = `${base}-${i}`
    }
    throw { statusCode: 400, message: 'Could not allocate a unique key for this activity' }
}

module.exports = {
    getActivities: async (req, res) => {
        try {
            let { query } = req
            let { page, limit, name, category, region, status } = query
            page = Number(page) || 0
            limit = Number(limit) || 20

            let queryParams = { isDeleted: { $ne: true } }

            if (name) { queryParams.name = { $regex: name, $options: 'i' } }
            if (category) { queryParams.category = category }
            if (region) { queryParams.regionId = region }

            if (status && VALID_STATUS.indexOf(status) >= 0) {
                queryParams.status = status === 'published'
                    ? { $ne: 'draft' }
                    : 'draft'
            }

            let [data, totalData] = await Promise.all([
                MODELS.Activity.find(queryParams)
                    .sort({ updatedDate: -1 })
                    .limit(limit)
                    .skip(page * limit)
                    .lean(),
                MODELS.Activity.countDocuments(queryParams),
            ])

            OUTPUT.responseSuccess(res, { data, totalData, page, limit })
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },

    getActivityDetail: async (req, res) => {
        try {
            let { id } = req.params

            let data = ObjectId.isValid(id)
                ? await MODELS.Activity.findOne({ _id: id, isDeleted: { $ne: true } }).lean()
                : await MODELS.Activity.findOne({ key: id, isDeleted: { $ne: true } }).lean()

            if (!data) { throw { statusCode: 404, message: "Activity not found" } }

            // Only the overrides. The base row is the activity's own pricing and the
            // editor already has it - showing it twice invites someone to edit the copy.
            data.priceList = await MODELS.ActivityPrice.find({
                activity: data._id,
                isDeleted: { $ne: true },
                $or: [
                    { date: { $nin: [null, []] } },
                    { day: { $nin: [null, []] } },
                ],
            }).lean()

            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },

    createActivity: async (req, res) => {
        try {
            let { body } = req
            const status = resolveStatus(body.status)

            if (status === 'published') { assertPublishable(body) }

            const doc = pick(body)
            doc.key = await uniqueKey(body.key, body.name)
            doc.status = status

            const activity = await MODELS.Activity.create(doc)

            await MODELS.ActivityPrice.insertMany(
                buildPriceDocs(body, activity._id, doc.pricing || { adult: 0, child: 0 })
            )

            OUTPUT.responseSuccess(res, activity)
        } catch (error) {
            console.log('createActivity failed:', error && error.message ? error.message : error)
            OUTPUT.responseError(res, error)
        }
    },

    updateActivity: async (req, res) => {
        try {
            let { body } = req

            if (!ObjectId.isValid(body._id)) { throw { statusCode: 400, message: 'Invalid activity id' } }

            const current = await MODELS.Activity.findOne({ _id: body._id, isDeleted: { $ne: true } }).lean()
            if (!current) { throw { statusCode: 404, message: "Activity not found" } }

            // An absent status means "leave it as it is" - an autosave must never
            // silently publish a draft or unpublish a live activity.
            const status = body.status ? resolveStatus(body.status) : (current.status || 'published')
            if (status === 'published') {
                assertPublishable({ ...current, ...pick(body) })
            }

            const doc = pick(body)
            doc.status = status
            doc.updatedDate = new Date()

            if (body.key !== undefined || !current.key) {
                doc.key = await uniqueKey(body.key || current.key, body.name || current.name, current._id)
            }

            const activity = await MODELS.Activity.findOneAndUpdate(
                { _id: current._id },
                { $set: doc },
                { new: true }
            )

            // The editor always posts the full rule set, so the previous one is replaced
            // rather than diffed - a rule removed in the CMS has to disappear here too.
            if (body.priceList !== undefined || doc.pricing) {
                await MODELS.ActivityPrice.deleteMany({ activity: current._id })
                await MODELS.ActivityPrice.insertMany(
                    buildPriceDocs(body, current._id, doc.pricing || current.pricing || { adult: 0, child: 0 })
                )
            }

            OUTPUT.responseSuccess(res, activity)
        } catch (error) {
            console.log('updateActivity failed:', error && error.message ? error.message : error)
            OUTPUT.responseError(res, error)
        }
    },

    hideActivity: async (req, res) => {
        try {
            let { activityId } = req.params
            if (!ObjectId.isValid(activityId)) { throw { statusCode: 400, message: 'Invalid activity id' } }

            const current = await MODELS.Activity.findOne({ _id: activityId }).lean()
            if (!current) { throw { statusCode: 404, message: "Activity not found" } }

            await MODELS.Activity.updateOne(
                { _id: activityId },
                { $set: { isActive: current.isActive === false, updatedDate: new Date() } }
            )

            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },

    // Soft delete. Activities carry orders once booking lands, and the hard delete on
    // properties is exactly why bookings there can end up orphaned.
    deleteActivity: async (req, res) => {
        try {
            let { activityId } = req.params
            if (!ObjectId.isValid(activityId)) { throw { statusCode: 400, message: 'Invalid activity id' } }

            await MODELS.Activity.updateOne(
                { _id: activityId },
                { $set: { isDeleted: true, updatedDate: new Date() } }
            )

            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
}
