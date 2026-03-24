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

    if (loading) return (
        <div className="h-[350px] w-full flex items-center justify-center mt-2">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Live Data...</span>
            </div>
        </div>
    );

    if (data.length === 0) return (
        <div className="h-[350px] w-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl mt-2 bg-slate-50/50">
            <p className="font-bold text-sm">No activity recorded yet</p>
            <p className="text-[10px] tracking-wide uppercase mt-1">Send some leads to see live data</p>
        </div>
    );

    return (
        <div className="h-[350px] w-full mt-4 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: -5,
                        bottom: 10,
                    }}
                >
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSold" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <filter id="shadowTotal" height="200%">
                            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#6366f1" floodOpacity="0.25"/>
                        </filter>
                        <filter id="shadowSold" height="200%">
                            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#10b981" floodOpacity="0.25"/>
                        </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                    <XAxis 
                        dataKey="time" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                        minTickGap={30}
                    />
                    <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        dx={-4}
                        width={35}
                    />
                    <Tooltip
                        contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            backdropFilter: 'blur(12px)',
                            borderRadius: '16px', 
                            border: '1px solid rgba(226, 232, 240, 0.8)',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                            padding: '16px',
                            color: '#0f172a',
                            fontWeight: 700,
                            fontSize: '12px',
                            minWidth: '160px'
                        }}
                        itemStyle={{ paddingBottom: '4px', margin: 0, fontWeight: 900, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}
                        labelStyle={{ color: '#64748b', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}
                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#6366f1" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorTotal)" 
                        name="Total Leads" 
                        activeDot={{ r: 6, strokeWidth: 3, stroke: '#ffffff', fill: '#4f46e5', style: { filter: 'drop-shadow(0px 4px 6px rgba(79, 70, 229, 0.4))' } }}
                        style={{ filter: 'url(#shadowTotal)' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="sold" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorSold)" 
                        name="Sold Leads" 
                        activeDot={{ r: 6, strokeWidth: 3, stroke: '#ffffff', fill: '#059669', style: { filter: 'drop-shadow(0px 4px 6px rgba(16, 185, 129, 0.4))' } }}
                        style={{ filter: 'url(#shadowSold)' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
