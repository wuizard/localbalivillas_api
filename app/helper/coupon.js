/**
 * Coupon scope.
 *
 * A code is valid for villas, for activities, or for both. Coupons created before
 * activities existed carry no `appliesTo` at all, and the only checkout that existed
 * then was villas — so a missing value reads as 'villas'. That keeps every existing
 * promo behaving exactly as it does today and stops an old villa code silently
 * discounting an activity.
 */

const SCOPES = ['villas', 'activities', 'both'];

function scopeOf(coupon) {
    const value = coupon && coupon.appliesTo;
    return SCOPES.indexOf(value) >= 0 ? value : 'villas';
}

/** `kind` is 'villas' or 'activities'. */
function allowsKind(coupon, kind) {
    const scope = scopeOf(coupon);
    return scope === 'both' || scope === kind;
}

/**
 * Throws the message a guest should see when a code is real but not usable here.
 * Deliberately does not say "this code is for activities" — that invites someone to
 * go hunting for the other funnel with a code that may also have limits on it.
 */
function assertKind(coupon, kind) {
    if (!allowsKind(coupon, kind)) {
        throw { statusCode: 400, message: 'This promo code cannot be used on this booking' };
    }
}

module.exports = { SCOPES, scopeOf, allowsKind, assertKind };
