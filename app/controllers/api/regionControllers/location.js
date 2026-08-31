module.exports = {
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

            let data = await MODELS.Location.find(params).sort({ name: 1 }).lean()
            OUTPUT.responseSuccess(res, data)
        } catch (error) {
            console.log(error)
            OUTPUT.responseError(res, error)
        }
    }
}