'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';

const TZ_STORAGE_KEY = 'pingtree_timezone';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimezoneContextValue {
    /** IANA timezone string, e.g. "Asia/Kolkata" */
    timezone: string;
    /** False until we've resolved TZ from localStorage or browser */
    tzLoaded: boolean;
    /** Update the timezone in state + localStorage + backend */
    updateTimezone: (tz: string) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TimezoneContext = createContext<TimezoneContextValue>({
    timezone: 'UTC',
    tzLoaded: false,
    updateTimezone: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TimezoneProvider({ children }: { children: ReactNode }) {
    // Always start with 'UTC' on initial render (safe for SSR).
    // We override this in the FIRST useEffect below — client-only.
    const [timezone, setTimezoneState] = useState<string>('UTC');
    const [tzLoaded, setTzLoaded]     = useState(false);

    /** Setter that always keeps state + localStorage in sync */
    const applyTimezone = (tz: string) => {
        setTimezoneState(tz);
        try { localStorage.setItem(TZ_STORAGE_KEY, tz); } catch {}
    };

    useEffect(() => {
        // ── Step 1: Instant TZ from localStorage / browser (zero API latency) ──
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const stored    = (() => { try { return localStorage.getItem(TZ_STORAGE_KEY); } catch { return null; } })();
        const localTz   = stored || browserTz;

        // Apply immediately so dates re-render in the right timezone right away
        applyTimezone(localTz);

        // ── Step 2: Sync with backend (source of truth) ──────────────────────
        const token = (() => { try { return localStorage.getItem('token') || sessionStorage.getItem('token'); } catch { return null; } })();

        if (!token) {
            setTzLoaded(true);
            return;
        }

        api.get('/users/me')
            .then(res => {
                const savedTz: string | undefined = res.data?.timezone;

                if (savedTz && savedTz !== 'UTC') {
                    // Server has an explicit preference → use it
                    applyTimezone(savedTz);
                } else {
                    // Server still has default 'UTC' → push browser TZ to server
                    // so future sessions start correctly
                    applyTimezone(browserTz);
                    api.patch('/users/me', { timezone: browserTz }).catch(() => {});
                }
            })
            .catch(() => {
                // Network error — local TZ (already applied above) is the best we have
            })
            .finally(() => {
                setTzLoaded(true);
            });
    }, []);

    const updateTimezone = async (tz: string) => {
        applyTimezone(tz);
        await api.patch('/users/me', { timezone: tz });
    };

    return (
        <TimezoneContext.Provider value={{ timezone, tzLoaded, updateTimezone }}>
            {children}
        </TimezoneContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTimezone(): TimezoneContextValue {
    return useContext(TimezoneContext);
}
