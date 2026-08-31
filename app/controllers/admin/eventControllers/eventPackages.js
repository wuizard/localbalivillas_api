const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const PACKAGE_FIELDS = [
    'packageImage',
    'name',
    'key',
    'summary',
    'description',
    'typicallyIncludes',
    'indicativeFrom',
    'indicativeTo',
    'suitableGuestsMin',
    'suitableGuestsMax',
    'sortOrder',
];

const VALID_STATUS = ['draft', 'published'];

function resolveStatus(value) {
    return VALID_STATUS.indexOf(value) >= 0 ? value : 'published';
}

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

function assertPublishable(body) {
    if (!body.name || !String(body.name).trim()) {
        throw { statusCode: 400, message: 'Name is required to publish' }
    }
    if (!body.summary || !String(body.summary).trim()) {
        throw { statusCode: 400, message: 'Summary is required to publish - it is the card and the meta description' }
    }
    if (!Array.isArray(body.packageImage) || body.packageImage.length === 0) {
        throw { statusCode: 400, message: 'At least one image is required to publish' }
    }
}

function pick(body) {
    const doc = {}
    for (const field of PACKAGE_FIELDS) {
        if (body[field] !== undefined) { doc[field] = body[field] }
    }
    if (doc.indicativeFrom !== undefined) { doc.indicativeFrom = Math.round(Number(doc.indicativeFrom) || 0) || undefined }
    if (doc.indicativeTo !== undefined) { doc.indicativeTo = Math.round(Number(doc.indicativeTo) || 0) || undefined }
    return doc
}

async function uniqueKey(desired, name, excludeId) {
    const base = slugify(desired) || slugify(name) || 'occasion'
    let candidate = base
    for (let i = 2; i < 50; i++) {
        const clash = await MODELS.EventPackage.findOne({
            key: candidate,
            isDeleted: { $ne: true },
            ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        }).lean()
        if (!clash) { return candidate }
        candidate = `${base}-${i}`
    }
    throw { statusCode: 400, message: 'Could not allocate a unique key for this occasion' }
}

module.exports = {
    getEventPackages: async (req, res) => {
        try {
            let { query } = req
            let { status, name } = query

            let queryParams = { isDeleted: { $ne: true } }
            if (name) { queryParams.name = { $regex: name, $options: 'i' } }
            if (status && VALID_STATUS.indexOf(status) >= 0) {
                queryParams.status = status === 'published' ? { $ne: 'draft' } : 'draft'
            }

            const data = await MODELS.EventPackage.find(queryParams)
                .sort({ sortOrder: 1, updatedDate: -1 })
                .lean()

            OUTPUT.responseSuccess(res, { data, totalData: data.length })
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },

    getEventPackageDetail: async (req, res) => {
        try {
            let { id } = req.params

            const data = ObjectId.isValid(id)
                ? await MODELS.EventPackage.findOne({ _id: id, isDeleted: { $ne: true } }).lean()
                : await MODELS.EventPackage.findOne({ key: id, isDeleted: { $ne: true } }).lean()

            if (!data) { throw { statusCode: 404, message: "Event package not found" } }

            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },

    createEventPackage: async (req, res) => {
        try {
            let { body } = req
            const status = resolveStatus(body.status)
            if (status === 'published') { assertPublishable(body) }

            const doc = pick(body)
            doc.key = await uniqueKey(body.key, body.name)
            doc.status = status

            const created = await MODELS.EventPackage.create(doc)

            OUTPUT.responseSuccess(res, created)
        } catch (error) {
            console.log('createEventPackage failed:', error && error.message ? error.message : error)
            OUTPUT.responseError(res, error)
        }
    },

    updateEventPackage: async (req, res) => {
        try {
            let { body } = req
            if (!ObjectId.isValid(body._id)) { throw { statusCode: 400, message: 'Invalid package id' } }

            const current = await MODELS.EventPackage.findOne({ _id: body._id, isDeleted: { $ne: true } }).lean()
            if (!current) { throw { statusCode: 404, message: "Event package not found" } }

            const status = body.status ? resolveStatus(body.status) : (current.status || 'published')
            if (status === 'published') { assertPublishable({ ...current, ...pick(body) }) }

            const doc = pick(body)
            doc.status = status
            doc.updatedDate = new Date()

            if (body.key !== undefined || !current.key) {
                doc.key = await uniqueKey(body.key || current.key, body.name || current.name, current._id)
            }

            const updated = await MODELS.EventPackage.findOneAndUpdate(
                { _id: current._id },
                { $set: doc },
                { new: true }
            )

            OUTPUT.responseSuccess(res, updated)
        } catch (error) {
            console.log('updateEventPackage failed:', error && error.message ? error.message : error)
            OUTPUT.responseError(res, error)
        }
    },

    deleteEventPackage: async (req, res) => {
        try {
            let { packageId } = req.params
            if (!ObjectId.isValid(packageId)) { throw { statusCode: 400, message: 'Invalid package id' } }

            // Soft delete: enquiries reference these, and an enquiry whose occasion
            // vanished is unreadable in the panel.
            await MODELS.EventPackage.updateOne(
                { _id: packageId },
                { $set: { isDeleted: true, updatedDate: new Date() } }
            )

            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
}
