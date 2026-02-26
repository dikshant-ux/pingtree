'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats } from '@/types';
import RevenueChart from '@/components/dashboard/reports/RevenueChart';
import BuyerPerformanceTable from '@/components/dashboard/reports/BuyerPerformanceTable';
import ErrorBreakdownChart from '@/components/dashboard/reports/ErrorBreakdownChart';

function StatCard({ title, value, subtext }: { title: string; value: string; subtext?: string }) {
    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
            </CardContent>
        </Card>
    );
}

import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';

export default function ReportsPage() {
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (date?.from) params.append('start_date', date.from.toISOString());
                if (date?.to) params.append('end_date', date.to.toISOString());

                const res = await api.get(`/reports/stats?${params.toString()}`);
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [date]);

    if (loading && !stats) return <div className="p-8">Loading reports...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Reports</h2>
                    <p className="text-muted-foreground">
                        Historical performance analytics.
                    </p>
                </div>
                <DatePickerWithRange date={date} setDate={setDate} />
            </div>

            {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Total Leads" value={stats.total_leads.toLocaleString()} subtext="In selected period" />
                    <StatCard title="Sold Leads" value={stats.sold_leads.toLocaleString()} subtext="Monetized" />
                    <StatCard title="Revenue" value={`$${stats.total_revenue.toLocaleString()}`} subtext="Total earnings" />
                    <StatCard title="Conversion" value={`${stats.conversion_rate.toFixed(1)}%`} subtext="Lead to Sale rate" />
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <RevenueChart startDate={date?.from} endDate={date?.to} />
                <ErrorBreakdownChart startDate={date?.from} endDate={date?.to} />
            </div>
            <div className="grid gap-4 md:grid-cols-1">
                <BuyerPerformanceTable startDate={date?.from} endDate={date?.to} />
            </div>
        </div>
    );
}
