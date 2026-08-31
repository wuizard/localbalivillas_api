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
    /**
     * Creates a Xendit invoice from primitives. `createPaymentLink` below is a thin
     * wrapper for villa bookings; activity orders call this directly. Keeping one
     * request builder means the two funnels cannot drift apart on currency, customer
     * shape or redirect URLs.
     */
    async createInvoice({
        externalId,
        amount,
        customer,
        items,
        successRedirectUrl,
        failureRedirectUrl,
    }) {
        try {
            if (!externalId || !amount) { throw 'Error' }
            const authToken = Buffer.from(`${CONFIG.xenditSecretAPIKey}:`).toString('base64');
            const response = await axios({
                method: 'POST',
                url: 'https://api.xendit.co/v2/invoices',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${authToken}`,
                },
                data: {
                    external_id: externalId,
                    amount,
                    currency: 'IDR',
                    customer,
                    customer_notification_preference: {
                        invoice_paid: ['email', 'whatsapp']
                    },
                    success_redirect_url: successRedirectUrl || 'https://localbalivillas.com/',
                    failure_redirect_url: failureRedirectUrl || 'https://localbalivillas.com/',
                    items,
                },
            });
            return { data: response.data }
        } catch (error) {
            console.log('createInvoice failed', error && error.message ? error.message : error)
            return { error }
        }
    },

    async createPaymentLink({
        bookingData
    }) {
        if (!bookingData) { return { error: 'Error' } }

        return module.exports.createInvoice({
            externalId: bookingData.bookingId,
            amount: bookingData.totalPrice,
            customer: {
                given_names: bookingData.user.firstName,
                surname: bookingData.user.lastName,
                email: bookingData.user.email,
                mobile_number: bookingData.user.phoneNumber.replace('08', '+628'),
            },
            items: [
                {
                    name: bookingData.propertiesInfo.roomName,
                    quantity: 1,
                    price: bookingData.subtotal,
                    category: bookingData.propertiesInfo.propertiesName
                },
            ],
        });
    }
}