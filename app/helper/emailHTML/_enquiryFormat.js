const moment = require('moment');

const BUDGET_LABELS = {
    under_25m: 'Under IDR 25,000,000',
    '25m_50m': 'IDR 25,000,000 - 50,000,000',
    '50m_100m': 'IDR 50,000,000 - 100,000,000',
    over_100m: 'Over IDR 100,000,000',
    not_sure: 'Not sure yet',
};

function escapeHtml(value) {
    if (value === null || value === undefined) { return ''; }
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function row(label, value) {
    if (!value) { return ''; }
    return `<tr>
        <td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
        <td style="padding:6px 0;color:#1d2429;font-size:14px;">${escapeHtml(value)}</td>
    </tr>`;
}

function shell(inner) {
    return `<div style="font-family:Helvetica,Arial,sans-serif;background:#fdfcfb;padding:24px;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e0d7;border-radius:6px;padding:28px;">
            ${inner}
        </div>
    </div>`;
}

function detailRows(data) {
    return [
        row('Reference', data.reference),
        row('Occasion', data.subject && data.subject.name),
        row('Date', data.eventDate
            ? moment(data.eventDate).format('dddd, D MMMM YYYY') + (data.dateFlexible ? ' (flexible)' : '')
            : (data.dateFlexible ? 'Flexible' : '')),
        row('Guests', data.guestCount),
        row('Villa', data.propertyName),
        row('Budget', BUDGET_LABELS[data.budgetBand]),
    ].join('');
}

module.exports = {
    /**
     * Sent to the team. Every field the team would otherwise ask for in chat is here,
     * because the guest may open WhatsApp and never press send.
     */
    emailEnquiryTeam({ data }) {
        const guest = data.guest || {};
        return shell(`
            <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#957c64;">New enquiry</p>
            <h1 style="margin:0 0 20px;font-size:22px;color:#1d2429;">${escapeHtml(data.reference)}</h1>
            <table style="border-collapse:collapse;width:100%;">
                ${detailRows(data)}
                ${row('Name', guest.name)}
                ${row('Email', guest.email)}
                ${row('Phone', guest.phoneNumber)}
                ${row('Country', guest.country)}
                ${row('Source', data.source)}
                ${row('Booking', data.bookingId)}
            </table>
            ${data.occasionNote ? `<div style="margin-top:18px;padding:14px;background:#f6f2ed;border-radius:4px;">
                <p style="margin:0 0 6px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;">What they said</p>
                <p style="margin:0;font-size:14px;color:#1d2429;white-space:pre-wrap;">${escapeHtml(data.occasionNote)}</p>
            </div>` : ''}
            <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">
                Open the CMS and search this reference to reply and record a quote.
            </p>
        `);
    },

    /**
     * Sent to the guest. Carries the reference and says plainly that nothing is held -
     * an enquiry that reads like a reservation is a complaint waiting to happen.
     */
    emailEnquiryGuest({ data }) {
        const guest = data.guest || {};
        return shell(`
            <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#957c64;">Local Bali Villas</p>
            <h1 style="margin:0 0 12px;font-size:22px;color:#1d2429;">We have your enquiry</h1>
            <p style="margin:0 0 18px;font-size:15px;color:#1d2429;line-height:1.6;">
                Thank you${guest.firstName ? ', ' + escapeHtml(guest.firstName) : ''}. Our team will come back to you
                with what is possible and what it costs. Your reference is
                <strong style="font-family:monospace;">${escapeHtml(data.reference)}</strong> - quote it in any message.
            </p>
            <table style="border-collapse:collapse;width:100%;">
                ${detailRows(data)}
            </table>
            <p style="margin:20px 0 0;padding:14px;background:#f7efdf;border-radius:4px;font-size:13px;color:#1d2429;line-height:1.6;">
                This is an enquiry, not a booking. Nothing is reserved and no dates are held until we
                have confirmed the details and the price with you.
            </p>
        `);
    },

    BUDGET_LABELS,
};
