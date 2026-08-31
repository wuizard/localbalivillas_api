const axios = require('axios');
let api_key = "cur_live_CHce2HRbNr3mZIxrJ6PhtYNhkJTsebHXcfgwcgcc"

module.exports = {
    getCurrencyAPI: async function () {
        let data = await axios({
            method: 'get',
            url: `https://api.currencyapi.com/v3/latest?base_currency=IDR`,
            headers: {
                apikey: api_key,
            }
        });
        let currencyData = null
        if (data) { currencyData = data.data }
        return currencyData
    }
}