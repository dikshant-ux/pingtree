'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';

const TZ_STORAGE_KEY = 'pingtree_timezone';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimezoneContextValue {
    /** IANA timezone string, e.g. "Asia/Kolkata" */
    timezone: string;
    /** Whether the timezone has been resolved (from DB or browser) */
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
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    // Priority order for initial timezone:
    // 1. localStorage (instant, no flicker)
    // 2. browser TZ (fallback)
    const getInitialTz = (): string => {
        if (typeof window === 'undefined') return browserTz;
        return localStorage.getItem(TZ_STORAGE_KEY) || browserTz;
    };

    const [timezone, setTimezoneState] = useState<string>(getInitialTz);
    const [tzLoaded,  setTzLoaded]     = useState(false);

    // Internal setter that always keeps localStorage in sync
    const applyTimezone = (tz: string) => {
        setTimezoneState(tz);
        if (typeof window !== 'undefined') {
            localStorage.setItem(TZ_STORAGE_KEY, tz);
        }
    };

    // On mount: sync with backend (source of truth)
    useEffect(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            // Not logged in — use browser TZ and mark as loaded
            applyTimezone(browserTz);
            setTzLoaded(true);
            return;
        }

        api.get('/users/me')
            .then(res => {
                const savedTz: string = res.data?.timezone;

                if (savedTz && savedTz !== 'UTC') {
                    // User has a saved TZ → use it
                    applyTimezone(savedTz);
                } else {
                    // User has default 'UTC' or no TZ → auto-detect from browser
                    // and save it so they don't have to configure it manually
                    applyTimezone(browserTz);
                    api.patch('/users/me', { timezone: browserTz }).catch(() => {
                        // Non-blocking: localStorage already has correct TZ
                    });
                }
            })
            .catch(() => {
                // Network error — localStorage/browser TZ is already applied
            })
            .finally(() => {
                setTzLoaded(true);
            });
    }, []);

    /**
     * Update timezone in state, localStorage, and backend.
     * Throws on API failure so callers can show a toast.
     */
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
