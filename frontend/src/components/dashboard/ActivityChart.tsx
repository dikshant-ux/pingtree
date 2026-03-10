'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

interface ActivityDataPoint {
    time: string;
    total: number;
    sold: number;
    rejected: number;
}

export default function ActivityChart() {
    const [data, setData] = useState<ActivityDataPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/reports/activity');
                const rawData = res.data.data;

                // Create a map of the last 24 hours
                const now = new Date();
                const series: ActivityDataPoint[] = [];

                for (let i = 23; i >= 0; i--) {
                    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
                    d.setMinutes(0, 0, 0);

                    const year = d.getUTCFullYear();
                    const month = d.getUTCMonth() + 1;
                    const day = d.getUTCDate();
                    const hour = d.getUTCHours();

                    const match = rawData.find((item: any) =>
                        item._id.year === year &&
                        item._id.month === month &&
                        item._id.day === day &&
                        item._id.hour === hour
                    );

                    // Find statuses for this hour
                    const hourData = rawData.filter((item: any) =>
                        item._id.year === year &&
                        item._id.month === month &&
                        item._id.day === day &&
                        item._id.hour === hour
                    );

                    let total = 0;
                    let sold = 0;
                    let rejected = 0;

                    hourData.forEach((item: any) => {
                        total += item.count;
                        if (item._id.status === 'sold') sold += item.count;
                        else if (item._id.status === 'rejected' || item._id.status === 'invalid') rejected += item.count;
                    });

                    series.push({
                        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        total,
                        sold,
                        rejected
                    });
                }

                setData(series);
            } catch (err) {
                console.error("Failed to load activity", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Refresh every 30s
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">Loading chart...</div>;

    if (data.length === 0) return (
        <div className="h-[300px] w-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
            <p>No activity recorded yet</p>
            <p className="text-xs">Send some leads to see live data!</p>
        </div>
    );

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSold" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" className="text-xs text-muted-foreground" />
                    <YAxis className="text-xs text-muted-foreground" />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#8884d8" fillOpacity={1} fill="url(#colorTotal)" name="Total Leads" />
                    <Area type="monotone" dataKey="sold" stroke="#82ca9d" fillOpacity={1} fill="url(#colorSold)" name="Sold" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
