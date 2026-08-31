// Which config the process runs on, chosen by APP_ENV rather than by which line in
// server.js happens to be commented out.
//
// The old way was two lines, one commented. Whichever was uncommented when someone
// last worked locally is what got committed and deployed — and the two differ in the
// database, the payment key, the signing secret and whether real guests get emailed.
// A staging box booted on config-prod charges real cards.
//
// APP_ENV, not NODE_ENV: staging *is* NODE_ENV=production in the Node sense, so
// overloading that variable would conflate "optimised build" with "real money".

const CONFIGS = {
    production: './config-prod',
    staging: './config-staging',
};

// Tolerated spellings, mapped to the canonical name.
const ALIASES = {
    prod: 'production',
    production: 'production',
    staging: 'staging',
    stage: 'staging',
};

const raw = (process.env.APP_ENV || '').trim().toLowerCase();

if (!raw) {
    throw new Error(
        'APP_ENV is not set. Set APP_ENV=staging or APP_ENV=production. ' +
        'Copy .env.example to .env and fill it in.'
    );
}

const name = ALIASES[raw];

if (!name) {
    throw new Error(
        `APP_ENV="${process.env.APP_ENV}" is not a known environment. ` +
        `Expected one of: ${Object.keys(CONFIGS).join(', ')}.`
    );
}

// Deliberately no default. Defaulting to production would let a misconfigured
// staging box reach the live database and the live payment key; defaulting to
// staging would let production quietly stop emailing guests. Refusing to boot is
// the only option that cannot be missed.
module.exports = require(CONFIGS[name]);
