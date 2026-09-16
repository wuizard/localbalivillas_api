const requireEnv = require('./requireEnv');

module.exports = {
    env: "prod",
    port: 5000,
    // Secrets come from the environment only - never commit them.
    // Required env: MONGO_DB_URL, SESSION_SECRET, XENDIT_SECRET_API_KEY
    // No fallbacks on purpose: production must not silently fall back to a
    // staging database, a shared signing key, or a sandbox payment key.
    mongoDBURL: requireEnv('MONGO_DB_URL'),
    sessionSecret: requireEnv('SESSION_SECRET'),
    userSessionExpirationInSeconds: 2592000,
    adminSessionExpirationInSeconds: 15780000,
    // hoursCalculation: 7,
    hoursCalculation: 0,
    xenditSecretAPIKey: requireEnv('XENDIT_SECRET_API_KEY'),
    xenditPublicAPIKey: 'xnd_public_production_Pyj97q9KrJOyh8amUnWKD7bdn3GuhWIOvNIYybXtirLYcEChKdFzmvui8p7',
    // Handoff target for the enquiry funnel. Digits only, country code first.
    whatsappNumber: process.env.WHATSAPP_NUMBER || '6282340243600',
    teamEmail: process.env.TEAM_EMAIL || 'rsv@localbalivillas.com',
    cmsURL: 'https://admin.localbalivillas.com/',
    siteURL: process.env.SITE_URL || 'https://localbalivillas.com',

    // Mail. Credentials come from the environment only - never commit them.
    // Required in production: SMTP_USER, SMTP_PASSWORD.
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.zoho.com',
        port: Number(process.env.SMTP_PORT) || 465,
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD,
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        cc: (process.env.SMTP_CC || '').split(',').map((s) => s.trim()).filter(Boolean),
    },

    // S3 upload. Credentials come from the environment only - never commit them.
    // Required env: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET
    // NOTE: AWS_S3_BUCKET has no fallback here on purpose - production must not
    // silently write into the staging bucket. Presign fails loudly until it is set.
    aws: {
        region: process.env.AWS_REGION || 'ap-southeast-1',
        bucket: process.env.AWS_S3_BUCKET,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        uploadPrefix: process.env.AWS_S3_PREFIX || 'lbv',
        presignExpirySeconds: 300,
    },
}
