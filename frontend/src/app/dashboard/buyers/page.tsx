'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Buyer } from '@/types';
import { Trash2, Pencil, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function BuyersPage() {
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBuyers();
    }, []);

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

    if (loading) return <div className="text-foreground">Loading buyers...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Buyers</h2>
                    <p className="text-muted-foreground mt-1">Manage integration partners and ping targets</p>
                </div>
                <Link
                    href="/dashboard/buyers/create"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center shadow-sm"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Buyer
                </Link>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow">
                <table className="w-full text-left">
                    <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-medium">Name</th>
                            <th className="px-6 py-4 font-medium">Type</th>
                            <th className="px-6 py-4 font-medium">Payout</th>
                            <th className="px-6 py-4 font-medium">Priority</th>
                            <th className="px-6 py-4 font-medium">Caps (Daily)</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {buyers.map((buyer) => (
                            <tr key={buyer._id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4 text-foreground font-medium">{buyer.name}</td>
                                <td className="px-6 py-4 text-muted-foreground">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                        {buyer.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-green-500 font-mono">${buyer.payout}</td>
                                <td className="px-6 py-4 text-muted-foreground">{buyer.priority}</td>
                                <td className="px-6 py-4 text-muted-foreground">{buyer.caps.daily_cap > 0 ? buyer.caps.daily_cap : 'Uncapped'}</td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => toggleStatus(buyer._id, buyer.status)}
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${buyer.status === 'active'
                                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                            : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                            }`}
                                    >
                                        {buyer.status}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => cloneBuyer(buyer._id)}
                                            className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            title="Clone Buyer"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <Link
                                            href={`/dashboard/buyers/${buyer._id}`}
                                            className="p-2 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                            title="Edit Buyer"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => deleteBuyer(buyer._id)}
                                            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            title="Delete Buyer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {buyers.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                    No buyers found. Click "Add Buyer" to create one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
