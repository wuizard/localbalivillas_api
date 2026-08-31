const { Types } = require('mongoose');
const { ObjectId } = Types;

module.exports = {
    getReviews: async (req, res) => {
        try {
            let { query, params } = req
            let { propertyId } = params
            let { userId } = query
            let myReview = null

            if (userId) {
                myReview = await MODELS.Reviews.findOne({
                    user: userId,
                    propertyId: propertyId
                }).populate([
                    {
                        path: 'user',
                        model: MODELS.User,
                    }
                ]).lean()
            }

            let queryParams = {}
            if (myReview) {
                queryParams = {
                    _id: {$nin: myReview._id},
                }
            }

            let data = await MODELS.Reviews.find({
                ...queryParams,
                propertyId: propertyId
            }).populate([
                {
                    path: 'user',
                    model: MODELS.User,
                }
            ])
            .sort({
                createdDate: 1
            })
            .lean()

            if (myReview) {
                data.unshift(myReview)
            }

            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            console.log('here error', error)
            OUTPUT.responseError(res, error)
        }
    },
    submitReview: async (req, res) => {
        try {
            let { body } = req
            let { email, propertyId } = body
            // check if data 

            if (!email) { throw { message: "No user found" }}

            let userInfo = await MODELS.User.findOne({
                email: {$regex: email, $options: 'i'}
            }).select('_id').lean()

            let paramsOr = [{'guestInfo.email': {$regex: email, $options: 'i'}}]
            if (userInfo) { paramsOr.push({user : userInfo._id})}

            let bookingInfo = await MODELS.Booking.find({
                $or: paramsOr,
                lastStatus: {$in: ['confirmed', 'completed', 'checkout']},
                ['propertiesInfo.properties']: propertyId
            }).sort({ createdDate: -1 }).lean()

            let user
            if (!userInfo) { user = bookingInfo[0].user }
            else { user = userInfo._id }

            if (bookingInfo.length == 0) { throw { message: "No booking info. Book your stay first to submit a review" }}

            let userReview = await MODELS.Reviews.findOne({
                propertyId: propertyId,
                user: user
            }).lean()
            if (userReview) { throw { message: "Review Exist", data: userReview } }

            await MODELS.Reviews.create({
                ...body,
                user
            })
            
            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
    updateReview: async (req, res) => {
        try {
            let { body } = req
            let { _id, email, rating, review } = body
            // check if data 

            let userInfo = await MODELS.User.findOne({
                email: email
            }).select('_id').lean()
            let user = userInfo._id

            let reviewExist = await MODELS.Reviews.findOne({
                _id,
                user,
            }).lean()

            if (!reviewExist) { throw { message: "No booking info. Book your stay first to submit a review" }}

            await MODELS.Reviews.findOneAndUpdate({
                _id: reviewExist._id
            }, {
                ...reviewExist,
                review,
                rating,
                isUpdate: true,
                udpatedDate: new Date()
            })

            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
    getUserReview: async (req, res) => {
        try {
            let { query } = req
            let { propertyId, userId } = query
            let data = await MODELS.Reviews.findOne({
                propertyId: propertyId,
                user: userId
            }).populate([
                {
                    path: 'User',
                    model: MODELS.User,
                }
            ])
            .lean()
            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    }
}