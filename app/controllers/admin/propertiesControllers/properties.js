const moment = require("moment");
const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

// Only these come off the request body. Spreading the raw body let a caller set
// anything on the document (isActive, createdDate, ...) and also persisted the
// CMS's working fields - `rooms`, `propertyImages`, blob: URLs - into Mongo.
const PROPERTY_FIELDS = [
    'propertyImage',
    'name',
    'region',
    'regionId',
    'location',
    'locationId',
    'type',
    'description',
    'houseRules',
    'mapInfo',
];

const VALID_STATUS = ['draft', 'published'];

module.exports = {
    getProperties: async (req, res) => {
        try {
            let { query } = req
            let { page, limit, name, region, location, status } = query
            page = Number(page) || 0
            limit = Number(limit) || 20

            let queryParams = {}

            if (name) {
                queryParams.name = {$regex: name, $options: 'i'}
            }

            if (region) {
                queryParams.regionId = region
            }

            if (location) {
                queryParams.locationId = location
            }

            // Only filter when asked, so existing callers keep their behaviour.
            // The CMS passes status=published for Places and status=draft for Drafts.
            if (status && VALID_STATUS.indexOf(status) >= 0) {
                queryParams.status = status === 'published'
                    ? { $ne: 'draft' }   // records predating this field have no status
                    : 'draft'
            }

            let [data, totalData] = await Promise.all([
                MODELS.Properties.find({ ...queryParams })
                    .sort({ updatedDate: -1 })
                    .limit(limit)
                    .skip(page * limit)
                    .lean(),
                MODELS.Properties.countDocuments({ ...queryParams }),
            ])

            OUTPUT.responseSuccess(res, {
                data,
                totalData
            })
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
    getPropertyDetail: async (req, res) => {
        try {
            let { params } = req
            let { id } = params

            if (!ObjectId.isValid(id)) { throw { statusCode: 400, message: 'Invalid property id' } }

            // Three queries flat, instead of one per room.
            let [data, propertyRoom, allPrices] = await Promise.all([
                MODELS.Properties.findOne({ _id: id }).lean(),
                MODELS.PropertyRooms.find({ properties: id }).sort({ index: 1 }).lean(),
                MODELS.PropertyRoomPrices.find({ properties: id, isDeleted: false }).lean(),
            ])

            if (!data) { throw { statusCode: 404, message: 'Property not found' } }

            OUTPUT.responseSuccess(res, {
                ...data,
                rooms: attachPriceList(propertyRoom, allPrices),
            })
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
    createProperties: async (req, res) => {
        try {
            let { body } = req;
            const status = resolveStatus(body.status)
            const rooms = Array.isArray(body.rooms) ? body.rooms : []

            if (status === 'published') { assertPublishable(body) }

            const propertyId = new ObjectId()

            // Room ids are generated up front so the property document, the room
            // documents and the price documents can all be built before a single
            // write goes out.
            const roomIds = rooms.map((room) => (
                ObjectId.isValid(room._id) ? new ObjectId(room._id) : new ObjectId()
            ))

            const roomDocs = rooms.map((room, i) => buildRoomDoc(room, propertyId, i, roomIds[i]))
            const priceDocs = rooms.reduce((acc, room, i) => (
                acc.concat(buildPriceDocs(room, propertyId, roomIds[i]))
            ), [])

            const property = await withTransaction(async (session) => {
                const opts = session ? { session } : {}

                await MODELS.Properties.create([{
                    _id: propertyId,
                    ...pickPropertyFields(body),
                    key: buildKey(body.name),
                    status,
                    bedRooms: collectBedRooms(rooms),
                    roomType: roomIds,
                }], opts)

                if (roomDocs.length) {
                    await MODELS.PropertyRooms.insertMany(roomDocs, opts)
                }
                if (priceDocs.length) {
                    await MODELS.PropertyRoomPrices.insertMany(priceDocs, opts)
                }

                return { _id: propertyId }
            })

            OUTPUT.responseSuccess(res, await loadPropertyResponse(property._id))
        } catch (error) {
            console.log('createProperties failed:', error && error.message ? error.message : error)
            OUTPUT.responseError(res, error);
        }
    },
    updateProperties: async (req, res) => {
        try {
            let { body } = req;

            if (!ObjectId.isValid(body._id)) { throw { statusCode: 400, message: 'Invalid property id' } }

            const rooms = Array.isArray(body.rooms) ? body.rooms : []

            // Neither read depends on the other, so pay for one round trip not two.
            // The second replaces the old per-room findOne *and* the find() that
            // used to run inside a console.log.
            const [currProperty, existingPrices] = await Promise.all([
                MODELS.Properties.findOne({ _id: body._id }).lean(),
                MODELS.PropertyRoomPrices.find({ properties: body._id }).lean(),
            ])

            if (!currProperty) { throw { statusCode: 404, message: "Property not found" } }

            // An absent status means "leave it as it is" - an autosave must never
            // silently republish a draft, or unpublish a live property.
            const status = body.status ? resolveStatus(body.status) : (currProperty.status || 'published')
            if (status === 'published') { assertPublishable(body) }

            const propertyId = currProperty._id

            const defaultPriceByRoom = new Map()
            existingPrices.forEach((price) => {
                if (isDefaultPrice(price)) { defaultPriceByRoom.set(String(price.roomType), price) }
            })

            const roomIds = rooms.map((room) => (
                ObjectId.isValid(room._id) ? new ObjectId(room._id) : new ObjectId()
            ))

            const roomOps = []
            const priceOps = []
            const keptPriceIds = []

            rooms.forEach((room, i) => {
                const roomId = roomIds[i]
                const isExisting = ObjectId.isValid(room._id)

                if (isExisting) {
                    roomOps.push({
                        updateOne: {
                            filter: { _id: roomId, properties: propertyId },
                            update: { $set: buildRoomDoc(room, propertyId, i) },
                        },
                    })
                } else {
                    roomOps.push({ insertOne: { document: buildRoomDoc(room, propertyId, i, roomId) } })
                }

                // default (unconditional) price for the room
                const defaultPrice = defaultPriceByRoom.get(String(roomId))
                const priceValue = resolveDefaultPrice(room)
                if (defaultPrice) {
                    keptPriceIds.push(defaultPrice._id)
                    priceOps.push({
                        updateOne: {
                            filter: { _id: defaultPrice._id },
                            update: { $set: { price: priceValue, isDeleted: false } },
                        },
                    })
                } else {
                    const newId = new ObjectId()
                    keptPriceIds.push(newId)
                    priceOps.push({
                        insertOne: {
                            document: {
                                _id: newId,
                                date: null,
                                day: null,
                                price: priceValue,
                                properties: propertyId,
                                roomType: roomId,
                            },
                        },
                    })
                }

                // special prices
                const priceList = Array.isArray(room.priceList) ? room.priceList : []
                priceList.forEach((price) => {
                    if (ObjectId.isValid(price._id)) {
                        keptPriceIds.push(new ObjectId(price._id))
                        return
                    }
                    if (!price.price) { return }
                    const newId = new ObjectId()
                    keptPriceIds.push(newId)
                    priceOps.push({
                        insertOne: { document: buildPriceDoc(price, propertyId, roomId, newId) },
                    })
                })
            })

            await withTransaction(async (session) => {
                const opts = session ? { session } : {}

                if (roomOps.length) {
                    await MODELS.PropertyRooms.bulkWrite(roomOps, opts)
                }
                if (priceOps.length) {
                    await MODELS.PropertyRoomPrices.bulkWrite(priceOps, opts)
                }

                // Any price not referenced by a room in this payload. That already
                // covers prices belonging to rooms the operator deleted, since
                // those never made it into keptPriceIds - no separate sweep needed.
                await MODELS.PropertyRoomPrices.deleteMany({
                    properties: propertyId,
                    _id: { $nin: keptPriceIds },
                }, opts)

                // Rooms removed in the CMS.
                await MODELS.PropertyRooms.deleteMany({
                    properties: propertyId,
                    _id: { $nin: roomIds },
                }, opts)

                await MODELS.Properties.updateOne({
                    _id: propertyId
                }, {
                    $set: {
                        ...pickPropertyFields(body),
                        key: buildKey(body.name),
                        status,
                        bedRooms: collectBedRooms(rooms),
                        roomType: roomIds,
                        updatedDate: new Date(),
                    },
                }, opts)
            })

            OUTPUT.responseSuccess(res, await loadPropertyResponse(propertyId))
        } catch (error) {
            console.log('updateProperties failed:', error && error.message ? error.message : error)
            OUTPUT.responseError(res, error)
        }
    },
    deleteProperties: async (req, res) => {
        try {
            let { params } = req
            let { propertiesId } = params

            if (!ObjectId.isValid(propertiesId)) { throw { statusCode: 400, message: 'Invalid property id' } }

            await withTransaction(async (session) => {
                const opts = session ? { session } : {}
                await MODELS.Properties.deleteOne({ _id: propertiesId }, opts)
                await MODELS.PropertyRoomPrices.deleteMany({ properties: propertiesId }, opts)
                await MODELS.PropertyRooms.deleteMany({ properties: propertiesId }, opts)
            })

            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
    hideProperties: async (req, res) => {
        try {
            let { params } = req
            let { propertiesId } = params

            if (!ObjectId.isValid(propertiesId)) { throw { statusCode: 400, message: 'Invalid property id' } }

            let properties = await MODELS.Properties.findOne({_id: propertiesId}).select('isActive').lean()
            if (!properties) { throw { statusCode: 404, message: 'Property not found' } }

            await MODELS.Properties.updateOne({
                _id: propertiesId
            }, {
                $set: { isActive: !properties.isActive, updatedDate: new Date() }
            })

            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
    getPropertiesId: async (req, res) => {
        try {
            let data = await MODELS.Properties.find({
                status: { $ne: 'draft' }
            }).select('_id name').lean()

            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
}

// ---------------------------------------------------------------------------

// Runs fn inside a transaction so a client timeout can never leave a property
// half-written. Falls back to running without one on a standalone mongod, where
// transactions are unsupported - Atlas is a replica set, so that is dev only.
async function withTransaction(fn) {
    let session = null
    try {
        session = await MODELS.Properties.startSession()
    } catch (error) {
        return fn(null)
    }

    try {
        let result
        await session.withTransaction(async () => {
            result = await fn(session)
        })
        return result
    } catch (error) {
        if (isTransactionUnsupported(error)) {
            return fn(null)
        }
        throw error
    } finally {
        await session.endSession()
    }
}

function isTransactionUnsupported(error) {
    const message = (error && error.message) || ''
    return message.indexOf('Transaction numbers are only allowed on a replica set') >= 0
        || message.indexOf('Transactions are not supported') >= 0
}

function pickPropertyFields(body) {
    return PROPERTY_FIELDS.reduce((acc, field) => {
        if (body[field] !== undefined) { acc[field] = body[field] }
        return acc
    }, {})
}

function resolveStatus(status) {
    return VALID_STATUS.indexOf(status) >= 0 ? status : 'published'
}

// Drafts are allowed to be incomplete - that is the whole point of them. These
// checks only apply the moment someone tries to make a property public.
function assertPublishable(body) {
    const missing = []
    if (!body.name) { missing.push('name') }
    if (!body.regionId) { missing.push('region') }
    if (!body.locationId) { missing.push('location') }
    if (!Array.isArray(body.propertyImage) || body.propertyImage.length === 0) { missing.push('at least one image') }
    if (missing.length > 0) {
        throw { statusCode: 400, message: `Cannot publish, still missing: ${missing.join(', ')}` }
    }
}

function buildKey(name) {
    return String(name || '').toLowerCase().replace(/[^a-zA-Z ]/g, "").replace(/ /g, "-")
}

// The old version compared a String against an array of Numbers, so indexOf never
// matched and every room was pushed - bedRooms ended up as [2, 2, 3, 3].
function collectBedRooms(rooms) {
    const seen = []
    rooms.forEach((room) => {
        const count = Number(room.room)
        if (!Number.isFinite(count)) { return }
        if (seen.indexOf(count) < 0) { seen.push(count) }
    })
    return seen
}

function buildRoomDoc(room, propertyId, index, roomId) {
    const doc = {
        propertyImage: Array.isArray(room.propertyImage) ? room.propertyImage : [],
        name: room.name,
        room: room.room,
        bed: room.bed,
        price: resolveDefaultPrice(room),
        facilities: room.facilities,
        amenities: room.amenities,
        roomSize: room.roomSize,
        poolSize: room.poolSize,
        maximumGuest: room.maximumGuest,
        index,
        disabledDate: room.disabledDate,
        properties: propertyId,
        updatedDate: new Date(),
    }
    if (room.isActive !== undefined) { doc.isActive = room.isActive }
    if (roomId) { doc._id = roomId }
    return doc
}

// `room.price ? room.price : room.defaultPrice.price` threw whenever price was 0
// or empty, because the CMS flattens defaultPrice and never sends that object.
function resolveDefaultPrice(room) {
    const candidates = [room.price, room.defaultPrice && room.defaultPrice.price, room.defaultPrice && room.defaultPrice.nominal]
    for (let i = 0; i < candidates.length; i++) {
        const value = Number(candidates[i])
        if (Number.isFinite(value) && String(candidates[i]).trim() !== '') { return value }
    }
    return 0
}

function buildPriceDocs(room, propertyId, roomId) {
    const priceList = Array.isArray(room.priceList) ? room.priceList : []
    const docs = priceList
        .filter((price) => !!price.price)
        .map((price) => buildPriceDoc(price, propertyId, roomId))

    // the room's unconditional fallback price
    docs.push({
        date: null,
        day: null,
        price: resolveDefaultPrice(room),
        properties: propertyId,
        roomType: roomId,
    })

    return docs
}

function buildPriceDoc(price, propertyId, roomId, priceId) {
    const doc = {
        date: normaliseList(
            (price.dateStart && price.dateEnd)
                ? getDates(new Date(price.dateStart), new Date(price.dateEnd))
                : price.date
        ),
        day: normaliseList(price.day),
        price: Number(price.price) || 0,
        properties: propertyId,
        roomType: roomId,
        isDeleted: false,
    }
    if (priceId) { doc._id = priceId }
    return doc
}

// `day` arrives as a bare string from the CMS but the schema declares an Array,
// which left the cast up to whatever Mongoose felt like doing that day.
function normaliseList(value) {
    if (Array.isArray(value)) { return value.length > 0 ? value : null }
    if (value === null || value === undefined || value === '') { return null }
    if (typeof value === 'object' && value.label) { return [value.label] }
    return [value]
}

function isDefaultPrice(price) {
    return isEmptyList(price.date) && isEmptyList(price.day)
}

function isEmptyList(value) {
    return value === null || value === undefined || (Array.isArray(value) && value.length === 0)
}

function attachPriceList(rooms, allPrices) {
    const byRoom = new Map()
    allPrices.forEach((price) => {
        // the unconditional price is the room's base rate, not a "special price"
        if (isDefaultPrice(price)) { return }
        const key = String(price.roomType)
        if (!byRoom.has(key)) { byRoom.set(key, []) }
        byRoom.get(key).push(price)
    })
    return rooms.map((room) => ({
        ...room,
        priceList: byRoom.get(String(room._id)) || [],
    }))
}

async function loadPropertyResponse(propertyId) {
    const [property, rooms, prices] = await Promise.all([
        MODELS.Properties.findOne({ _id: propertyId }).lean(),
        MODELS.PropertyRooms.find({ properties: propertyId }).sort({ index: 1 }).lean(),
        MODELS.PropertyRoomPrices.find({ properties: propertyId, isDeleted: false }).lean(),
    ])
    return {
        ...property,
        roomType: attachPriceList(rooms, prices),
        rooms: attachPriceList(rooms, prices),
    }
}

function getDates(startDate, stopDate) {
    var dateArray = [];
    var currentDate = moment(startDate);
    var stopDate = moment(stopDate);
    while (currentDate <= stopDate) {
        dateArray.push( moment(currentDate).format('YYYY-MM-DD') )
        currentDate = moment(currentDate).add(1, 'days');
    }
    return dateArray;
}
