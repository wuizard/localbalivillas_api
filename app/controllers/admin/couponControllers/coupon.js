const moment = require("moment");

module.exports = {
    createCoupons: async (req, res) => {
        try {
            let { body } = req

            // cehck coupon name
            let couponExist = await MODELS.Coupon.findOne({
                couponCode: body.couponCode
            }).lean()

            if (couponExist) { throw { message: "Promo code already exist" }}

            // convert to UTC
            // startDate, endDate
            if (body) {
                body.startDate = moment.utc(moment(body.startDate)).format()
                body.endDate = moment.utc(moment(body.endDate)).format()
            }

            let coupon = await MODELS.Coupon.create({
                ...body
            });
            OUTPUT.responseSuccess(res, coupon)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error);
        }
    },
    updateCoupon: async (req, res) => {
        try {
            let { body, params } = req
            let { _id } = body;

            let couponExist = await MODELS.Coupon.findOne({
                _id: _id
            }).lean()
            if (!couponExist) { throw {message: "Coupon not found"} }

            // convert to UTC
            // startDate, endDate
            if (body) {
                body.startDate = moment.utc(moment(body.startDate)).format()
                body.endDate = moment.utc(moment(body.endDate)).format()
            }

            let coupon = await MODELS.Coupon.findOneAndUpdate({
                _id: _id
            },{
                ...body
            });
            OUTPUT.responseSuccess(res, coupon)
        } catch (error) {
            OUTPUT.responseError(res, error);
        }
    },
    deleteCoupon: async (req, res) => {
        try {
            let { params } = req
            let { id } = params;

            let couponExist = await MODELS.Coupon.findOne({
                _id: id
            }).lean()
            if (!couponExist) { throw {message: "Coupon not found"} }

            await MODELS.Coupon.deleteMany({
                _id: id
            });

            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            OUTPUT.responseError(res, error);
        }
    },
    getCoupons: async (req, res) => {
        try {
            let { query } = req
            let listCoupon = await MODELS.Coupon.find({

            })
            .populate([
                {
                    path: 'user',
                    model: MODELS.User,
                    select: '_id name'
                }
            ])
            .sort({
                createdDate: -1
            })
            .lean();
            // for (let i = 0 ; i < listCoupon.length; i ++) {
            //     // let ordersCount = await MODELS.Order.find({
            //     //     promoCode: listCoupon[i]._id,
            //     //     isPaid: true
            //     // }).count()
            //     // listCoupon[i].usage = ordersCount
            //     let countMonthly = await countMonthlyCoupon({promoCodeId: listCoupon[i]._id})
            //     let countAllTime = await countAllTimeCoupon({promoCodeId: listCoupon[i]._id})
            //     listCoupon[i].monthlyUsage = countMonthly
            //     listCoupon[i].usage = countAllTime
            // }
            OUTPUT.responseSuccess(res, listCoupon)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error);
        }
    },
    getCoupon: async (req, res) => {
        try {
            let { params } = req
            let { id } = params
            let coupon = await MODELS.Coupon.findOne({
                _id: id
            })
            .populate([
                {
                    path: 'user',
                    model: MODELS.User,
                    select: '_id name'
                },
                {
                    path: 'propertyId',
                    model: MODELS.Properties,
                    select: '_id name'
                },
            ])
            .lean();
            OUTPUT.responseSuccess(res, coupon)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error);
        }
    },
    getAutoPopupCoupon: async (req, res) => {
        try {
            let autoPopup = await MODELS.Coupon.findOne({
                autoPopup: true
            }).lean()
            OUTPUT.responseSuccess(res, autoPopup)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    }
}