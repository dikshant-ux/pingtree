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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Lead {
    _id: string;
    readable_id?: string;
    lead_data: any;
    status: 'new' | 'processing' | 'sold' | 'rejected' | 'error' | 'Invalid Lead';
    sold_price: number;
    latency_ms: number;
    created_at: string;
    source_domain?: string;
    form_id?: string;
    trusted_form_url?: string;
    is_redirected?: boolean;
    validation_results?: any[];
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLeads, setTotalLeads] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [sources, setSources] = useState<string[]>([]);
    const [selectedSource, setSelectedSource] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    const fetchLeads = async (pageNum: number, limit: number, source: string, status: string) => {
        setLoading(true);
        try {
            const sourceParam = source !== 'all' ? `&source_domain=${source}` : '';
            const statusParam = status !== 'all' ? `&status=${status}` : '';
            const res = await api.get(`/reports/recent?page=${pageNum}&limit=${limit}${sourceParam}${statusParam}`);
            setLeads(res.data.items);
            setTotalLeads(res.data.total);
            setTotalPages(res.data.pages);
        } catch (err) {
            console.error("Failed to fetch leads", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSources = async () => {
        try {
            const res = await api.get('/reports/sources');
            setSources(res.data);
        } catch (err) {
            console.error("Failed to fetch sources", err);
        }
    };

    useEffect(() => {
        fetchSources();
    }, []);

    useEffect(() => {
        fetchLeads(page, pageSize, selectedSource, selectedStatus);
    }, [page, pageSize, selectedSource, selectedStatus]);

    if (loading && page === 1 && leads.length === 0) return <div className="p-8 text-center">Loading leads...</div>;

    const handlePageSizeChange = (value: string) => {
        setPageSize(parseInt(value));
        setPage(1); // Reset to first page when limit changes
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Leads</h2>
                    <p className="text-muted-foreground">
                        View incoming lead traffic. Total: {totalLeads}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
                        <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setPage(1); }}>
                            <SelectTrigger className="w-[150px] h-8 text-xs font-medium border-slate-200">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs font-bold text-indigo-600">All Status</SelectItem>
                                <SelectItem value="sold" className="text-xs text-emerald-600 font-semibold">Sold</SelectItem>
                                <SelectItem value="unsold" className="text-xs text-rose-600 font-semibold">Unsold</SelectItem>
                                <SelectItem value="Invalid Lead" className="text-xs text-slate-400">Invalid Lead</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Source:</span>
                        <Select value={selectedSource} onValueChange={(val) => { setSelectedSource(val); setPage(1); }}>
                            <SelectTrigger className="w-[180px] h-8 text-xs font-medium border-slate-200">
                                <SelectValue placeholder="All Sources" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs font-bold text-indigo-600">All Sources</SelectItem>
                                {sources.map(s => (
                                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Per Page:</span>
                        <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                            <SelectTrigger className="w-[80px] h-8 text-xs font-medium border-slate-200">
                                <SelectValue placeholder="Size" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="20" className="text-xs">20</SelectItem>
                                <SelectItem value="50" className="text-xs">50</SelectItem>
                                <SelectItem value="100" className="text-xs">100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <Card className="shadow-sm overflow-hidden border-slate-200">
                <CardHeader className="pb-3 bg-slate-50/50 border-b">
                    <CardTitle className="text-xl">Recent Leads</CardTitle>
                    <CardDescription>
                        A list of leads processed by the system.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="w-[100px] font-semibold text-slate-700">ID</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Price</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Latency</TableHead>
                                    <TableHead className="min-w-[150px] font-semibold text-slate-700">Validation</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Source</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Redirected</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Date</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent shadow-sm"></div>
                                                <span className="text-sm font-medium text-slate-600">Loading page {page}...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : leads.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground h-32">
                                            No leads found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    leads.map((lead) => (
                                        <TableRow key={lead._id} className="hover:bg-slate-50/80 transition-colors">
                                            <TableCell className="font-bold text-indigo-700">
                                                {lead.readable_id || lead._id.substring(0, 8)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="capitalize font-semibold shadow-sm" variant={
                                                    lead.status === 'sold' ? 'default' :
                                                        lead.status === 'rejected' ? 'destructive' : 'secondary'
                                                }>
                                                    {lead.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-emerald-600 font-bold">
                                                ${lead.sold_price.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-xs font-medium">
                                                {lead.latency_ms}ms
                                            </TableCell>
                                            <TableCell>
                                                {lead.validation_results && lead.validation_results.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {lead.validation_results.map((res: any, idx: number) => (
                                                            <Badge
                                                                key={idx}
                                                                variant={res.success ? "outline" : "destructive"}
                                                                className={res.success ? "text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50 font-bold" : "text-[10px] shadow-sm font-bold"}
                                                            >
                                                                {res.validator_name}: {res.success ? 'Valid' : 'Invalid'}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 italic">None</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[10px] bg-indigo-50 px-2 py-0.5 rounded-full text-indigo-700 font-bold truncate max-w-[140px] border border-indigo-100 shadow-sm" title={lead.source_domain}>
                                                        {lead.source_domain || 'Internal'}
                                                    </span>
                                                    {lead.trusted_form_url && (
                                                        <a
                                                            href={lead.trusted_form_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-extrabold hover:bg-amber-200 w-fit flex items-center gap-1 border border-amber-200 shadow-sm transition-colors"
                                                        >
                                                            <CheckCircle2 className="h-2 w-2" /> Cert
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={lead.is_redirected ? "default" : "destructive"}
                                                    className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] shadow-sm ${lead.is_redirected ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
                                                >
                                                    {lead.is_redirected ? 'YES' : 'NO'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-xs font-medium">
                                                {new Date(lead.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/dashboard/leads/${lead._id}`}>
                                                    <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 shadow-sm transition-all duration-200">View Trace</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50/30 border-t">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                            Page {page} <span className="text-slate-300 mx-1">/</span> {totalPages} <span className="ml-2 text-slate-400 font-medium">({totalLeads} Records)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="font-bold text-slate-600 h-9 px-4 border-slate-200 shadow-xs hover:bg-white"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                            >
                                Previous
                            </Button>
                            <div className="flex items-center gap-1.5 mx-2">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum = page;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (page <= 3) pageNum = i + 1;
                                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = page - 2 + i;

                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={page === pageNum ? "default" : "outline"}
                                            size="sm"
                                            className={`w-9 h-9 p-0 font-bold transition-all duration-200 ${page === pageNum ? 'shadow-md scale-105 bg-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-white'}`}
                                            onClick={() => setPage(pageNum)}
                                            disabled={loading}
                                        >
                                            {pageNum}
                                        </Button>
                                    )
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="font-bold text-slate-600 h-9 px-4 border-slate-200 shadow-xs hover:bg-white"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
