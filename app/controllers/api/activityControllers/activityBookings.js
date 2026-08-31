const { Types } = require('mongoose');
const moment = require('moment');
const { ObjectId } = Types;

const { checkUser } = require('../../../helper/user');
const { randomString, createInvoice } = require('../../../helper/order');
const { resolveRateOn } = require('../../../helper/activityRates');
const { assertKind } = require('../../../helper/coupon');
const { sendEmail } = require('../../../helper/email');
const { allow } = require('../../../helper/throttle');

// Statuses an activity order moves through. Deliberately not the villa vocabulary -
// there is no check-in or check-out here.
const STATUS_FLOW = ['waiting_payment', 'paid', 'confirmed', 'cancelled', 'refunded'];

// Seats held by orders that are still live. A cancelled or refunded order releases
// its seats; an unpaid one does not, because the guest is mid-checkout.
const HOLDING_STATUSES = ['waiting_payment', 'paid', 'confirmed'];

function clientKey(req) {
    return (
        req.headers['cf-connecting-ip'] ||
        (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        req.ip ||
        'unknown'
    );
}

function isEmail(value) {
    return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function trim(value, max = 500) {
    if (typeof value !== 'string') { return undefined }
    const out = value.trim();
    return out ? out.slice(0, max) : undefined;
}

/** Seats already committed on a date, across every live order for that activity. */
async function seatsTaken(activityId, date) {
    const orders = await MODELS.ActivityBooking.find({
        'activityInfo.activity': activityId,
        date,
        lastStatus: { $in: HOLDING_STATUSES },
        isDeleted: { $ne: true },
    }, 'pax').lean();

    return orders.reduce((total, order) => (
        total + ((order.pax && order.pax.adult) || 0) + ((order.pax && order.pax.child) || 0)
    ), 0);
}

/**
 * The price of a party on a date, computed from what is stored — never from what the
 * client sent. A total that arrives in the request body is a number the guest can edit.
 */
function quote({ activity, rules, date, adult, child }) {
    const base = {
        adult: (activity.pricing || {}).adult || 0,
        child: (activity.pricing || {}).child || 0,
    };
    const rate = resolveRateOn(rules, date, base);

    if ((activity.pricing || {}).basis === 'per_group') {
        return {
            chargedAdults: adult,
            rates: rate,
            subtotal: Math.round(rate.adult || 0),
            minimumApplied: false,
        };
    }

    // Below the minimum party size the shortfall is billed at the adult rate - that is
    // what the supplier charges us for the departure.
    const minimum = Math.max(1, (activity.pricing || {}).minPax || 1);
    const heads = adult + child;
    const shortfall = Math.max(0, minimum - heads);
    const chargedAdults = adult + shortfall;

    return {
        chargedAdults,
        rates: rate,
        subtotal: Math.round(chargedAdults * (rate.adult || 0) + child * (rate.child || 0)),
        minimumApplied: shortfall > 0,
    };
}

/** Mirrors the villa discount maths, minus the per-night mode, which has no meaning here. */
function discountFor(coupon, subtotal) {
    if (!coupon || !coupon.amount || coupon.amount <= 0 || subtotal <= 0) { return 0 }
    const raw = coupon.couponType === 'percentage'
        ? Math.round(subtotal * (coupon.amount / 100))
        : Math.round(coupon.amount);
    return Math.min(Math.max(raw, 0), subtotal);
}

async function loadPublishedActivity(id) {
    const isObjectId = ObjectId.isValid(id);
    const activity = await MODELS.Activity.findOne({
        ...(isObjectId ? { _id: id } : { key: id }),
        status: { $ne: 'draft' },
        isDeleted: { $ne: true },
        isActive: { $ne: false },
    }).lean();
    if (!activity) { throw { statusCode: 404, message: 'Activity not found' } }
    return activity;
}

/** Everything the booking and quote endpoints both need. Read once, used by both. */
async function priceContext(activity, date, adult, child) {
    if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
        throw { statusCode: 400, message: 'A valid date is required' };
    }
    if (date < moment().format('YYYY-MM-DD')) {
        throw { statusCode: 400, message: 'That date has passed' };
    }
    if ((activity.disabledDate || []).indexOf(date) >= 0) {
        throw { statusCode: 409, message: 'This activity is not running on that date' };
    }

    const maxPax = (activity.pricing || {}).maxPax;
    if (maxPax && adult + child > maxPax) {
        throw { statusCode: 400, message: `This activity takes at most ${maxPax} people at once` };
    }

    const rules = await MODELS.ActivityPrice.find({
        activity: activity._id,
        isDeleted: { $ne: true },
    }).lean();

    return quote({ activity, rules, date, adult, child });
}

module.exports = {
    /**
     * POST /activity/quote
     * The price the site should display, straight from the server. The booking
     * endpoint recomputes it anyway; this exists so the two can never disagree.
     */
    quoteActivityBooking: async (req, res) => {
        try {
            const { activityId, date, adult, child, couponCode } = req.body || {};

            const activity = await loadPublishedActivity(activityId);
            const adults = Math.max(1, Math.floor(Number(adult) || 1));
            const children = Math.max(0, Math.floor(Number(child) || 0));

            const priced = await priceContext(activity, date, adults, children);

            let coupon = null;
            let discount = 0;
            if (couponCode) {
                coupon = await MODELS.Coupon.findOne({ couponCode: String(couponCode).toUpperCase() }).lean();
                if (coupon) {
                    assertKind(coupon, 'activities');
                    if (coupon.minimumPurchase && coupon.minimumPurchase > priced.subtotal) {
                        throw { statusCode: 400, message: `Coupon needs a minimum spend of ${coupon.minimumPurchase}` };
                    }
                    discount = discountFor(coupon, priced.subtotal);
                }
            }

            const capacity = activity.capacityPerDay || null;
            const taken = capacity ? await seatsTaken(activity._id, date) : 0;

            OUTPUT.responseSuccess(res, {
                date,
                rates: priced.rates,
                chargedAdults: priced.chargedAdults,
                minimumApplied: priced.minimumApplied,
                subtotal: priced.subtotal,
                discount,
                totalPrice: priced.subtotal - discount,
                seatsRemaining: capacity ? Math.max(0, capacity - taken) : null,
            });
        } catch (error) {
            console.log('quoteActivityBooking', error && error.message ? error.message : error);
            OUTPUT.responseError(res, error);
        }
    },

    /**
     * POST /activity/booking
     *
     * Creates a real, payable order. Three things are done server-side on purpose:
     * seats are re-counted immediately before the invoice, the total is recomputed
     * from stored prices, and the coupon scope is enforced. All three are cheap here
     * and impossible to retrofit once money has moved.
     */
    submitActivityBooking: async (req, res) => {
        try {
            const body = req.body || {};

            if (!allow(`activity-booking:${clientKey(req)}`, { max: 10, windowMs: 10 * 60 * 1000 })) {
                throw { statusCode: 429, message: 'Too many attempts. Please try again shortly.' };
            }

            const firstName = trim(body.firstName, 80);
            const lastName = trim(body.lastName, 80);
            const email = (trim(body.email, 160) || '').toLowerCase() || undefined;
            const phoneNumber = trim(body.phoneNumber, 40);

            if (!firstName) { throw { statusCode: 400, message: 'First name is required' } }
            if (!isEmail(email)) { throw { statusCode: 400, message: 'A valid email is required' } }
            if (!phoneNumber) { throw { statusCode: 400, message: 'Phone number is required' } }

            // Xendit rejects a malformed mobile number, and it does so *after* the order
            // row exists - leaving an unpaid order nobody can pay. Cheaper to catch here.
            if (String(phoneNumber).replace(/\D/g, '').length < 9) {
                throw { statusCode: 400, message: 'Please enter a full phone number, including the area code' };
            }

            const activity = await loadPublishedActivity(body.activityId);
            const date = trim(body.date, 10);
            const adults = Math.max(1, Math.floor(Number(body.adult) || 1));
            const children = Math.max(0, Math.floor(Number(body.child) || 0));

            const priced = await priceContext(activity, date, adults, children);

            // Seats are counted here, as late as possible, so two guests racing for the
            // last places cannot both succeed. Nothing else in this codebase locks
            // inventory; this is the one place it matters enough to.
            const capacity = activity.capacityPerDay || null;
            if (capacity) {
                const taken = await seatsTaken(activity._id, date);
                const remaining = capacity - taken;
                if (adults + children > remaining) {
                    throw {
                        statusCode: 409,
                        message: remaining > 0
                            ? `Only ${remaining} place${remaining > 1 ? 's' : ''} left on that date`
                            : 'That date is fully booked',
                    };
                }
            }

            let voucherInfo = null;
            let discount = 0;
            if (body.couponCode) {
                const coupon = await MODELS.Coupon.findOne({
                    couponCode: String(body.couponCode).toUpperCase(),
                }).lean();
                if (!coupon) { throw { statusCode: 400, message: 'Coupon not found' } }
                if (coupon.isActive === false) { throw { statusCode: 400, message: 'Coupon is no longer active' } }
                assertKind(coupon, 'activities');
                if (coupon.minimumPurchase && coupon.minimumPurchase > priced.subtotal) {
                    throw { statusCode: 400, message: `Coupon needs a minimum spend of ${coupon.minimumPurchase}` };
                }
                discount = discountFor(coupon, priced.subtotal);
                voucherInfo = {
                    voucherCode: coupon.couponCode,
                    nominal: discount,
                    discountType: coupon.couponType,
                    couponUsage: coupon.couponUsage,
                };
            }

            const totalPrice = priced.subtotal - discount;

            const user = await checkUser({
                name: `${firstName} ${lastName || ''}`.trim(),
                firstName,
                lastName,
                phoneNumber,
                email,
                country: body.country,
            });

            const activityBookingId = `AB${Date.now()}${randomString(6)}`;

            const order = await MODELS.ActivityBooking.create({
                activityBookingId,
                user: user && user._id ? user._id : undefined,
                activityInfo: {
                    activity: activity._id,
                    name: activity.name,
                    key: activity.key,
                    image: activity.activityImage || [],
                    meetingPoint: activity.meetingPoint,
                    durationMinutes: activity.durationMinutes,
                    category: activity.category,
                    region: activity.region,
                },
                date,
                pax: {
                    adult: adults,
                    child: children,
                    childrenAge: Array.isArray(body.childrenAge) ? body.childrenAge : [],
                },
                priceDetails: [{
                    date,
                    adultRate: priced.rates.adult,
                    childRate: priced.rates.child,
                    chargedAdults: priced.chargedAdults,
                    child: children,
                    minimumApplied: priced.minimumApplied,
                }],
                guestInfo: {
                    name: `${firstName} ${lastName || ''}`.trim(),
                    firstName,
                    lastName,
                    phoneNumber,
                    email,
                    country: trim(body.country, 80),
                },
                pickupArea: trim(body.pickupArea, 200),
                specialRequest: trim(body.specialRequest, 2000),
                voucherInfo,
                subtotal: priced.subtotal,
                totalPrice,
                lastStatus: 'waiting_payment',
                status: STATUS_FLOW.map((status) => ({
                    status,
                    date: status === 'waiting_payment' ? new Date() : null,
                })),
            });

            const { data: invoice, error } = await createInvoice({
                externalId: activityBookingId,
                amount: totalPrice,
                customer: {
                    given_names: firstName,
                    surname: lastName || '',
                    email,
                    mobile_number: String(phoneNumber).replace(/^08/, '+628'),
                },
                items: [{
                    name: activity.name,
                    quantity: adults + children,
                    price: totalPrice,
                    category: activity.category || 'Activity',
                }],
            });

            if (error || !invoice || !invoice.invoice_url) {
                // The order exists and is unpaid. Left in place rather than deleted so
                // the team can see the attempt and re-issue a link.
                throw { statusCode: 502, message: 'Could not start the payment. Nothing has been charged.' };
            }

            const saved = await MODELS.ActivityBooking.findOneAndUpdate(
                { _id: order._id },
                { paymentLink: invoice.invoice_url },
                { new: true },
            );

            await sendEmail({
                title: `[New Activity Order] ${activityBookingId} - ${activity.name}`,
                textBody: '',
                htmlBody: `<p>${activity.name} on ${date} for ${adults} adult(s) and ${children} child(ren).</p>`,
                email: CONFIG.teamEmail,
                allowCC: true,
            });

            OUTPUT.responseSuccess(res, {
                activityBookingId,
                paymentLink: saved.paymentLink,
                subtotal: priced.subtotal,
                discount,
                totalPrice,
            });
        } catch (error) {
            console.log('submitActivityBooking', error && error.message ? error.message : error);
            OUTPUT.responseError(res, error);
        }
    },
};
