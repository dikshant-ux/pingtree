/**
 * timezone.ts — Pure, zero-dependency timezone utilities using the native Intl API.
 * 
 * Core concept: All data is stored as UTC in MongoDB. The frontend converts
 * logical calendar boundaries (e.g. "midnight in IST") into exact UTC timestamps
 * before sending them to the API. The backend stays pure UTC throughout.
 */

export type PresetKey =
    | 'today'
    | 'yesterday'
    | 'week_to_date'
    | 'last_week'
    | 'month_to_date'
    | 'last_month'
    | 'year_to_date'
    | 'last_year'
    | 'custom';

export interface DateRange {
    start: Date;
    end: Date;
}

// ─── Core TZ Arithmetic (Intl-based, zero deps) ───────────────────────────────

/**
 * Decompose a UTC Date into local calendar parts within a given IANA timezone.
 * This uses the Intl API which is available in all modern browsers and Node 12+.
 */
function getLocalParts(utcDate: Date, tz: string): {
    year: number; month: number; day: number;
    hour: number; minute: number; second: number;
} {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
    });
    const parts = Object.fromEntries(
        fmt.formatToParts(utcDate).map(p => [p.type, p.value])
    );
    return {
        year:   parseInt(parts.year,   10),
        month:  parseInt(parts.month,  10),
        day:    parseInt(parts.day,    10),
        hour:   parseInt(parts.hour,   10),
        minute: parseInt(parts.minute, 10),
        second: parseInt(parts.second, 10),
    };
}

/**
 * Returns the UTC Date that corresponds to midnight (00:00:00.000) of the
 * given UTC date's calendar day when viewed in the specified IANA timezone.
 * 
 * Example: zonedStartOfDay(new Date(), 'Asia/Kolkata')
 *   → May 12, 2026 00:00:00 IST  → May 11, 2026 18:30:00 UTC
 */
export function zonedStartOfDay(utcDate: Date, tz: string): Date {
    const { year, month, day } = getLocalParts(utcDate, tz);
    // Construct "midnight in TZ" by binary-searching for the UTC offset.
    // We use a faster approach: shift by offset, floor to day, shift back.
    // The most reliable method is to use the local year/month/day and find UTC:
    return findUtcForLocalMidnight(year, month, day, tz);
}

/**
 * Returns the UTC Date that corresponds to 23:59:59.999 of the
 * given UTC date's calendar day in the specified IANA timezone.
 */
export function zonedEndOfDay(utcDate: Date, tz: string): Date {
    const start = zonedStartOfDay(utcDate, tz);
    return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Given a local calendar year/month/day in an IANA timezone, finds the exact
 * UTC instant that corresponds to midnight of that local day.
 * Uses a bisection approach because UTC offsets vary (DST).
 */
function findUtcForLocalMidnight(year: number, month: number, day: number, tz: string): Date {
    // Start with a rough UTC estimate (assume UTC+14 worst case offset)
    const rough = Date.UTC(year, month - 1, day, 0, 0, 0) - 14 * 3600 * 1000;
    
    // Binary search within ±30 hours to find the UTC ms where local time = midnight
    let lo = rough;
    let hi = rough + 30 * 3600 * 1000;
    
    for (let i = 0; i < 48; i++) {
        const mid = Math.floor((lo + hi) / 2);
        const parts = getLocalParts(new Date(mid), tz);
        const localMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
        const targetMs = Date.UTC(year, month - 1, day, 0, 0, 0);
        if (localMs < targetMs) lo = mid;
        else hi = mid;
        if (hi - lo <= 1000) break;
    }
    return new Date(lo);
}

/**
 * Add days to a Date (UTC-safe).
 */
function addDays(date: Date, n: number): Date {
    return new Date(date.getTime() + n * 24 * 60 * 60 * 1000);
}

// ─── Preset Range Calculator ──────────────────────────────────────────────────

/**
 * Compute a { start, end } DateRange for a named preset, correctly bounded
 * by midnight/end-of-day in the user's IANA timezone.
 * 
 * Returns null for 'custom' (caller must supply custom range).
 */
export function getPresetRange(preset: PresetKey, tz: string): DateRange | null {
    const now = new Date();
    const todayStart = zonedStartOfDay(now, tz);
    const todayEnd   = zonedEndOfDay(now, tz);

    switch (preset) {
        case 'today':
            return { start: todayStart, end: todayEnd };

        case 'yesterday': {
            const yStart = zonedStartOfDay(addDays(todayStart, -1), tz);
            const yEnd   = zonedEndOfDay(addDays(todayStart, -1), tz);
            return { start: yStart, end: yEnd };
        }

        case 'week_to_date': {
            // Local day-of-week: 0=Sun … 6=Sat
            const { year, month, day } = getLocalParts(now, tz);
            const localNow = new Date(Date.UTC(year, month - 1, day));
            const dow = localNow.getUTCDay();
            const weekStart = zonedStartOfDay(addDays(todayStart, -dow), tz);
            return { start: weekStart, end: todayEnd };
        }

        case 'last_week': {
            const { year, month, day } = getLocalParts(now, tz);
            const localNow = new Date(Date.UTC(year, month - 1, day));
            const dow = localNow.getUTCDay();
            const thisWeekStart = addDays(todayStart, -dow);
            const lastWeekStart = zonedStartOfDay(addDays(thisWeekStart, -7), tz);
            const lastWeekEnd   = zonedEndOfDay(addDays(thisWeekStart, -1), tz);
            return { start: lastWeekStart, end: lastWeekEnd };
        }

        case 'month_to_date': {
            const { year, month } = getLocalParts(now, tz);
            const monthStart = findUtcForLocalMidnight(year, month, 1, tz);
            return { start: monthStart, end: todayEnd };
        }

        case 'last_month': {
            const { year, month } = getLocalParts(now, tz);
            const lastMonthYear  = month === 1 ? year - 1 : year;
            const lastMonthMonth = month === 1 ? 12 : month - 1;
            const lastMonthDays  = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
            const lmStart = findUtcForLocalMidnight(lastMonthYear, lastMonthMonth, 1, tz);
            const lmEnd   = zonedEndOfDay(findUtcForLocalMidnight(lastMonthYear, lastMonthMonth, lastMonthDays, tz), tz);
            return { start: lmStart, end: lmEnd };
        }

        case 'year_to_date': {
            const { year } = getLocalParts(now, tz);
            const ytdStart = findUtcForLocalMidnight(year, 1, 1, tz);
            return { start: ytdStart, end: todayEnd };
        }

        case 'last_year': {
            const { year } = getLocalParts(now, tz);
            const lyStart = findUtcForLocalMidnight(year - 1, 1, 1, tz);
            const lyEnd   = zonedEndOfDay(findUtcForLocalMidnight(year - 1, 12, 31, tz), tz);
            return { start: lyStart, end: lyEnd };
        }

        case 'custom':
        default:
            return null;
    }
}

// ─── Display Formatting ───────────────────────────────────────────────────────

/**
 * Format a UTC date string or Date for display in the user's timezone.
 * 
 * @param utcDate — ISO string (from API) or Date object (always UTC internally)
 * @param tz      — IANA timezone string, e.g. "Asia/Kolkata"
 * @param format  — 'datetime' | 'date' | 'time' | 'relative'
 */
export function formatInTimezone(
    utcDate: string | Date,
    tz: string,
    format: 'datetime' | 'date' | 'time' | 'relative' = 'datetime'
): string {
    const d = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    if (isNaN(d.getTime())) return '—';

    if (format === 'relative') {
        return formatRelative(d, tz);
    }

    const opts: Intl.DateTimeFormatOptions = { timeZone: tz };

    if (format === 'datetime' || format === 'date') {
        opts.year   = 'numeric';
        opts.month  = 'short';
        opts.day    = 'numeric';
    }
    if (format === 'datetime' || format === 'time') {
        opts.hour   = '2-digit';
        opts.minute = '2-digit';
        opts.hour12 = true;
    }

    return new Intl.DateTimeFormat('en-US', opts).format(d);
}

/**
 * Returns a "X ago" style string relative to now, but uses the correct
 * local-day context. For very recent times (<60s), shows "just now".
 */
function formatRelative(d: Date, tz: string): string {
    const nowMs  = Date.now();
    const diffMs = nowMs - d.getTime();
    const diffS  = Math.floor(diffMs / 1000);
    
    if (diffS < 60)          return 'just now';
    if (diffS < 3600)        return `${Math.floor(diffS / 60)}m ago`;
    if (diffS < 86400)       return `${Math.floor(diffS / 3600)}h ago`;
    if (diffS < 86400 * 7)   return `${Math.floor(diffS / 86400)}d ago`;
    // Fall back to a full date for older entries
    return formatInTimezone(d, tz, 'date');
}

/**
 * Returns the UTC offset string for a timezone at the current moment.
 * e.g. "UTC+5:30" for Asia/Kolkata
 */
export function getUtcOffsetLabel(tz: string): string {
    try {
        const now = new Date();
        const fmt = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            timeZoneName: 'shortOffset',
        });
        const parts = fmt.formatToParts(now);
        const tzPart = parts.find(p => p.type === 'timeZoneName');
        return tzPart?.value ?? tz;
    } catch {
        return tz;
    }
}

/**
 * Full list of IANA timezone names (via Intl), grouped by region prefix.
 * Falls back to a hardcoded common list if Intl.supportedValuesOf is not available.
 */
export function getAllTimezones(): string[] {
    try {
        // Available in modern browsers and Node 16+
        return (Intl as any).supportedValuesOf('timeZone') as string[];
    } catch {
        // Fallback — common zones
        return [
            'UTC',
            'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
            'America/Anchorage', 'Pacific/Honolulu', 'America/Toronto', 'America/Vancouver',
            'America/Sao_Paulo', 'America/Argentina/Buenos_Aires', 'America/Bogota', 'America/Mexico_City',
            'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome',
            'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Stockholm', 'Europe/Warsaw',
            'Europe/Athens', 'Europe/Helsinki', 'Europe/Moscow', 'Europe/Istanbul',
            'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Bangkok',
            'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai',
            'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth',
            'Pacific/Auckland', 'Pacific/Fiji',
            'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
        ];
    }
}
