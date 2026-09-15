const axios = require('axios');

/**
 * Cache busting for the storefront.
 *
 * The website caches the category list for an hour. That is the right window for a
 * list that changes a few times a year, but those few times are exactly when someone
 * is standing there waiting to see the change appear. This pings the site's
 * `/api/revalidate` after a category write so the next request rebuilds.
 *
 * Deliberately fire-and-forget: the CMS save has already succeeded by the time this
 * runs, and a slow or unreachable website must not turn a successful save into an
 * error toast. A missed ping costs at most one cache window.
 *
 * Configured by SITE_REVALIDATE_URL and REVALIDATE_SECRET. With either unset it does
 * nothing, which is the correct behaviour for a local backend with no site attached.
 */
const TIMEOUT_MS = 5000;

function revalidateSiteTag(tag) {
    const url = process.env.SITE_REVALIDATE_URL;
    const secret = process.env.REVALIDATE_SECRET;

    if (!url || !secret) { return }

    axios.post(url, { tag }, {
        timeout: TIMEOUT_MS,
        headers: { 'x-revalidate-secret': secret }
    }).catch((error) => {
        // Logged, not thrown. See the note above.
        console.log(`[revalidate] ${tag} failed:`, error.message);
    });
}

module.exports = { revalidateSiteTag };
