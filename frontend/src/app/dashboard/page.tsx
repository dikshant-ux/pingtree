'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { DashboardStats } from '@/types';
import ActivityChart from '@/components/dashboard/ActivityChart';
import RecentLeadsList from '@/components/dashboard/RecentLeadsList';

function StatCard({ title, value, subtext }: { title: string; value: string; subtext?: string }) {
    return (
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider">{title}</h3>
            <div className="mt-2 flex items-baseline">
                <span className="text-3xl font-bold text-foreground">{value}</span>
                {subtext && <span className="ml-2 text-sm text-muted-foreground">{subtext}</span>}
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
        return <div className="text-foreground">Loading...</div>;
    }

    if (!stats) return <div className="text-destructive">Failed to load stats.</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Today's Pulse</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Leads Today" value={stats.total_leads.toLocaleString()} />
                <StatCard title="Sold Today" value={stats.sold_leads.toLocaleString()} />
                <StatCard
                    title="Revenue Today"
                    value={`$${stats.total_revenue.toLocaleString()}`}
                    subtext="Daily Revenue"
                />
                <StatCard
                    title="Win Rate"
                    value={`${stats.conversion_rate.toFixed(1)}%`}
                    subtext="Today's Conversion"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-sm">
                    <h3 className="text-lg font-medium text-foreground mb-4">Live Activity</h3>
                    <ActivityChart />
                </div>
                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                    <h3 className="text-lg font-medium text-foreground mb-4">Recent Leads</h3>
                    <RecentLeadsList />
                </div>
            </div>
        </div>
    );
}
