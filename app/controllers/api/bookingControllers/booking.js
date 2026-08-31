const { sendEmail } = require("../../../helper/email")
const { emailLBVNewBooking } = require("../../../helper/emailHTML/_emailFormat")
const { randomString, createPaymentLink } = require("../../../helper/order")
const { checkUser } = require("../../../helper/user")

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
    }
}