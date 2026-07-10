function formatPhone(raw) {
    if (!raw) return null;
    let digits = String(raw).replace(/\D/g, '');
    if (digits.startsWith('440')) digits = '44' + digits.slice(3);
    if (digits.startsWith('44')) return `+${digits}`;
    if (digits.startsWith('0')) return `+44${digits.slice(1)}`;
    return digits ? `+${digits}` : null;
}

function normalizeEmail(raw) {
    const email = String(raw || '').trim().toLowerCase();
    return email && email.includes('@') ? email : '';
}

function parseFlexibleDate(value) {
    if (!value) return null;
    const text = String(value).trim();
    if (!text) return null;

    const meta = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*(am|pm))?)?$/i);
    if (meta) {
        const first = Number(meta[1]);
        const second = Number(meta[2]);
        const year = Number(meta[3]);
        let hour = meta[4] != null ? Number(meta[4]) : 12;
        const minute = meta[5] != null ? Number(meta[5]) : 0;
        const ampm = (meta[6] || '').toLowerCase();
        if (ampm === 'pm' && hour !== 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;

        // Meta exports are usually MM/DD/YYYY; if first part > 12, treat as DD/MM/YYYY.
        const month = first > 12 ? second : first;
        const day = first > 12 ? first : second;
        const d = new Date(year, month - 1, day, hour, minute, 0);
        return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }

    const iso = new Date(text);
    if (!Number.isNaN(iso.getTime())) return iso.toISOString();
    return null;
}

function normalizeLeadRow(row, defaultSource = 'csv-import') {
    const email = normalizeEmail(row.email);
    const name = String(row.name || '').trim() || '—';
    const phone = formatPhone(row.phone);
    const source = String(row.source || defaultSource).trim() || defaultSource;
    const notes = String(row.notes || '').trim() || null;
    const created_at = parseFlexibleDate(row.created_at) || null;
    return { name, email, phone, source, notes, created_at };
}

module.exports = {
    formatPhone,
    normalizeEmail,
    parseFlexibleDate,
    normalizeLeadRow,
};
