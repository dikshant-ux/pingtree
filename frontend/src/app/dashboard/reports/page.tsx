'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats } from '@/types';
import RevenueChart from '@/components/dashboard/reports/RevenueChart';
import ErrorBreakdownChart from '@/components/dashboard/reports/ErrorBreakdownChart';
import BuyerDetailedTable from '@/components/dashboard/reports/BuyerDetailedTable';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { TrendingUp, Target, Award, ArrowUpRight, Lightbulb, Package } from 'lucide-react';

function StatCard({ title, value, subtext, icon: Icon }: { title: string; value: string; subtext?: string; icon: any }) {
    return (
        <Card className="shadow-sm border-border/50 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
                {subtext && <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
                    {subtext}
                </p>}
            </CardContent>
        </Card>
    );
}

function InsightCard({ title, label, value, subvalue, color }: { title: string, label: string, value: string, subvalue?: string, color: string }) {
    return (
        <Card className="shadow-md border-l-4 overflow-hidden" style={{ borderLeftColor: color }}>
            <CardContent className="p-4 pt-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                    <Lightbulb className="h-3.5 w-3.5" style={{ color }} />
                    {title}
                </div>
                <div className="flex flex-col">
                    <span className="text-lg font-bold text-foreground line-clamp-1">{label}</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black text-foreground">{value}</span>
                        {subvalue && <span className="text-xs font-medium text-muted-foreground">{subvalue}</span>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function ReportsPage() {
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [insights, setInsights] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (date?.from) params.append('start_date', date.from.toISOString());
                if (date?.to) params.append('end_date', date.to.toISOString());

                const [statsRes, insightsRes] = await Promise.all([
                    api.get(`/reports/stats?${params.toString()}`),
                    api.get(`/reports/top-insights?${params.toString()}`)
                ]);

                setStats(statsRes.data);
                setInsights(insightsRes.data);
            } catch (err) {
                console.error("Failed to fetch reports data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [date]);

    if (loading && !stats) return (
        <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground animate-pulse">Analyzing system reports...</p>
        </div>
    );

    return (
        <div className="space-y-8 p-1 md:p-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tighter text-foreground mb-1">Intelligence Center</h2>
                    <p className="text-muted-foreground text-lg">
                        Deep dive into lead flows and buyer performance.
                    </p>
                </div>
                <div className="bg-background/80 backdrop-blur pb-2">
                    <DatePickerWithRange date={date} setDate={setDate} />
                </div>
            </div>

            {/* Top Insights Section */}
            <div className="grid gap-4 md:grid-cols-3">
                <InsightCard
                    title="MVP Buyer"
                    label={insights?.top_buyer || "Analyzing..."}
                    value={`$${(insights?.top_buyer_revenue || 0).toLocaleString()}`}
                    subvalue="Total Revenue"
                    color="#10b981"
                />
                <InsightCard
                    title="Best Source"
                    label={insights?.top_source || "Analyzing..."}
                    value={`$${(insights?.top_source_revenue || 0).toLocaleString()}`}
                    subvalue="Total Earnings"
                    color="#8b5cf6"
                />
                <InsightCard
                    title="Peak Day"
                    label={insights?.best_day || "Analyzing..."}
                    value={`$${(insights?.best_day_revenue || 0).toLocaleString()}`}
                    subvalue="Daily Revenue"
                    color="#f59e0b"
                />
            </div>

            {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Total Volume" value={stats.total_leads.toLocaleString()} subtext="Leads processed" icon={Package} />
                    <StatCard title="Successful Sales" value={stats.sold_leads.toLocaleString()} subtext="Successfully delivered" icon={Target} />
                    <StatCard title="Generated Revenue" value={`$${stats.total_revenue.toLocaleString()}`} subtext="Total earnings" icon={Award} />
                    <StatCard title="Overall Delta" value={`${stats.conversion_rate.toFixed(1)}%`} subtext="Conversion rate" icon={TrendingUp} />
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-12">
                <div className="md:col-span-12 lg:col-span-7">
                    <RevenueChart startDate={date?.from} endDate={date?.to} />
                </div>
                <div className="md:col-span-12 lg:col-span-5">
                    <ErrorBreakdownChart startDate={date?.from} endDate={date?.to} />
                </div>
            </div>

            <div className="w-full pt-4">
                <BuyerDetailedTable startDate={date?.from} endDate={date?.to} />
            </div>
        </div>
    );
}

