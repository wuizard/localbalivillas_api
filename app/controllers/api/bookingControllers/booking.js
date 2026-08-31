const { sendEmail } = require("../../../helper/email")
const { emailLBVNewBooking } = require("../../../helper/emailHTML/_emailFormat")
const { randomString, createPaymentLink } = require("../../../helper/order")
const { checkUser } = require("../../../helper/user")
const { assertKind } = require("../../../helper/coupon")
const { allow } = require("../../../helper/throttle")

// A cancelled or refunded stay is not a stay. Anything else on the timeline still
// means someone is expected at the villa on those dates.
const STAYING_STATUSES = ['waiting_confirmation', 'confirmed', 'checkout']

function clientKey(req) {
    return (
        req.headers['cf-connecting-ip'] ||
        (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        req.ip ||
        'unknown'
    )
}

function isEmail(value) {
    return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

module.exports = {
    getBookings: async (req, res) => { 
        try {
            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
    submitBookings: async (req, res) => {
        try {
            let { body } = req
            let { firstName, lastName, phoneNumber, country, email, title, 
                roomId, placeId, priceList, adult, kids,
                placeName, roomDetail, roomName, days, 
                arrivalTime, specialRequest, subtotal, voucherInfo, totalPrice, childrenAge, rooms
            } = body
            
            let user = await checkUser({
                name: `${firstName} ${lastName}`,
                phoneNumber,
                email,
                firstName,
                lastName,
                title,
                country
            })

            let placeDetail = await MODELS.Properties.findOne({
                _id: placeId
            }).lean()

            let timeStamp = Date.now()
            let bookingId = `B${timeStamp}${randomString(6)}`

            let order = await MODELS.Booking.create({
                bookingId: bookingId,
                user: user,
                room: roomId,
                propertiesInfo: {
                    properties: placeId,
                    room: roomId,
                    placeImage: placeDetail.propertyImage,
                    roomImage: roomDetail.propertyImage,
                    propertiesName: placeName,
                    roomName: roomName,
                    detail: {
                        facilities: roomDetail.facilities,
                        amenities: roomDetail.amenities,
                        name: roomDetail.name,
                        room: roomDetail.room
                    },
                    price: priceList
                },
                dates: days,
                priceDetails: priceList,
                guestInfo: {
                    name: `${firstName} ${lastName}`,
                    phoneNumber,
                    email,
                    firstName,
                    lastName,
                    adult: adult,
                    kids: kids,
                    childrenAge
                },
                status: [
                    {
                        status: "waiting_confirmation",
                        date: new Date()
                    },
                    {
                        status: "confirmed",
                        date: null
                    },
                    {
                        status: "checkout",
                        date: null
                    },
                    {
                        status: "paid",
                        date: null
                    },
                    {
                        status: "refund",
                        date: null
                    },
                ], // waiting_confirmation, confirmed, refund
                lastStatus: "waiting_confirmation",
                totalRooms: rooms,
                arrivalTime: arrivalTime, 
                specialRequest: specialRequest,
                voucherInfo: voucherInfo ? voucherInfo : null,
                subtotal: subtotal ? subtotal : totalPrice,
                totalPrice: totalPrice
            })

            let newOrder = await MODELS.Booking.findOne({
                _id: order._id
            }).populate([{
                path: 'user',
                model: MODELS.User
            }])
            let { data } = await createPaymentLink({
                bookingData: newOrder
            })

            let bookingInfo = await MODELS.Booking.findOneAndUpdate({
                _id: order._id
            }, { paymentLink: data.invoice_url }, { new: true })

            // send email to inform about new order

            await sendEmail({
                title: `[New Booking] Booking Id ${bookingInfo.bookingId}`,
                textBody: '',
                htmlBody: emailLBVNewBooking({data: bookingInfo}),
                email: 'rsv@localbalivillas.com',
                allowCC: true
            })


            OUTPUT.responseSuccess(res, bookingInfo)
        } catch (error) {
            console.log('here error', error)
            OUTPUT.responseError(res, error)
        }
    },
    checkCoupon: async (req, res) => {
        try {
            let { body } = req
            let { couponCode,
                dates,
                total,
                propertyId
             } = body

            let params = {
                couponCode
            }

            console.log(body)

            let coupon = await MODELS.Coupon.findOne({
                ...params
            }).lean()

            if (!coupon) { throw { message: "Coupon not found" } }

            // Villa checkout only accepts codes scoped to villas or both. Existing
            // coupons have no scope and read as 'villas', so nothing changes for them.
            assertKind(coupon, 'villas')

            // check coupon information
            if (coupon.limit) { 
                let bookings = await MODELS.Booking.find({
                    "voucherInfo.voucherCode" : couponCode,
                    lastStatus: {$in: ['confirmed', 'checkout']}
                }).count()
                if (bookings >= coupon.limit) { throw { message: "Coupon not found" } }
            }
            // if (coupon.limitUser) { 
            //     let bookings = await MODELS.Booking.find({
            //         "voucherInfo.voucherCode" : couponCode,
            //         lastStatus: {$in: ['confirmed', 'checkout']}
            //     }).count()
            //     if (bookings >= coupon.limit) { throw { message: "Coupon not found" } }
            // }

            // check condition
            if (coupon.propertyId && (coupon.propertyId.indexOf(propertyId.toString()) >= 0)) {
                let propertyInfo = await MODELS.Properties.findOne({
                    _id: coupon.propertyId
                }).lean()
                throw { message: `Coupon only valid for stay at ${propertyInfo.name}` }
            }

            if (coupon.minimumDays && (coupon.minimumDays > dates.length)) {
                throw { message: `Coupon only valid for minimum ${coupon.minimumDays} day(s) stay` }
            }

            if (coupon.minimumPurchase && (coupon.minimumPurchase > total)) {
                throw { message: `Coupon only valid for minimum ${coupon.minimumPurchase} purchase` }
            }

            // check coupon condition
            console.log(coupon)

            OUTPUT.responseSuccess(res, coupon)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },

    /**
     * Looks up a stay so the activity calendar can offer the dates the guest is
     * actually on the island, instead of asking someone on holiday to work out which
     * Tuesday they mean.
     *
     * Email is required alongside the booking id, matching the enquiry lookup. A
     * booking id is not a secret - it travels in confirmation emails and WhatsApp
     * threads - and "which villa is this person in, and on what nights" is exactly
     * the sort of thing that should not fall out of a forwarded screenshot.
     *
     * What comes back is the minimum the calendar needs: property, first night, last
     * night. No name, no contact details, no price.
     */
    lookupStay: async (req, res) => {
        try {
            const { bookingId, email } = req.body || {}

            if (!allow(`stay:${clientKey(req)}`, { max: 10, windowMs: 10 * 60 * 1000 })) {
                throw { statusCode: 429, message: 'Too many attempts. Please try again shortly.' }
            }

            // One message for every failure. Separate ones would let this endpoint be
            // used to test whether a booking id exists, or which email is on it.
            const notFound = {
                statusCode: 404,
                message: 'We could not find a stay with those details.'
            }

            if (!bookingId || !isEmail(email)) { throw notFound }

            const booking = await MODELS.Booking.findOne(
                {
                    bookingId: String(bookingId).trim(),
                    'guestInfo.email': String(email).trim().toLowerCase(),
                    lastStatus: { $in: STAYING_STATUSES },
                    isDeleted: { $ne: true },
                },
                { bookingId: 1, dates: 1, 'propertiesInfo.propertiesName': 1 }
            ).lean()

            if (!booking || !booking.dates || booking.dates.length === 0) { throw notFound }

            const dates = [...booking.dates].sort()
            const checkOut = dates[dates.length - 1]

            // A finished stay cannot host an activity, and returning its dates would be
            // disclosure with no purpose.
            const today = new Date().toISOString().slice(0, 10)
            if (checkOut < today) { throw notFound }

            OUTPUT.responseSuccess(res, {
                bookingId: booking.bookingId,
                propertyName: (booking.propertiesInfo || {}).propertiesName || null,
                checkIn: dates[0],
                checkOut,
                // The last date is the checkout morning, so nights is one fewer - the
                // same rule the villa pricing loop uses.
                nights: Math.max(1, dates.length - 1),
            })
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    }
}