// Reads a required value from the environment. Config files are loaded after
// dotenv.config() in server.js, so a missing value here means it is absent from
// .env - fail at startup with the variable name rather than let the process come
// up pointed at nothing.
module.exports = function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(
            `Missing required environment variable ${name}. ` +
            'Copy .env.example to .env and fill it in.'
        );
    }
    return value;
};
