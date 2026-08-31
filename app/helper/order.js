const axios = require('axios');

module.exports = {
    randomNumber(len, charSet) {
        charSet = charSet || '0123456789';
        var randomString = '';
        for (var i = 0; i < len; i++) {
            var randomPoz = Math.floor(Math.random() * charSet.length);
            randomString += charSet.substring(randomPoz,randomPoz+1);
        }
        return randomString;
    },
    randomAlphabet(len, charSet) {
        charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var randomString = '';
        for (var i = 0; i < len; i++) {
            var randomPoz = Math.floor(Math.random() * charSet.length);
            randomString += charSet.substring(randomPoz,randomPoz+1);
        }
        return randomString;
    },
    randomString(len, charSet) {
        charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var randomString = '';
        for (var i = 0; i < len; i++) {
            var randomPoz = Math.floor(Math.random() * charSet.length);
            randomString += charSet.substring(randomPoz,randomPoz+1);
        }
        return randomString;
    },
    async createPaymentLink({
        bookingData
    }) {
        try {
            if (!bookingData) { throw 'Error' }
            const authToken = Buffer.from(`${CONFIG.xenditSecretAPIKey}:`).toString('base64');
            console.log(authToken)
            let response = await axios({
                method: 'POST',
                url: 'https://api.xendit.co/v2/invoices',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Basic ${authToken}`,
                },
                data: {
                    external_id: bookingData.bookingId,
                    amount: bookingData.totalPrice,
                    currency: 'IDR',
                    customer: {
                        given_names: bookingData.user.firstName,
                        surname: bookingData.user.lastName,
                        email: bookingData.user.email,
                        mobile_number: bookingData.user.phoneNumber.replace('08', '+628'),
                    },
                    customer_notification_preference: {
                        invoice_paid: ['email', 'whatsapp']
                    },
                    success_redirect_url: 'https://localbalivillas.com/',
                    failure_redirect_url: 'https://localbalivillas.com/',
                    items: [
                        {
                            name: bookingData.propertiesInfo.roomName,
                            quantity: 1,
                            price: bookingData.subtotal,
                            category: bookingData.propertiesInfo.propertiesName
                        },
                    ],
                    // fees: [
                    //     {
                    //         type: "Delivery",
                    //         value: 10000
                    //     }
                    // ]
                },
            });
            console.log(response)
            return { data: response.data }
        } catch (error) {
            console.log(error)
            return { error }
        }
    }
}