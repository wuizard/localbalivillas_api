const { Types } = require('mongoose');
const moment = require('moment');
const { ObjectId } = Types;

const { resolveRateOn, datesBetween } = require('../../../helper/activityRates');

// A calendar never paints more than a couple of months at once, and an unbounded
// range is a cheap way to make the server do a lot of work.
const MAX_AVAILABILITY_DAYS = 120;

// Supplier contacts are operational data. They never leave the admin side.
const PUBLIC_PROJECTION = { supplier: 0, __v: 0 };

// Drafts are CMS work in progress; deleted rows keep their orders readable but are
// gone from the catalogue. Every public read starts from this.
const publicFilter = (extra = {}) => ({
    status: { $ne: 'draft' },
    isDeleted: { $ne: true },
    isActive: { $ne: false },
    ...extra,
});

module.exports = {
    getActivities: async (req, res) => {
        try {
            let { query } = req
            let { category, region, location, search, limit, page } = query

            let params = publicFilter()

            if (category) { params.category = category }
            if (region) { params.region = { $regex: region, $options: 'i' } }
            if (location) { params.location = { $regex: location, $options: 'i' } }
            if (search) {
                params.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { summary: { $regex: search, $options: 'i' } },
                ]
            }

            let perPage = Number(limit) > 0 ? Number(limit) : 0
            let skip = (Number(page) > 0 && perPage) ? (Number(page) - 1) * perPage : 0

            let data = await MODELS.Activity.find(params, PUBLIC_PROJECTION)
                .sort({ sortOrder: 1, createdDate: -1 })
                .skip(skip)
                .limit(perPage)
                .lean()

            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },

    getActivityDetail: async (req, res) => {
        try {
            let { params } = req
            let { id } = params

            // Accepts a slug or an ObjectId, the way /property/:id does.
            let isObjectId = ObjectId.isValid(id)
            let data = await MODELS.Activity.findOne(
                publicFilter(isObjectId ? { _id: id } : { key: id }),
                PUBLIC_PROJECTION
            ).lean()

            if (!data) { throw { statusCode: 404, message: "Activity not found" } }

            data.priceList = await MODELS.ActivityPrice.find({
                activity: data._id,
                isDeleted: { $ne: true },
            }).lean()

            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },

    /**
     * GET /activity/:id/availability?from=&to=
     *
     * One request per calendar paint: the resolved adult and child rate for each date,
     * and whether the date is open at all.
     *
     * `seatsRemaining` is capacity minus what is already booked. Nothing can book an
     * activity yet, so it is capacity today - it is computed here rather than hardcoded
     * so the booking release changes one query and not this contract.
     */
    getActivityAvailability: async (req, res) => {
        try {
            let { id } = req.params
            let { from, to } = req.query

            const isObjectId = ObjectId.isValid(id)
            const activity = await MODELS.Activity.findOne(
                publicFilter(isObjectId ? { _id: id } : { key: id }),
                PUBLIC_PROJECTION
            ).lean()

            if (!activity) { throw { statusCode: 404, message: "Activity not found" } }

            const start = moment(from, 'YYYY-MM-DD', true).isValid() ? from : moment().format('YYYY-MM-DD')
            let end = moment(to, 'YYYY-MM-DD', true).isValid() ? to : moment(start).add(60, 'days').format('YYYY-MM-DD')

            if (moment(end).diff(moment(start), 'days') > MAX_AVAILABILITY_DAYS) {
                end = moment(start).add(MAX_AVAILABILITY_DAYS, 'days').format('YYYY-MM-DD')
            }

            const rules = await MODELS.ActivityPrice.find({
                activity: activity._id,
                isDeleted: { $ne: true },
            }).lean()

            const base = {
                adult: (activity.pricing || {}).adult || 0,
                child: (activity.pricing || {}).child || 0,
            }

            const blocked = new Set(activity.disabledDate || [])
            const today = moment().format('YYYY-MM-DD')

            const days = datesBetween(start, end).map((date) => {
                const rate = resolveRateOn(rules, date, base)
                // A date in the past is not "sold out", it is simply gone. Both are
                // unselectable, but only one of them is worth explaining to a guest.
                const past = date < today
                return {
                    date,
                    adult: rate.adult || 0,
                    child: rate.child || 0,
                    blocked: blocked.has(date),
                    past,
                    available: !past && !blocked.has(date),
                    seatsRemaining: activity.capacityPerDay || null,
                }
            })

            OUTPUT.responseSuccess(res, {
                key: activity.key,
                basis: (activity.pricing || {}).basis || 'per_person',
                minPax: (activity.pricing || {}).minPax || 1,
                maxPax: (activity.pricing || {}).maxPax || null,
                childMaxAge: activity.childMaxAge || null,
                from: start,
                to: end,
                days,
            })
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },
}
