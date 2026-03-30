'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useTimezone } from '@/context/TimezoneContext';
import { formatInTimezone } from '@/lib/timezone';

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
import { CheckCircle2, Search, Check, ChevronsUpDown } from "lucide-react";
import { ValidationStatus } from '@/components/leads/ValidationStatus';
import { Input } from '@/components/ui/input';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    const { timezone } = useTimezone();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLeads, setTotalLeads] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [sources, setSources] = useState<string[]>([]);
    const [selectedSource, setSelectedSource] = useState<string>('all');
    const [domains, setDomains] = useState<string[]>([]);
    const [selectedDomain, setSelectedDomain] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [openStatus, setOpenStatus] = useState(false);
    const [openSource, setOpenSource] = useState(false);
    const [openDomain, setOpenDomain] = useState(false);

    const fetchLeads = async (pageNum: number, limit: number, source: string, domain: string, status: string, searchTerm: string) => {
        setLoading(true);
        try {
            const sourceParam = source !== 'all' ? `&source=${source}` : '';
            const domainParam = domain !== 'all' ? `&source_domain=${domain}` : '';
            const statusParam = status !== 'all' ? `&status=${status}` : '';
            const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
            const res = await api.get(`/reports/recent?page=${pageNum}&limit=${limit}${sourceParam}${domainParam}${statusParam}${searchParam}`);
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
            setSources(res.data.sources || []);
            setDomains(res.data.domains || []);
        } catch (err) {
            console.error("Failed to fetch sources", err);
        }
    };

    useEffect(() => {
        fetchSources();
    }, []);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchLeads(page, pageSize, selectedSource, selectedDomain, selectedStatus, debouncedSearch);
    }, [page, pageSize, selectedSource, selectedDomain, selectedStatus, debouncedSearch]);

    if (loading && page === 1 && leads.length === 0) return <div className="p-8 text-center">Loading leads...</div>;

    const handlePageSizeChange = (value: string) => {
        setPageSize(parseInt(value));
        setPage(1); // Reset to first page when limit changes
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Leads</h2>
                    <p className="text-muted-foreground text-sm">
                        View incoming lead traffic. ({totalLeads} total)
                    </p>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row flex-wrap items-end gap-5">

                    <div className="flex flex-col gap-1.5 w-full md:w-auto">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Status</label>
                        <Popover open={openStatus} onOpenChange={setOpenStatus}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openStatus}
                                    className="w-full md:w-[150px] h-9 justify-between bg-white border-slate-200 text-xs shadow-sm shadow-black/5"
                                >
                                    {selectedStatus === 'all' ? "All Status" : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search status..." className="h-9 text-xs" />
                                    <CommandList>
                                        <CommandEmpty className="text-xs py-2 text-center">No status found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem value="all" onSelect={() => { setSelectedStatus("all"); setOpenStatus(false); setPage(1); }} className="text-xs font-bold text-indigo-600">
                                                <Check className={`mr-2 h-4 w-4 ${selectedStatus === "all" ? "opacity-100" : "opacity-0"}`} />
                                                All Status
                                            </CommandItem>
                                            <CommandItem value="sold" onSelect={() => { setSelectedStatus("sold"); setOpenStatus(false); setPage(1); }} className="text-xs text-emerald-600 font-semibold">
                                                <Check className={`mr-2 h-4 w-4 ${selectedStatus === "sold" ? "opacity-100" : "opacity-0"}`} />
                                                Sold
                                            </CommandItem>
                                            <CommandItem value="unsold" onSelect={() => { setSelectedStatus("unsold"); setOpenStatus(false); setPage(1); }} className="text-xs text-rose-600 font-semibold">
                                                <Check className={`mr-2 h-4 w-4 ${selectedStatus === "unsold" ? "opacity-100" : "opacity-0"}`} />
                                                Unsold
                                            </CommandItem>
                                            <CommandItem value="Invalid Lead" onSelect={() => { setSelectedStatus("Invalid Lead"); setOpenStatus(false); setPage(1); }} className="text-xs text-slate-500">
                                                <Check className={`mr-2 h-4 w-4 ${selectedStatus === "Invalid Lead" ? "opacity-100" : "opacity-0"}`} />
                                                Invalid Lead
                                            </CommandItem>
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex flex-col gap-1.5 w-full md:w-auto">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Source Field</label>
                        <Popover open={openSource} onOpenChange={setOpenSource}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openSource}
                                    className="w-full md:w-[180px] h-9 justify-between bg-white border-slate-200 text-xs shadow-sm shadow-black/5"
                                >
                                    <span className="truncate">{selectedSource === 'all' ? "All Sources" : selectedSource}</span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search source..." className="h-9 text-xs" />
                                    <CommandList>
                                        <CommandEmpty className="text-xs py-2 text-center">No source found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem value="all" onSelect={() => { setSelectedSource("all"); setOpenSource(false); setPage(1); }} className="text-xs font-bold text-indigo-600">
                                                <Check className={`mr-2 h-4 w-4 ${selectedSource === "all" ? "opacity-100" : "opacity-0"}`} />
                                                All Sources
                                            </CommandItem>
                                            {sources.map(s => (
                                                <CommandItem key={s} value={s} onSelect={() => { setSelectedSource(s); setOpenSource(false); setPage(1); }} className="text-xs">
                                                    <Check className={`mr-2 h-4 w-4 ${selectedSource === s ? "opacity-100" : "opacity-0"}`} />
                                                    {s}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex flex-col gap-1.5 w-full md:w-auto">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Source Domain</label>
                        <Popover open={openDomain} onOpenChange={setOpenDomain}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openDomain}
                                    className="w-full md:w-[180px] h-9 justify-between bg-white border-slate-200 text-xs shadow-sm shadow-black/5"
                                >
                                    <span className="truncate">{selectedDomain === 'all' ? "All Domains" : selectedDomain}</span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search domain..." className="h-9 text-xs" />
                                    <CommandList>
                                        <CommandEmpty className="text-xs py-2 text-center">No domain found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem value="all" onSelect={() => { setSelectedDomain("all"); setOpenDomain(false); setPage(1); }} className="text-xs font-bold text-indigo-600">
                                                <Check className={`mr-2 h-4 w-4 ${selectedDomain === "all" ? "opacity-100" : "opacity-0"}`} />
                                                All Domains
                                            </CommandItem>
                                            {domains.map(d => (
                                                <CommandItem key={d} value={d} onSelect={() => { setSelectedDomain(d); setOpenDomain(false); setPage(1); }} className="text-xs">
                                                    <Check className={`mr-2 h-4 w-4 ${selectedDomain === d ? "opacity-100" : "opacity-0"}`} />
                                                    {d}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex flex-col gap-1.5 w-full md:w-[100px] md:ml-auto">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Per Page</label>
                        <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                            <SelectTrigger className="w-full md:w-[100px] h-9 bg-white border-slate-200 text-xs shadow-sm shadow-black/5">
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
                <CardHeader className="pb-3 bg-slate-50/50 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl">Recent Leads</CardTitle>
                        <CardDescription>
                            A list of leads processed by the system.
                        </CardDescription>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-2.5 top-[11px] h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="ID, Email, Phone, Name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9 text-xs border-slate-200 bg-white shadow-sm focus-visible:ring-indigo-500"
                        />
                    </div>
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
                                    <TableHead className="font-semibold text-slate-700">Source Domain</TableHead>
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
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="cursor-help border-b border-dotted border-slate-300">
                                                                {(lead.latency_ms / 1000).toFixed(2)}s
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{lead.latency_ms}ms</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                            <TableCell>
                                                <ValidationStatus results={lead.validation_results || []} />
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
                                                {formatInTimezone(lead.created_at, timezone, 'datetime')}
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
                    <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-slate-50/30 border-t gap-4">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 text-center md:text-left">
                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                            Page {page} <span className="text-slate-300 mx-1">/</span> {totalPages} <span className="ml-2 text-slate-400 font-medium hidden sm:inline">({totalLeads} Records)</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2">
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
