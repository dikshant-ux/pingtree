'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { DashboardStats } from '@/types';
import ActivityChart from '@/components/dashboard/ActivityChart';
import RecentLeadsList from '@/components/dashboard/RecentLeadsList';
import {
    ArrowUpRight, DollarSign, Activity, Users, CheckCircle,
    Flame, ExternalLink, Zap, Calendar, ChevronDown, Globe
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTimezone } from '@/context/TimezoneContext';
import {
    PresetKey, DateRange,
    getPresetRange, zonedStartOfDay, zonedEndOfDay, getUtcOffsetLabel
} from '@/lib/timezone';

// ─── Date picker helpers ──────────────────────────────────────────────────────

const PRESETS: { key: PresetKey; label: string }[] = [
    { key: 'today',         label: 'Today' },
    { key: 'yesterday',     label: 'Yesterday' },
    { key: 'week_to_date',  label: 'Week to Date' },
    { key: 'last_week',     label: 'Last Week' },
    { key: 'month_to_date', label: 'Month to Date' },
    { key: 'last_month',    label: 'Last Month' },
    { key: 'year_to_date',  label: 'Year to Date' },
    { key: 'last_year',     label: 'Last Year' },
    { key: 'custom',        label: 'Custom Range' },
];

function formatDisplayDate(d: Date) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── DateRangePicker ──────────────────────────────────────────────────────────

interface DateRangePickerProps {
    selected: PresetKey;
    customRange: DateRange | null;
    timezone: string;
    onChange: (preset: PresetKey, range: DateRange | null) => void;
}

function DateRangePicker({ selected, customRange, timezone, onChange }: DateRangePickerProps) {
    const [open, setOpen] = useState(false);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd]     = useState('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handlePreset = (key: PresetKey) => {
        if (key !== 'custom') {
            onChange(key, null);
            setOpen(false);
        } else {
            onChange('custom', null);
        }
    };

    const applyCustom = () => {
        if (!customStart || !customEnd) return;
        // Parse local date strings as dates in the user's timezone
        const [sy, sm, sd] = customStart.split('-').map(Number);
        const [ey, em, ed] = customEnd.split('-').map(Number);
        // Build a UTC midnight for those local days in the user's TZ
        const { findLocalMidnight } = (() => {
            function findLocalMidnight(y: number, m: number, d: number) {
                return zonedStartOfDay(new Date(Date.UTC(y, m - 1, d, 12)), timezone);
            }
            return { findLocalMidnight };
        })();
        const start = findLocalMidnight(sy, sm, sd);
        const end   = zonedEndOfDay(findLocalMidnight(ey, em, ed), timezone);
        onChange('custom', { start, end });
        setOpen(false);
    };

    let label = '';
    if (selected === 'custom' && customRange) {
        label = `${formatDisplayDate(customRange.start)} – ${formatDisplayDate(customRange.end)}`;
    } else {
        label = PRESETS.find(p => p.key === selected)?.label ?? 'Today';
    }

    const offsetLabel = getUtcOffsetLabel(timezone);

    return (
        <div ref={ref} className="relative flex items-center gap-2">
            {/* TZ Badge */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card text-xs font-semibold text-muted-foreground shadow-sm">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">{timezone.split('/').pop()?.replace(/_/g, ' ')}</span>
                <span className="text-indigo-500">{offsetLabel}</span>
            </div>

            {/* Trigger */}
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card text-sm font-semibold text-foreground shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200"
            >
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>{label}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-2xl shadow-black/10 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    <div className="p-2">
                        {PRESETS.filter(p => p.key !== 'custom').map(preset => (
                            <button
                                key={preset.key}
                                onClick={() => handlePreset(preset.key)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                                    ${selected === preset.key
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-foreground hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300'
                                    }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 mx-2" />

                    <div className="p-3">
                        <button
                            onClick={() => handlePreset('custom')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium mb-3 transition-all duration-150
                                ${selected === 'custom'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-foreground hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300'
                                }`}
                        >
                            Custom Range
                        </button>

                        {selected === 'custom' && (
                            <div className="space-y-2 animate-in fade-in duration-150">
                                <p className="text-xs text-muted-foreground px-1">
                                    Dates interpreted in <strong>{timezone.split('/').pop()?.replace(/_/g, ' ')}</strong> ({offsetLabel})
                                </p>
                                <div>
                                    <label className="text-xs text-muted-foreground font-medium mb-1 block">From</label>
                                    <input
                                        type="date"
                                        value={customStart}
                                        onChange={e => setCustomStart(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground font-medium mb-1 block">To</label>
                                    <input
                                        type="date"
                                        value={customEnd}
                                        onChange={e => setCustomEnd(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <button
                                    onClick={applyCustom}
                                    disabled={!customStart || !customEnd}
                                    className="w-full mt-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Apply Range
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ title, value, subtext, icon: Icon, trend, className, iconColorClass }: any) {
    return (
        <div className={`relative flex flex-col justify-between overflow-hidden rounded-2xl p-3 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full ${className}`}>
            <div className="absolute -right-4 -bottom-4 opacity-[0.12] pointer-events-none transform rotate-[-10deg]">
                <Icon className={`w-32 h-32 ${iconColorClass}`} />
            </div>
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{title}</h3>
                    <div className="mt-2 flex items-baseline">
                        <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
                    </div>
                </div>
                <div className="p-3 rounded-[1rem] bg-white/70 dark:bg-black/20 shadow-sm backdrop-blur-md border border-white/60 dark:border-white/10">
                    <Icon className={`w-5 h-5 ${iconColorClass}`} />
                </div>
            </div>
            <div className="relative z-10 mt-5 flex items-center text-xs font-medium tracking-wide min-h-[16px]">
                {subtext ? (
                    <>
                        {trend === 'up' && <ArrowUpRight className={`w-4 h-4 mr-0.5 ${iconColorClass}`} />}
                        <span className={trend === 'up' ? `${iconColorClass}` : 'text-slate-400'}>{subtext}</span>
                    </>
                ) : (
                    <span className="text-muted-foreground uppercase tracking-widest text-[10px] flex items-center gap-1.5 font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full ${iconColorClass.includes('indigo') ? 'bg-indigo-300' : 'bg-emerald-300'}`} />
                        ACTIVE
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── DashboardPage ────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<PresetKey, string> = {
    today:         "Today's Pulse",
    yesterday:     "Yesterday's Stats",
    week_to_date:  "Week to Date",
    last_week:     "Last Week",
    month_to_date: "Month to Date",
    last_month:    "Last Month",
    year_to_date:  "Year to Date",
    last_year:     "Last Year",
    custom:        "Custom Range",
};

export default function DashboardPage() {
    const { timezone, tzLoaded } = useTimezone();
    const [stats,       setStats]       = useState<DashboardStats | null>(null);
    const [loading,     setLoading]     = useState(true);
    const [preset,      setPreset]      = useState<PresetKey>('today');
    const [customRange, setCustomRange] = useState<DateRange | null>(null);

    const fetchStats = async (p: PresetKey, cr: DateRange | null, tz: string) => {
        setLoading(true);
        try {
            const range = p === 'custom' ? cr : getPresetRange(p, tz);
            if (!range) return;
            const res = await api.get('/reports/stats', {
                params: {
                    start_date: range.start.toISOString(),
                    end_date:   range.end.toISOString(),
                }
            });
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch stats', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch once timezone is loaded from the server
    useEffect(() => {
        if (tzLoaded) {
            fetchStats(preset, customRange, timezone);
        }
    }, [tzLoaded, timezone]);

    const handleDateChange = (p: PresetKey, cr: DateRange | null) => {
        setPreset(p);
        setCustomRange(cr);
        if (p !== 'custom' || cr) {
            fetchStats(p, cr, timezone);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600/10 rounded-xl text-indigo-600">
                        <Flame className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            {SECTION_LABELS[preset]}
                        </h2>
                        <p className="text-muted-foreground text-sm font-medium mt-1">
                            Live stats for your selected date range.
                        </p>
                    </div>
                </div>

                <DateRangePicker
                    selected={preset}
                    customRange={customRange}
                    timezone={timezone}
                    onChange={handleDateChange}
                />
            </div>

            {/* Stats grid */}
            {loading ? (
                <div className="min-h-[220px] flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shadow-lg" />
                    <p className="text-muted-foreground font-medium tracking-wider uppercase text-sm animate-pulse">Loading…</p>
                </div>
            ) : !stats ? (
                <div className="p-8 text-center bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 font-bold">
                    Failed to load stats. Please try refreshing.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Leads"
                        value={stats.total_leads.toLocaleString()}
                        icon={Users}
                        iconColorClass="text-indigo-600 dark:text-indigo-400"
                        className="border-indigo-100/50 shadow-[0_4px_20px_-4px_rgba(79,70,229,0.1)] bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-950/30 dark:to-card"
                    />
                    <StatCard
                        title="Sold Leads"
                        value={stats.sold_leads.toLocaleString()}
                        icon={CheckCircle}
                        iconColorClass="text-emerald-600 dark:text-emerald-400"
                        className="border-emerald-100/50 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)] bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-card"
                    />
                    <StatCard
                        title="Revenue"
                        value={`$${stats.total_revenue.toLocaleString()}`}
                        icon={DollarSign}
                        trend="up"
                        subtext="Live Total"
                        iconColorClass="text-amber-500 dark:text-amber-400"
                        className="border-amber-100/50 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.1)] bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-950/30 dark:to-card"
                    />
                    <StatCard
                        title="Win Rate"
                        value={`${stats.conversion_rate.toFixed(1)}%`}
                        icon={Activity}
                        subtext="Conversion Rate"
                        iconColorClass="text-rose-500 dark:text-rose-400"
                        className="border-rose-100/50 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.1)] bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-950/30 dark:to-card"
                    />
                    <StatCard
                        title="Redirected Leads"
                        value={stats.redirected_leads.toLocaleString()}
                        icon={ExternalLink}
                        iconColorClass="text-blue-600 dark:text-blue-400"
                        className="border-blue-100/50 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.1)] bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-950/30 dark:to-card"
                    />
                    <StatCard
                        title="Redirection %"
                        value={`${stats.redirection_rate.toFixed(1)}%`}
                        icon={Zap}
                        subtext="Redirects vs Sold"
                        iconColorClass="text-cyan-600 dark:text-cyan-400"
                        className="border-cyan-100/50 shadow-[0_4px_20px_-4px_rgba(8,145,178,0.1)] bg-gradient-to-br from-cyan-50/80 to-white dark:from-cyan-950/30 dark:to-card"
                    />
                </div>
            )}

            {/* Charts / Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                <div className="lg:col-span-2 bg-white dark:bg-card rounded-2xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-foreground tracking-tight">Live Activity</h3>
                        <div className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase tracking-widest rounded-full flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            Live
                        </div>
                    </div>
                    <ActivityChart />
                </div>
                <div className="bg-white dark:bg-card rounded-2xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-foreground tracking-tight">Recent Leads</h3>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-border">Just Now</Badge>
                    </div>
                    <RecentLeadsList />
                </div>
            </div>
        </div>
    );
}
