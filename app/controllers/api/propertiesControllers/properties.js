const { Types } = require('mongoose');
const { ObjectId } = Types;

module.exports = {
    getProperties: async (req, res) => {
        try {
            let { query } = req
            let { location, startDate, endDate, days, adult, child, rooms, limit, page } = query
            let params = {}

            console.log(query)

            if (location) {
                params.$or = [
                    {location: { $regex: location, $options: 'i' }},
                    {name: { $regex: location, $options: 'i' }},
                ]
            }

            if ((adult && adult > 0 )
                || (child && child > 0 )
                || (rooms && rooms > 0)) {
                let guestParams = {
                    $and: []
                }
                if (adult && adult > 0) { guestParams.$and.push({['maximumGuest.adult']: {$gte: adult}})  }
                if (child && child > 0) { guestParams.$and.push({['maximumGuest.child']: {$gte: child}}) }
                console.log('here guestParams info', guestParams)
                if (rooms && rooms > 0) { guestParams = {$or : [
                    { room: rooms },
                    { ...guestParams }
                ]} }
                console.log('here guestParams info', guestParams)
                let properties = await MODELS.PropertyRooms.find({
                    ...guestParams
                }).distinct('properties')
                params._id = {$in: properties} 
            }

            // drafts are CMS work-in-progress and must never reach the public site
            params.status = { $ne: 'draft' }

            let data = await MODELS.Properties.find(params)
            .limit(limit || 0)
            .lean()

            for (let i = 0; i < data.length; i ++) {
                // get price 
                let price = await MODELS.PropertyRoomPrices.findOne({
                    properties: data[i]._id,
                    price: {$ne: null}
                    // isDeleted: false
                }).sort({
                    price: 1
                }).lean()
                data[i].price = price? price.price : null
            }

            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },
    getPropertyDetail: async (req, res) => {
        try {
            let { params } = req
            let { id } = params

            let data = null
            let isObjectId = ObjectId.isValid(id)

            // drafts are CMS work-in-progress and must never reach the public site
            if (isObjectId) {
                data = await MODELS.Properties.findOne({
                    _id: id,
                    status: { $ne: 'draft' }
                }).lean()
            } else {
                data = await MODELS.Properties.findOne({
                    key: id,
                    status: { $ne: 'draft' }
                }).lean()
            }

            // must come before reading data._id - a missing key used to throw here
            if (!data) { throw { statusCode: 404, message: "Property not found" } }
            id = data._id

            let propertyRoom = await MODELS.PropertyRooms.find({
                properties: id,
            }).sort({index: 1}).lean()
            for (let i = 0; i < propertyRoom.length; i++) {
                let priceList = await MODELS.PropertyRoomPrices.find({
                    properties: id,
                    roomType: propertyRoom[i]._id,
                    isDeleted: false
                }).lean()
                propertyRoom[i].priceList = priceList
            }

            let prices = await MODELS.PropertyRoomPrices.find({
                properties: id,
                isDeleted: false,
                $or: [
                    { date: {$nin: [null, []]}},
                    { day: {$nin: [null, []]}}
                ]
            }).sort({
                price: 1
            }).lean()

            let defaultPrice = await MODELS.PropertyRoomPrices.find({
                properties: id,
                isDeleted: false,
                $and: [
                    { date: {$in: [null, []]}},
                    { day: {$in: [null, []]}}
                ]
            }).sort({
                price: 1
            }).lean()

            if (!defaultPrice || defaultPrice.length == 0) {
                for (let i = 0; i < propertyRoom.length; i++) {
                    defaultPrice.push({
                        properties: id,
                        roomType: propertyRoom[i]._id,
                        date: [],
                        day: [],
                        price: propertyRoom[i].price,
                        isDeleted: false,
                    })
                }
            }

            // prices.unshift(defaultPrice)
            prices = [...defaultPrice, ...prices]
            console.log(prices)

            OUTPUT.responseSuccess(res, {
                ...data,
                rooms: propertyRoom,
                prices
            })
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },
 }