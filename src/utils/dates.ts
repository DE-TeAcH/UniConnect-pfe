/**
 * MySQL's mysql2 driver returns DATE columns as ISO strings like '2026-03-10T00:00:00.000Z'.
 * This utility extracts just the 'YYYY-MM-DD' portion so we can safely combine with time
 * or use for display without extra time cruft.
 */

/** Extract 'YYYY-MM-DD' from any date-ish string */
export function toDateOnly(d: string | null | undefined): string {
    if (!d) return '';
    const s = String(d);
    if (s.length <= 10) return s;           // already just a date
    return s.substring(0, 10);              // trim ISO timestamp
}

/** Format a date string for display as 'Mar 10, 2026' */
export function formatDisplayDate(d: string | null | undefined): string {
    if (!d) return '—';
    const dateOnly = toDateOnly(d);
    const parsed = new Date(dateOnly + 'T00:00:00');  // treat as local time
    if (isNaN(parsed.getTime())) return String(d);
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Check if an event has ended (end_date + end_time is in the past) */
export function isEventEnded(event: { end_date: string; end_time?: string }): boolean {
    const ed = toDateOnly(event.end_date);
    const endDt = new Date(`${ed}T${event.end_time || '23:59:59'}`);
    return new Date() > endDt;
}

/** Check if an event hasn't ended yet */
export function isEventActive(event: { end_date: string; end_time?: string }): boolean {
    return !isEventEnded(event);
}
