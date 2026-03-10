'use client';

import { useState, useEffect, Fragment } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, TrendingUp, DollarSign, Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface DailyStat {
    date: string;
    revenue: number;
    count: number;
}

interface BuyerDetailedData {
    _id: string;
    buyer_name: string;
    total_revenue: number;
    total_count: number;
    daily_stats: DailyStat[];
}

export default function BuyerDetailedTable({ startDate, endDate }: { startDate?: Date, endDate?: Date }) {
    const [data, setData] = useState<BuyerDetailedData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (startDate) params.append('start_date', startDate.toISOString());
                if (endDate) params.append('end_date', endDate.toISOString());

                const res = await api.get(`/reports/buyer-detailed?${params.toString()}`);
                setData(res.data.data);
            } catch (err) {
                console.error("Failed to load detailed buyer performance", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [startDate, endDate]);

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (loading) return <div className="h-[300px] flex items-center justify-center text-muted-foreground italic">Gathering detailed buyer insights...</div>;

    return (
        <Card className="shadow-lg border-border/50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">Buyer Performance Insights</CardTitle>
                        <CardDescription>
                            Deep dive into buyer activity and daily revenue trends.
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="px-3 py-1 bg-primary/5 text-primary border-primary/20">
                        <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                        Live Metrics
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-xl border border-border/60 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-accent/30">
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead className="font-semibold text-foreground">Buyer Name</TableHead>
                                <TableHead className="text-right font-semibold text-foreground">Leads Sold</TableHead>
                                <TableHead className="text-right font-semibold text-foreground">Avg. Price</TableHead>
                                <TableHead className="text-right font-semibold text-foreground">Total Revenue</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground h-32 italic">
                                        No sales data available for the selected period.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((item) => (
                                    <Fragment key={item._id}>
                                        <TableRow
                                            key={item._id}
                                            className="group cursor-pointer hover:bg-accent/20 transition-colors"
                                            onClick={() => toggleRow(item._id)}
                                        >
                                            <TableCell>
                                                {expandedRows[item._id] ? (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                )}
                                            </TableCell>
                                            <TableCell className="font-semibold text-foreground flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Package className="h-4 w-4 text-primary" />
                                                </div>
                                                {item.buyer_name || 'Unknown Buyer'}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">{item.total_count.toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                ${(item.total_revenue / (item.total_count || 1)).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-green-600 dark:text-green-400 tabular-nums text-lg">
                                                ${item.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                    Details
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                        {expandedRows[item._id] && (
                                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                <TableCell colSpan={6} className="p-0 border-t-0 border-b-2 border-primary/20">
                                                    <div className="p-6 bg-gradient-to-b from-transparent to-accent/5">
                                                        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                                                            <Calendar className="h-4 w-4" />
                                                            Daily Breakdown
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                            {item.daily_stats.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((day, idx) => (
                                                                <div key={idx} className="bg-white dark:bg-card p-4 rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                                                                    <div className="text-xs text-muted-foreground font-medium mb-2">
                                                                        {format(new Date(day.date), 'EEE, MMM dd, yyyy')}
                                                                    </div>
                                                                    <div className="flex justify-between items-end">
                                                                        <div>
                                                                            <div className="text-sm font-bold text-foreground flex items-center">
                                                                                <DollarSign className="h-3 w-3 mr-0.5 text-green-500" />
                                                                                {day.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                            </div>
                                                                            <div className="text-[10px] text-muted-foreground uppercase">Revenue</div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <div className="text-sm font-bold text-foreground">
                                                                                {day.count}
                                                                            </div>
                                                                            <div className="text-[10px] text-muted-foreground uppercase">Sold</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
