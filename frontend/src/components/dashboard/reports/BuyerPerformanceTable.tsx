'use client';

import { useEffect, useState } from 'react';
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

export default function BuyerPerformanceTable({ startDate, endDate }: { startDate?: Date, endDate?: Date }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (startDate) params.append('start_date', startDate.toISOString());
                if (endDate) params.append('end_date', endDate.toISOString());

                const res = await api.get(`/reports/buyer-performance?${params.toString()}`);
                setData(res.data.data);
            } catch (err) {
                console.error("Failed to load buyer performance", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [startDate, endDate]);

    if (loading) return <div className="h-[200px] flex items-center justify-center">Loading table...</div>;

    return (
        <Card className="col-span-3 shadow-sm">
            <CardHeader>
                <CardTitle>Buyer Performance</CardTitle>
                <CardDescription>
                    Breakdown by revenue and volume.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Buyer</TableHead>
                            <TableHead className="text-right">Sold</TableHead>
                            <TableHead className="text-right">Avg Price</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">No sales recorded.</TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item._id}>
                                    <TableCell className="font-medium">
                                        {item.buyer_name || 'Unknown Buyer'}
                                    </TableCell>
                                    <TableCell className="text-right">{item.sold_count}</TableCell>
                                    <TableCell className="text-right">${item.avg_price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                                        ${item.revenue.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
