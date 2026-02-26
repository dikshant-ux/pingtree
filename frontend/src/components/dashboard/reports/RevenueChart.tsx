'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RevenueChart({ startDate, endDate }: { startDate?: Date, endDate?: Date }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (startDate) params.append('start_date', startDate.toISOString());
                if (endDate) params.append('end_date', endDate.toISOString());

                const res = await api.get(`/reports/revenue-over-time?${params.toString()}`);
                // Transform data for chart
                // Backend returns: { _id: { year, month, day }, revenue, count }
                const formattedData = res.data.data.map((item: any) => {
                    const date = new Date(Date.UTC(item._id.year, item._id.month - 1, item._id.day));
                    return {
                        date: date.toLocaleDateString(),
                        revenue: item.revenue,
                        count: item.count
                    };
                });
                setData(formattedData);
            } catch (err) {
                console.error("Failed to load revenue data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [startDate, endDate]);

    if (loading) return <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading chart...</div>;

    return (
        <Card className="col-span-4 shadow-sm">
            <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                    {data.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground">No revenue data yet.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={data}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                                <YAxis className="text-xs text-muted-foreground" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                    itemStyle={{ color: 'var(--foreground)' }}
                                    formatter={(value: number | undefined) => [`$${Number(value || 0).toFixed(2)}`, 'Revenue']}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
