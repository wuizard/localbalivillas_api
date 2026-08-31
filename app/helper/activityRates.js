const moment = require('moment');

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * The rate on one date: an exact-date rule wins, then a weekday rule, then the base.
 * First match wins within each tier.
 *
 * This is the same precedence PropertiesPrices uses for nightly rates. What it
 * deliberately does NOT share is the nights arithmetic: a stay is charged per night
 * and drops the checkout day, an activity is charged for the day it happens. Running
 * a one-day activity through the stay helpers yields zero nights, which is zero
 * rupiah, so the two never share a code path beyond this function.
 */
function resolveRateOn(rules, date, base) {
    const weekday = WEEKDAYS[moment(date, 'YYYY-MM-DD').day()];

    let weekdayMatch = null;

    for (const rule of rules || []) {
        if (Array.isArray(rule.date) && rule.date.indexOf(date) >= 0) {
            return { adult: rule.adultPrice, child: rule.childPrice };
        }
        if (weekdayMatch === null && Array.isArray(rule.day) && rule.day.indexOf(weekday) >= 0) {
            weekdayMatch = { adult: rule.adultPrice, child: rule.childPrice };
        }
    }

    return weekdayMatch || base;
}

/** Every date from `from` to `to` inclusive, as YYYY-MM-DD. */
function datesBetween(from, to) {
    const out = [];
    let cursor = moment(from, 'YYYY-MM-DD');
    const stop = moment(to, 'YYYY-MM-DD');
    // A runaway range would build an unbounded array; a year is far more than any
    // calendar renders at once.
    let guard = 0;
    while (cursor.isSameOrBefore(stop) && guard < 400) {
        out.push(cursor.format('YYYY-MM-DD'));
        cursor = cursor.add(1, 'days');
        guard += 1;
    }
    return out;
}

module.exports = { resolveRateOn, datesBetween, WEEKDAYS };
