'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { DashboardStats } from '@/types';
import ActivityChart from '@/components/dashboard/ActivityChart';
import RecentLeadsList from '@/components/dashboard/RecentLeadsList';
import { ArrowUpRight, DollarSign, Activity, Users, CheckCircle, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
                <div className={`p-3 rounded-[1rem] bg-white/70 dark:bg-black/20 shadow-sm backdrop-blur-md border border-white/60 dark:border-white/10`}>
                    <Icon className={`w-5 h-5 ${iconColorClass}`} />
                </div>
            </div>
            <div className="relative z-10 mt-5 flex items-center text-xs font-medium tracking-wide min-h-[16px]">
                {subtext ? (
                    <>
                        {trend === 'up' && <ArrowUpRight className={`w-4 h-4 mr-0.5 ${iconColorClass}`} />}
                        <span className={trend === 'up' ? `${iconColorClass}` : "text-slate-400"}>
                            {subtext}
                        </span>
                    </>
                ) : (
                    <span className="text-muted-foreground uppercase tracking-widest text-[10px] flex items-center gap-1.5 font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full ${iconColorClass.includes('indigo') ? 'bg-indigo-300' : 'bg-emerald-300'}`}></span>
                        ACTIVE
                    </span>
                )}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/reports/stats/today');
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shadow-lg"></div>
                <p className="text-muted-foreground font-medium tracking-wider uppercase text-sm animate-pulse">Loading Dashboard...</p>
            </div>
        );
    }

    if (!stats) return (
        <div className="p-8 text-center bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 font-bold">
            Failed to load your dashboard stats. Please try refreshing.
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-indigo-600/10 rounded-xl text-indigo-600">
                    <Flame className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Today's Pulse</h2>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Here is what is happening with your leads today.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    title="Daily Revenue"
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
                    subtext="Today's Conversion"
                    iconColorClass="text-rose-500 dark:text-rose-400"
                    className="border-rose-100/50 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.1)] bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-950/30 dark:to-card"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                <div className="lg:col-span-2 bg-white dark:bg-card rounded-2xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-foreground tracking-tight">Live Activity</h3>
                        <div className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase tracking-widest rounded-full flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
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
