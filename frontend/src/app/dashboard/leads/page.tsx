'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from "lucide-react";

interface Lead {
    _id: string;
    lead_data: any;
    status: 'new' | 'processing' | 'sold' | 'rejected' | 'error';
    sold_price: number;
    latency_ms: number;
    created_at: string;
    source_domain?: string;
    form_id?: string;
    trusted_form_url?: string;
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                // Using the /recent endpoint which returns list of leads
                const res = await api.get('/reports/recent');
                setLeads(res.data);
            } catch (err) {
                console.error("Failed to fetch leads", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeads();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Leads</h2>
                <p className="text-muted-foreground">
                    View recent incoming lead traffic.
                </p>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Recent Leads</CardTitle>
                    <CardDescription>
                        A list of the most recent leads processed by the system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Latency</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                        No leads found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leads.map((lead) => (
                                    <TableRow key={lead._id}>
                                        <TableCell className="font-mono text-xs">{lead._id}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                lead.status === 'sold' ? 'default' :
                                                    lead.status === 'rejected' ? 'destructive' : 'secondary'
                                            }>
                                                {lead.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-green-600 font-medium">
                                            ${lead.sold_price.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {lead.latency_ms}ms
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium truncate max-w-[120px] inline-block" title={lead.source_domain}>
                                                    {lead.source_domain || 'Internal'}
                                                </span>
                                                {lead.trusted_form_url && (
                                                    <a
                                                        href={lead.trusted_form_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold hover:bg-yellow-200 w-fit flex items-center gap-1"
                                                    >
                                                        <CheckCircle2 className="h-2 w-2" /> Cert
                                                    </a>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(lead.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/dashboard/leads/${lead._id}`}>
                                                <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">View Trace</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
