const nodemailer = require('nodemailer');

// One transporter for the process. The old code built a new one per email and called
// verify() on each, which opened a TLS connection to Zoho for every message sent.
let cachedTransporter = null;

function getTransporter() {
    if (cachedTransporter) { return cachedTransporter; }

    const { smtp } = CONFIG;
    if (!smtp || !smtp.user || !smtp.password) {
        throw new Error(
            'SMTP is not configured (set SMTP_USER and SMTP_PASSWORD). See .env.example.'
        );
    }

    cachedTransporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.port === 465,
        auth: { user: smtp.user, pass: smtp.password },
    });

    return cachedTransporter;
}

module.exports = {
    async sendEmail({ title,
        textBody,
        htmlBody,
        email,
        allowCC = false
    }) {
        // Staging talks to a real database but must never mail a real guest.
        if (CONFIG.env === "staging") {
            console.log(`[staging] not sending "${title}" to ${email}`);
            return;
        }

        if (!email) { console.log('sendEmail called without a recipient'); return; }

        const { smtp } = CONFIG;

        const mailOptions = {
            from: smtp.from || smtp.user,
            to: email,
            cc: allowCC ? smtp.cc : '',
            subject: title,
        };
        if (textBody) { mailOptions.text = textBody }
        if (htmlBody) { mailOptions.html = htmlBody }

        try {
            const info = await getTransporter().sendMail(mailOptions);
            console.log('Email sent:', info.response);
        } catch (error) {
            // A failed notification must not take down the request that triggered it —
            // the booking or enquiry is already saved by this point.
            console.log('Email failed:', error && error.message ? error.message : error);
        }
    }
}
