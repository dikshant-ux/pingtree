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

                // Process raw sparse data into granular time series (e.g. last 24h)
                // For now, we'll just map the raw buckets to a displayable format
                // In a real prod app, we'd fill in the zero-hours.

                const statsMap: Record<string, any> = {};

                rawData.forEach((item: any) => {
                    // Item ID: {year, month, day, hour, status}
                    const d = item._id;
                    const dateObj = new Date(Date.UTC(d.year, d.month - 1, d.day, d.hour));
                    const label = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    if (!statsMap[label]) {
                        statsMap[label] = { time: label, total: 0, sold: 0, rejected: 0 };
                    }

                    statsMap[label].total += item.count;
                    if (d.status === 'sold') statsMap[label].sold += item.count;
                    else if (d.status === 'rejected') statsMap[label].rejected += item.count;
                });

                // Convert map to array and sort by time (this is tricky with just time strings, 
                // but if we receive data sorted from backend it helps. 
                // Currently backend sorts by ID components.

                const processedData = Object.values(statsMap);
                setData(processedData);
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
