const requireEnv = require('./requireEnv');

module.exports = {
    env: "staging",
    port: 5200,
    // Secrets come from the environment only - never commit them.
    // Required env: MONGO_DB_URL, SESSION_SECRET, XENDIT_SECRET_API_KEY
    // No fallbacks here either: the staging database URL carries the same
    // credentials as production, so a default would put them back in the repo.
    mongoDBURL: requireEnv('MONGO_DB_URL'),
    sessionSecret: requireEnv('SESSION_SECRET'),
    userSessionExpirationInSeconds: 2592000,
    adminSessionExpirationInSeconds: 15780000,
    // hoursCalculation: 7,
    hoursCalculation: 0,
    xenditSecretAPIKey: requireEnv('XENDIT_SECRET_API_KEY'),
    xenditPublicAPIKey: 'xnd_public_development_nG0wUVWvWehr5ZODI4w9ZMOZNYfHuufUqFgauXVBOv9XHCY8Y0p1wJgn2x8cOk9h',
    // Handoff target for the enquiry funnel. Digits only, country code first.
    whatsappNumber: process.env.WHATSAPP_NUMBER || '6282340243600',
    teamEmail: process.env.TEAM_EMAIL || 'rsv@localbalivillas.com',
    cmsURL: 'https://staging-lbvcms.wuebuild.com',
    // Where a review link points. SITE_URL overrides it for a deployment that serves
    // the storefront somewhere else.
    siteURL: process.env.SITE_URL || 'https://beta-lbv.netlify.app',

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
    // Required env: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
    aws: {
        region: process.env.AWS_REGION || 'ap-southeast-1',
        bucket: process.env.AWS_S3_BUCKET || 'sstaging-localbalivilla',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        uploadPrefix: process.env.AWS_S3_PREFIX || 'lbv',
        presignExpirySeconds: 300,
    },
}
