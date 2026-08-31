const crypto = require('crypto');

// No 0/O/1/I/L - guests read these back over WhatsApp and a misread character is a
// support conversation. 30 symbols, 6 of them, is ~729M per prefix.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXY';
const BODY_LENGTH = 6;

function randomBody() {
    const bytes = crypto.randomBytes(BODY_LENGTH);
    let out = '';
    for (let i = 0; i < BODY_LENGTH; i++) {
        out += ALPHABET[bytes[i] % ALPHABET.length];
    }
    return out;
}

module.exports = {
    /**
     * A short human reference like EV-7K2M9Q. Collisions are resolved by retrying
     * against the collection rather than by making the string longer, because the
     * string is the part a person has to say out loud.
     */
    async generateReference(model, prefix = 'EV', attempts = 8) {
        for (let i = 0; i < attempts; i++) {
            const reference = `${prefix}-${randomBody()}`;
            const taken = await model.findOne({ reference }).lean();
            if (!taken) { return reference; }
        }
        throw { statusCode: 500, message: 'Could not allocate a reference' };
    },

    /** Opaque, unguessable, and the only thing that ever appears in a lookup URL. */
    generateLookupToken() {
        return crypto.randomBytes(32).toString('hex');
    },
};
