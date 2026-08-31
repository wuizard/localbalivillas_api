module.exports = {
    createRegion: async (req, res) => {
        try {
            let { body } = req
            console.log(body)

            let data = await MODELS.Region.create(body)

            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
    createLocation: async (req, res) => {
        try {
            let { body } = req

            let region = await MODELS.Region.findOne({
                regionId: body.regionId
            }).select('_id regionId').lean()

            let locationCount = await MODELS.Location.find({
                regionId: body.regionId
            }).count()

            let data = await MODELS.Location.create({
                ...body,
                locationId: `${region.regionId}-${locationCount + 1}`,
                region: region._id
            })

            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
    updateRegion: async (req, res) => {
        try {
            let { body } = req
            await MODELS.Region.findOneAndUpdate({
                _id: body._id
            }, {
                ...body
            })
            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
    updateLocation: async (req, res) => {
        try {
            let { body } = req

            let region = await MODELS.Region.findOne({
                regionId: body.regionId
            }).select('_id').lean();

            await MODELS.Location.findOneAndUpdate({
                _id: body._id
            }, {
                ...body,
                region
            })

            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    },
    deleteRegion: async (req, res) => {
        try {
            let { params } = req
            let { regionId } = params
            await MODELS.Region.findOneAndUpdate({
                _id: regionId
            }, {
                isDeleted: true
            })
            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
    deleteLocation: async (req, res) => {
        try {
            let { params } = req
            let { locationId } = params
            await MODELS.Location.findOneAndUpdate({
                _id: locationId
            }, {
                isDeleted: true
            })
            OUTPUT.responseSuccess(res, true)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
    // get Region & get Location
    getRegion: async (req, res) => {
        try {
            let params = {
                isDeleted: false
            }
            let data = await MODELS.Region.find(params).sort({
                regionId: 1
            }).lean()
            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            OUTPUT.responseError(res, error)
        }
    },
    getLocation: async (req, res) => {
        try {
            let { query } = req
            let { regionid } = query

            let params = {
                isDeleted: false
            }
            if (regionid) {
                params.regionId = regionid
            }

            let data = await MODELS.Location.find(params).populate([
                {
                    path: 'region',
                    model: MODELS.Region,
                    select: '_id regionName regionId'
                }
            ]).sort({ locationId: 1 }).lean()
            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    }
}