const { Types } = require('mongoose');
const { ObjectId } = Types;
const moment = require('moment');
const { generateReference, generateLookupToken } = require('../../../helper/reference');
const { allow } = require('../../../helper/throttle');
const { checkUser } = require('../../../helper/user');
const { sendEmail } = require('../../../helper/email');
const {
    emailEnquiryTeam,
    emailEnquiryGuest,
} = require('../../../helper/emailHTML/_enquiryFormat');

const KINDS = ['event', 'activity', 'custom'];
const BUDGET_BANDS = ['under_25m', '25m_50m', '50m_100m', 'over_100m', 'not_sure'];
const SOURCES = ['events_page', 'event_package', 'villa_page', 'confirmation', 'nav', 'direct'];

// Same email asking about the same date twice inside this window is one party
// changing their mind, not two enquiries. Two references for one party is a
// confusing conversation for whoever answers it.
const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

const PUBLIC_FIELDS = 'reference subject guest eventDate dateFlexible guestCount propertyName budgetBand occasionNote quote lastStatus status createdDate';

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

function trim(value, max = 2000) {
    if (typeof value !== 'string') { return undefined; }
    const out = value.trim();
    return out ? out.slice(0, max) : undefined;
}

/**
 * The message the guest arrives in WhatsApp holding. Its whole job is to make the
 * team's first reply an answer instead of six questions, so it leads with the
 * reference and carries what was actually asked for.
 */
function buildHandoffMessage(enquiry) {
    const bits = [`Hi, this is enquiry ${enquiry.reference}`];
    if (enquiry.subject && enquiry.subject.name) { bits.push(enquiry.subject.name); }
    if (enquiry.guestCount) { bits.push(`${enquiry.guestCount} guests`); }
    if (enquiry.eventDate) {
        bits.push(
            moment(enquiry.eventDate).format('D MMM YYYY') +
            (enquiry.dateFlexible ? ' (flexible)' : '')
        );
    }
    if (enquiry.propertyName) { bits.push(enquiry.propertyName); }
    return `${bits[0]} - ${bits.slice(1).join(', ')}.`;
}

function handoffUrl(message) {
    return `https://api.whatsapp.com/send?phone=${CONFIG.whatsappNumber}&text=${encodeURIComponent(message)}`;
}

/**
 * Drops undefined leaves so an update only writes what this submission actually
 * knew. Nested objects are flattened to dotted paths, because `$set: { subject: {...} }`
 * replaces the whole subdocument rather than merging into it.
 */
function prune(value, prefix = '') {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
        if (item === undefined) { continue; }
        const path = prefix ? `${prefix}.${key}` : key;
        const isPlainObject =
            item !== null &&
            typeof item === 'object' &&
            !Array.isArray(item) &&
            !(item instanceof Date) &&
            !(item instanceof ObjectId);

        if (isPlainObject) {
            Object.assign(out, prune(item, path));
        } else {
            out[path] = item;
        }
    }
    return out;
}

module.exports = {
    // POST /enquiry
    submitEnquiry: async (req, res) => {
        try {
            const body = req.body || {};

            // A field no human sees and no real submission fills. Answer 200 so the
            // bot cannot tell it was caught and start probing for what triggered it.
            if (trim(body.website)) {
                return OUTPUT.responseSuccess(res, { reference: null, handoffUrl: null });
            }

            if (!allow(`enquiry:${clientKey(req)}`, { max: 5, windowMs: 10 * 60 * 1000 })) {
                throw { statusCode: 429, message: 'Too many enquiries from this connection. Please try again shortly.' };
            }

            const firstName = trim(body.firstName, 80);
            const lastName = trim(body.lastName, 80);
            // Stored lowercase so the lookup, which matches on it exactly, still finds
            // the record when the guest typed John@Example.com and later types john@.
            const email = (trim(body.email, 160) || '').toLowerCase() || undefined;
            const phoneNumber = trim(body.phoneNumber, 40);

            if (!firstName) { throw { statusCode: 400, message: 'First name is required' } }
            if (!isEmail(email)) { throw { statusCode: 400, message: 'A valid email is required' } }
            if (!phoneNumber) { throw { statusCode: 400, message: 'Phone number is required' } }

            const kind = KINDS.includes(body.kind) ? body.kind : 'event';
            const source = SOURCES.includes(body.source) ? body.source : 'direct';
            const budgetBand = BUDGET_BANDS.includes(body.budgetBand) ? body.budgetBand : 'not_sure';

            const guestCount = Number(body.guestCount) > 0 ? Math.floor(Number(body.guestCount)) : undefined;
            const eventDate = body.eventDate ? new Date(body.eventDate) : undefined;
            if (eventDate && Number.isNaN(eventDate.getTime())) {
                throw { statusCode: 400, message: 'Event date is not a valid date' }
            }

            // Resolve the subject so the record and the WhatsApp message carry a real
            // name rather than whatever the client happened to post.
            let subject = { kind, ref: undefined, name: trim(body.subjectName, 160) };
            if (body.subjectRef && ObjectId.isValid(body.subjectRef)) {
                const model = kind === 'activity' ? MODELS.Activity : MODELS.EventPackage;
                const found = await model.findOne({ _id: body.subjectRef, isDeleted: { $ne: true } }).lean();
                if (found) {
                    subject.ref = found._id;
                    subject.name = found.name;
                }
            }

            let propertyRef;
            let propertyName = trim(body.propertyName, 160);
            if (body.propertyRef && ObjectId.isValid(body.propertyRef)) {
                const property = await MODELS.Properties.findOne({ _id: body.propertyRef }).lean();
                if (property) {
                    propertyRef = property._id;
                    propertyName = property.name;
                }
            }

            // An enquiry raised from a confirmation is the valuable kind: villa,
            // dates and party size are already known and need not be re-asked.
            let booking;
            let bookingId = trim(body.bookingId, 60);
            if (bookingId) {
                const found = await MODELS.Booking.findOne({ bookingId }).lean();
                if (found) {
                    booking = found._id;
                    if (!propertyRef && found.propertiesInfo) {
                        propertyRef = found.propertiesInfo.properties;
                        propertyName = propertyName || found.propertiesInfo.propertiesName;
                    }
                } else {
                    // Unknown ids are dropped rather than stored: a wrong booking id on
                    // a record is worse than none, because the team would act on it.
                    bookingId = undefined;
                }
            }

            const payload = {
                subject,
                guest: {
                    firstName,
                    lastName,
                    name: [firstName, lastName].filter(Boolean).join(' '),
                    email,
                    phoneNumber,
                    country: trim(body.country, 80),
                },
                booking,
                bookingId,
                eventDate,
                dateFlexible: Boolean(body.dateFlexible),
                guestCount,
                propertyRef,
                propertyName,
                budgetBand,
                occasionNote: trim(body.occasionNote, 4000),
                source,
                updatedDate: new Date(),
            };

            const user = await checkUser({
                name: payload.guest.name,
                firstName,
                lastName,
                title: trim(body.title, 20),
                phoneNumber,
                email,
                country: body.country,
            });
            if (user && user._id) { payload.user = user._id; }

            // Dedupe on the pair a person would consider "the same enquiry".
            const dedupeWindow = new Date(Date.now() - DEDUPE_WINDOW_MS);
            let enquiry = await MODELS.Enquiry.findOne({
                'guest.email': email,
                'subject.kind': kind,
                eventDate: eventDate || null,
                createdDate: { $gte: dedupeWindow },
                isDeleted: { $ne: true },
            });

            if (enquiry) {
                // A second submission enriches the record, it does not erase it. Setting
                // the whole payload would replace `subject` with a version whose name is
                // undefined - so a guest who enquired from the Birthdays page and then
                // again from the general page would lose the occasion they were reading.
                await MODELS.Enquiry.updateOne({ _id: enquiry._id }, { $set: prune(payload) });
                enquiry = await MODELS.Enquiry.findOne({ _id: enquiry._id }).lean();
            } else {
                const prefix = kind === 'activity' ? 'AC' : kind === 'custom' ? 'CU' : 'EV';
                enquiry = await MODELS.Enquiry.create({
                    ...payload,
                    reference: await generateReference(MODELS.Enquiry, prefix),
                    lookupToken: generateLookupToken(),
                    lastStatus: 'new',
                    status: [{ status: 'new', date: new Date() }],
                });
                enquiry = enquiry.toObject();
            }

            const message = buildHandoffMessage(enquiry);

            // Email regardless of channel: not every guest uses WhatsApp, and the
            // lookup link is the only durable copy of the reference they get.
            await sendEmail({
                title: `[New Enquiry] ${enquiry.reference} - ${subject.name || kind}`,
                textBody: '',
                htmlBody: emailEnquiryTeam({ data: enquiry }),
                email: CONFIG.teamEmail,
                allowCC: true,
            });
            await sendEmail({
                title: `We have your enquiry - ${enquiry.reference}`,
                textBody: '',
                htmlBody: emailEnquiryGuest({ data: enquiry }),
                email,
            });

            OUTPUT.responseSuccess(res, {
                reference: enquiry.reference,
                lookupToken: enquiry.lookupToken,
                handoffMessage: message,
                handoffUrl: handoffUrl(message),
            });
        } catch (error) {
            console.log('enquiry submit error', error)
            OUTPUT.responseError(res, error)
        }
    },

    // POST /enquiry/handoff - fire and forget, never blocks the redirect
    markHandoff: async (req, res) => {
        try {
            const { reference, channel } = req.body || {};
            if (!reference) { throw { statusCode: 400, message: 'Reference is required' } }

            await MODELS.Enquiry.updateOne(
                { reference: String(reference).toUpperCase() },
                {
                    $set: {
                        'handoff.channel': channel === 'email' ? 'email' : 'whatsapp',
                        'handoff.clickedAt': new Date(),
                    },
                }
            );

            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },

    // GET /lookup/:token - the magic link from the confirmation email
    lookupByToken: async (req, res) => {
        try {
            const { token } = req.params;
            if (!token || token.length < 32) { throw { statusCode: 404, message: 'Not found' } }

            const data = await MODELS.Enquiry.findOne(
                { lookupToken: token, isDeleted: { $ne: true } },
                PUBLIC_FIELDS
            ).lean();

            if (!data) { throw { statusCode: 404, message: 'Not found' } }

            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },

    // POST /lookup - reference plus the email it was made with
    lookupByReference: async (req, res) => {
        try {
            const { reference, email } = req.body || {};

            if (!allow(`lookup:${clientKey(req)}`, { max: 10, windowMs: 10 * 60 * 1000 })) {
                throw { statusCode: 429, message: 'Too many attempts. Please try again shortly.' };
            }

            // One response for "no such reference" and "wrong email". Distinguishing
            // them turns this form into an oracle for which emails are in the system.
            const notFound = { statusCode: 404, message: 'We could not find an enquiry with those details.' };

            if (!reference || !isEmail(email)) { throw notFound }

            const data = await MODELS.Enquiry.findOne(
                {
                    reference: String(reference).trim().toUpperCase(),
                    'guest.email': String(email).trim().toLowerCase(),
                    isDeleted: { $ne: true },
                },
                PUBLIC_FIELDS
            ).lean();

            if (!data) { throw notFound }

            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
}
