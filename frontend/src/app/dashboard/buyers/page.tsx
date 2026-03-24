'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Buyer } from '@/types';
import { Trash2, Pencil, Copy, Search, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function BuyersPage() {
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination and Search states
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);

    useEffect(() => {
        fetchBuyers();
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on new search
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchBuyers = async () => {
        try {
            const res = await api.get('/buyers/');
            setBuyers(res.data);
        } catch (err) {
            console.error('Failed to fetch buyers', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'paused' : 'active';
        try {
            await api.put(`/buyers/${id}`, { status: newStatus });
            toast.success(`Buyer status updated to ${newStatus}`);
            fetchBuyers(); // Refresh
        } catch (err) {
            toast.error('Failed to update status');
            console.error('Failed to update status', err);
        }
    };

    const deleteBuyer = async (id: string) => {
        if (!confirm('Are you sure you want to delete this buyer?')) return;
        try {
            await api.delete(`/buyers/${id}`);
            toast.success('Buyer deleted successfully');
            fetchBuyers();
        } catch (err) {
            toast.error('Failed to delete buyer');
            console.error('Failed to delete buyer', err);
        }
    };

    const cloneBuyer = async (id: string) => {
        const loadingToast = toast.loading('Cloning buyer...');
        try {
            await api.post(`/buyers/${id}/clone`);
            toast.success('Buyer cloned successfully', { id: loadingToast });
            fetchBuyers(); // Refresh list to show copy
        } catch (err) {
            toast.error('Failed to clone buyer', { id: loadingToast });
            console.error('Failed to clone buyer', err);
        }
    };

    // Derived state for filtering and pagination
    const filteredBuyers = useMemo(() => {
        if (!debouncedSearch) return buyers;
        const lower = debouncedSearch.toLowerCase();
        return buyers.filter(b => 
            b.name.toLowerCase().includes(lower) || 
            b.type.toLowerCase().includes(lower) ||
            b.status.toLowerCase().includes(lower)
        );
    }, [buyers, debouncedSearch]);

    const totalPages = Math.ceil(filteredBuyers.length / pageSize) || 1;
    const paginatedBuyers = filteredBuyers.slice((page - 1) * pageSize, page * pageSize);

    if (loading && buyers.length === 0) return <div className="p-8 text-center text-muted-foreground">Loading buyers...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Buyers</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Manage integration partners and ping targets</p>
                </div>
                <Link href="/dashboard/buyers/create">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Buyer
                    </Button>
                </Link>
            </div>

            <Card className="shadow-sm overflow-hidden border-slate-200">
                <CardHeader className="pb-4 bg-slate-50/50 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl">Buyer Directory</CardTitle>
                        <CardDescription>
                            Total {buyers.length} buyers configured.
                        </CardDescription>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-2.5 top-[11px] h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, type, status..."
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
                                    <TableHead className="font-semibold text-slate-700">Name</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Type</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Payout</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Priority</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Caps (Daily)</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedBuyers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                                            {search ? 'No buyers match your search.' : 'No buyers found. Click "Add Buyer" to create one.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedBuyers.map((buyer) => (
                                        <TableRow key={buyer._id} className="hover:bg-slate-50/80 transition-colors">
                                            <TableCell className="font-bold text-slate-800">{buyer.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="capitalize text-[10px] font-semibold tracking-wide shadow-sm">
                                                    {buyer.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-emerald-600 font-bold">${buyer.payout}</TableCell>
                                            <TableCell className="text-slate-600 font-medium">{buyer.priority}</TableCell>
                                            <TableCell className="text-slate-600">
                                                {buyer.caps?.daily_cap > 0 ? buyer.caps.daily_cap : <span className="text-muted-foreground italic">Uncapped</span>}
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    onClick={() => toggleStatus(buyer._id, buyer.status)}
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase transition-colors shadow-sm ${
                                                        buyer.status === 'active'
                                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'
                                                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
                                                    }`}
                                                >
                                                    {buyer.status}
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => cloneBuyer(buyer._id)}
                                                        className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                        title="Clone Buyer"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </Button>
                                                    <Link href={`/dashboard/buyers/${buyer._id}`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                            title="Edit Buyer"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteBuyer(buyer._id)}
                                                        className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                        title="Delete Buyer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/30 border-t">
                            <div className="text-xs font-medium text-slate-500">
                                Showing <span className="font-bold text-slate-700">{Math.min(filteredBuyers.length, (page - 1) * pageSize + 1)}</span> to <span className="font-bold text-slate-700">{Math.min(filteredBuyers.length, page * pageSize)}</span> of <span className="font-bold text-slate-700">{filteredBuyers.length}</span> results
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs font-semibold"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <div className="text-xs font-medium text-slate-600 px-2 lg:hidden">
                                     Page {page} of {totalPages}
                                </div>
                                <div className="hidden lg:flex items-center gap-1 mx-2">
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
                                                className={`w-8 h-8 p-0 text-xs font-bold transition-all ${
                                                    page === pageNum 
                                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm' 
                                                    : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                                onClick={() => setPage(pageNum)}
                                            >
                                                {pageNum}
                                            </Button>
                                        )
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs font-semibold"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
