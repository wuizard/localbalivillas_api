// A sliding-window counter kept in process memory. It is deliberately simple: the
// public enquiry and lookup endpoints have no payment step in front of them, and
// something imperfect on day one beats a retrofit after the first spam wave.
//
// Caveat worth knowing before relying on it: with more than one instance the limit
// is per instance, not global. Move it to a shared store if the fleet grows.
const buckets = new Map();

// Stops the map growing without bound on a long-lived process.
const SWEEP_EVERY_MS = 5 * 60 * 1000;
let lastSweep = Date.now();

function sweep(now) {
    if (now - lastSweep < SWEEP_EVERY_MS) { return; }
    lastSweep = now;
    for (const [key, hits] of buckets) {
        if (!hits.length || now - hits[hits.length - 1] > SWEEP_EVERY_MS) {
            buckets.delete(key);
        }
    }
}

module.exports = {
    /**
     * Records a hit and returns false once `max` hits have landed inside `windowMs`.
     * Callers should fail with 429 rather than telling the caller which key tripped.
     */
    allow(key, { max = 5, windowMs = 60 * 1000 } = {}) {
        const now = Date.now();
        sweep(now);

        const hits = (buckets.get(key) || []).filter((at) => now - at < windowMs);
        if (hits.length >= max) {
            buckets.set(key, hits);
            return false;
        }

        hits.push(now);
        buckets.set(key, hits);
        return true;
    },

    /** Test seam - the sliding windows are process state, not request state. */
    reset() {
        buckets.clear();
    },
};
