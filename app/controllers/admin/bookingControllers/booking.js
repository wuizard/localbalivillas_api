const moment = require("moment");
const { sendEmail } = require("../../../helper/email");
const { emailConfirmationBody, emailLBVBody, emailLBVRefund, emailLBVCheckOut } = require("../../../helper/emailHTML/_emailFormat");

module.exports = {
    getBookings: async (req, res) => {
        try {
            let { query } = req
            let { bookingId, user, checkinDate, checkoutDate, status } = query
            let queryParams = {}
            
            if (bookingId) {
                queryParams.bookingId = {$regex: bookingId, $options: 'i'}
            }

            if (user) {
                queryParams.user = user
            }

            // if (checkinDate) {
            //     queryParams['dates.0'] = checkinDate
            // }

            // if (checkoutDate) {
            //     queryParams['$expr'] = { $eq: [{ $last: "$dates" }, checkoutDate] }
            // }
            if (checkinDate || checkoutDate) {
                var day1 = moment(checkinDate);
                var day2 = moment(checkoutDate || checkinDate);
                var dates = [moment({...day1}).format('YYYY-MM-DD')];

                while(day1.date() != day2.date()){
                    day1.add(1, 'day');
                    dates.push(moment({ ...day1 }).format('YYYY-MM-DD'));  
                }
                console.log('here dates', dates)
                queryParams.dates = {$in: dates}
            }

            if (status) {
                queryParams.lastStatus = {$in: status.split(',')}
            }

            console.log(query, queryParams)

            let data = await MODELS.Booking.find(queryParams)
            .populate([
                {
                    path: 'user',
                    model: MODELS.User
                },
                // {
                //     path: 'propertiesInfo.properties',
                //     model: MODELS.Properties
                // },
                // {
                //     path: 'propertiesInfo.room',
                //     model: MODELS.PropertyRooms
                // }
            ])
            .sort({
                createdDate: -1
            })
            .select('bookingId propertiesInfo user dates arrivalTime createdDate totalPrice lastStatus')
            .lean()

            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
    getBooking: async (req, res) => {
        try {
            let { params } = req;
            let { id } = params
            console.log('here bookingId', id)

            let data = await MODELS.Booking.findOne({
                _id: id
            }).populate([
                {
                    path: 'user',
                    model: MODELS.User
                },
                {
                    path: 'propertiesInfo.properties',
                    model: MODELS.Properties
                },
                {
                    path: 'propertiesInfo.room',
                    model: MODELS.PropertyRooms
                }
            ]).lean()
            console.log(data)
            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },
    updateBooking: async (req, res) => {
        try {
            let { params, body } = req
            let { bookingId } = params
            let { description } = body

            await MODELS.Booking.findOneAndUpdate({
                _id: bookingId
            }, {
                description
            })

            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
    confirmBooking: async (req, res) => {
        try {
            let { query } = req
            let { _id } = query
            await MODELS.Booking.findOneAndUpdate({
                _id,
                'status.status' : 'confirmed'
            },{
                lastStatus: 'confirmed',
                'status.$.date' : new Date()
            })
            let orderInfo = await MODELS.Booking.findOne({
                _id
            }).populate([
                {
                    path:'user',
                    model: MODELS.User
                }
            ])
            .lean()

            // Tuesday, October 30, 2023
            await sendEmail({
                title: `Confirmation Booking for ${orderInfo.propertiesInfo.propertiesName}: Check-in on ${moment(orderInfo.dates[0]).format('dddd, MMM DD, YYYY')}. NON REFUNDABLE`,
                textBody: '',
                htmlBody: emailConfirmationBody({data: orderInfo}),
                email: orderInfo.guestInfo.email
            })

            await sendEmail({
                title: `Reservation Confirmed - ${orderInfo.user.name} will arrive on ${moment(orderInfo.dates[0]).format('MMMM DD')}. NON REFUNDABLE`,
                textBody: '',
                htmlBody: emailLBVBody({data: orderInfo}),
                email: 'rsv@localbalivillas.com',
                allowCC: true
            })

            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },
    rejectBooking: async (req, res) => {
        try {
            let { query } = req
            let { _id } = query
            
            console.log('here reject booking', _id)
            await MODELS.Booking.findOneAndUpdate({
                _id,
                'status.status' : 'refund'
            },{
                lastStatus: 'reject',
                'status.$.date' : new Date()
            })

            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },
    refundBooking: async (req, res) => {
        try {
            let { query } = req
            let { _id } = query

            console.log('here refund booking', _id)
            await MODELS.Booking.findOneAndUpdate({
                _id,
                'status.status' : 'refund'
            },{
                lastStatus: 'refund',
                'status.$.date' : new Date()
            })

            let orderInfo = await MODELS.Booking.findOne({
                _id
            }).populate([
                {
                    path:'user',
                    model: MODELS.User
                }
            ])
            .lean()

            await sendEmail({
                title: `Canceled Reservation for ${orderInfo.propertiesInfo.propertiesName}: Check-in on ${moment(orderInfo.dates[0]).format('dddd, MMM DD, YYYY')}.`,
                textBody: '',
                htmlBody: emailLBVRefund({data: orderInfo}),
                email: orderInfo.guestInfo.email
            })

            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },
    checkoutBooking: async (req, res) => {
        try {

            let { query } = req
            let { _id } = query
            await MODELS.Booking.findOneAndUpdate({
                _id,
                'status.status' : 'checkout'
            },{
                lastStatus: 'checkout',
                isCheckOut: true,
                checkOutDate: new Date(),
                'status.$.date' : new Date()
            })

            let orderInfo = await MODELS.Booking.findOne({
                _id
            }).populate([
                {
                    path:'user',
                    model: MODELS.User
                },
                {
                    path: 'propertiesInfo.properties',
                    model: MODELS.Properties,
                    select: 'key type'
                }
            ])
            .lean()

            await sendEmail({
                title: `We Hope You Enjoyed Your Stay – Share Your Experience!`,
                textBody: '',
                htmlBody: emailLBVCheckOut({data: orderInfo}),
                email: orderInfo.guestInfo.email
            })

            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    }
}