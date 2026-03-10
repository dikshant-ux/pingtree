'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from 'recharts';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

const COLORS = ['#10b981', '#f43f5e', '#64748b']; // Emerald (Sold), Rose (Unsold), Slate (Invalid)
const ICONS = [CheckCircle2, XCircle, AlertCircle];

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

                const res = await api.get(`/reports/outcomes?${params.toString()}`);
                // Order: Sold, Unsold, Invalid Lead
                const order = ["Sold", "Unsold", "Invalid Lead"];
                const formattedData = order.map(name => {
                    const found = res.data.data.find((item: any) => item._id === name);
                    return {
                        name,
                        value: found ? found.count : 0
                    };
                });
                setData(formattedData);
            } catch (err) {
                console.error("Failed to load outcome stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [startDate, endDate]);

    if (loading) return <div className="h-[350px] flex items-center justify-center text-muted-foreground">Loading chart...</div>;

    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <Card className="col-span-3 shadow-md border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold tracking-tight">Outcome Distribution</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Chart Section */}
                    <div className="md:col-span-3 h-[280px] w-full relative">
                        {total === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground">No data recorded.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={95}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                className="hover:opacity-80 transition-opacity cursor-pointer"
                                            />
                                        ))}
                                        <Label
                                            value={total.toLocaleString()}
                                            position="center"
                                            className="text-3xl font-bold fill-foreground"
                                            dy={-10}
                                        />
                                        <Label
                                            value="Total Leads"
                                            position="center"
                                            className="text-xs font-medium fill-muted-foreground uppercase tracking-wider"
                                            dy={20}
                                        />
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                        formatter={(value: any) => [Number(value || 0).toLocaleString(), 'Leads']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Legend/Data Section */}
                    <div className="md:col-span-2 flex flex-col justify-center space-y-4">
                        {data.map((item, index) => {
                            const Icon = ICONS[index % ICONS.length];
                            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";

                            return (
                                <div key={item.name} className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-border hover:bg-accent/5 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                                            style={{ backgroundColor: `${COLORS[index]}15` }}
                                        >
                                            <Icon className="h-5 w-5" style={{ color: COLORS[index] }} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">{percentage}% of total</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-base font-semibold">{item.value.toLocaleString()}</p>
                                        <p className="text-[10px] uppercase text-muted-foreground font-medium tracking-tighter">Leads</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
