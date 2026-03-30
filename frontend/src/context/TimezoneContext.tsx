'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimezoneContextValue {
    /** IANA timezone string, e.g. "Asia/Kolkata" */
    timezone: string;
    /** Whether the timezone has been loaded from the server */
    tzLoaded: boolean;
    /** Update the timezone in state + persist to backend */
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
    // Default to browser's local timezone as a best-guess before the API responds
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const [timezone, setTimezone] = useState<string>(browserTz);
    const [tzLoaded, setTzLoaded] = useState(false);

    // On mount: fetch saved TZ from backend
    useEffect(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            setTzLoaded(true); // Not logged in — use browser default
            return;
        }

        api.get('/users/me')
            .then(res => {
                const savedTz: string = res.data?.timezone;
                if (savedTz && savedTz !== 'UTC') {
                    setTimezone(savedTz);
                } else if (savedTz === 'UTC') {
                    // User hasn't set a preference yet — auto-set to browser timezone
                    // and silently save it (best-effort, non-blocking)
                    setTimezone(browserTz);
                    api.patch('/users/me', { timezone: browserTz }).catch(() => {});
                }
            })
            .catch(() => {
                // Network error — keep browser default
            })
            .finally(() => {
                setTzLoaded(true);
            });
    }, []);

    /**
     * Update the timezone both locally and on the server.
     * Throws if the API call fails so callers can show an error toast.
     */
    const updateTimezone = async (tz: string) => {
        setTimezone(tz);
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
