'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6'];

export default function ErrorBreakdownChart({ startDate, endDate }: { startDate?: Date, endDate?: Date }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (startDate) params.append('start_date', startDate.toISOString());
                if (endDate) params.append('end_date', endDate.toISOString());

                const res = await api.get(`/reports/errors?${params.toString()}`);
                // Backend returns { _id: "rejected", count: 10 }
                const formattedData = res.data.data.map((item: any) => ({
                    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
                    value: item.count
                }));
                setData(formattedData);
            } catch (err) {
                console.error("Failed to load error stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [startDate, endDate]);

    if (loading) return <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading chart...</div>;

    return (
        <Card className="col-span-3 shadow-sm">
            <CardHeader>
                <CardTitle>Outcome Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {data.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground">No errors recorded.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                    itemStyle={{ color: 'var(--foreground)' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
