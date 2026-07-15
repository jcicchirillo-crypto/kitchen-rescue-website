const RECURRENCE_OPTIONS = ['none', 'daily', 'weekdays', 'weekly', 'fortnightly', 'monthly'];

function normalizeRecurrence(value) {
    const v = String(value || 'none').toLowerCase().trim();
    return RECURRENCE_OPTIONS.includes(v) ? v : 'none';
}

function parseYmd(ymd) {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function formatYmd(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function addDays(date, days) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    next.setDate(next.getDate() + days);
    return next;
}

function addMonths(date, months) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = next.getDate();
    next.setMonth(next.getMonth() + months);
    // Clamp if month rolled (e.g. Jan 31 → Feb)
    if (next.getDate() < day) {
        next.setDate(0);
    }
    return next;
}

/**
 * Next due date for a recurring task after completion.
 * Uses the task's current date when set; otherwise starts from today.
 */
function nextOccurrenceDate(currentDate, recurrence) {
    const rule = normalizeRecurrence(recurrence);
    if (rule === 'none') return null;

    const base = parseYmd(currentDate) || parseYmd(formatYmd(new Date()));
    if (!base) return null;

    if (rule === 'daily') {
        return formatYmd(addDays(base, 1));
    }
    if (rule === 'weekly') {
        return formatYmd(addDays(base, 7));
    }
    if (rule === 'fortnightly') {
        return formatYmd(addDays(base, 14));
    }
    if (rule === 'monthly') {
        return formatYmd(addMonths(base, 1));
    }
    if (rule === 'weekdays') {
        let cursor = addDays(base, 1);
        // 0 Sun … 6 Sat — skip weekends
        while (cursor.getDay() === 0 || cursor.getDay() === 6) {
            cursor = addDays(cursor, 1);
        }
        return formatYmd(cursor);
    }
    return null;
}

function recurrenceLabel(value) {
    const labels = {
        none: 'Does not repeat',
        daily: 'Daily',
        weekdays: 'Weekdays',
        weekly: 'Weekly',
        fortnightly: 'Fortnightly',
        monthly: 'Monthly',
    };
    return labels[normalizeRecurrence(value)] || 'Does not repeat';
}

module.exports = {
    RECURRENCE_OPTIONS,
    normalizeRecurrence,
    nextOccurrenceDate,
    recurrenceLabel,
};
