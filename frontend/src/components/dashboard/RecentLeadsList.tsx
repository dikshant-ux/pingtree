'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { FileText, ArrowUpRight } from 'lucide-react';

interface RecentLead {
    _id: string;
    readable_id?: string;
    status: string;
    sold_price: number;
    created_at: string;
    buyer_name?: string;
}

export default function RecentLeadsList() {
    const [leads, setLeads] = useState<RecentLead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const res = await api.get('/reports/recent?limit=5');
                setLeads(res.data.items);
            } catch (err) {
                console.error("Failed to fetch recent leads", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeads();
    }, []);

    if (loading) return (
        <div className="flex flex-col gap-4 py-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 animate-pulse">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                        <div className="space-y-2">
                            <div className="w-24 h-4 bg-slate-200 rounded"></div>
                            <div className="w-16 h-3 bg-slate-200 rounded"></div>
                        </div>
                    </div>
                    <div className="w-16 h-6 bg-slate-200 rounded"></div>
                </div>
            ))}
        </div>
    );

    if (leads.length === 0) return (
        <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium text-muted-foreground">No recent activity found.</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-2">
            {leads.map((lead) => (
                <div key={lead._id} className="group flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all duration-200 shadow-sm hover:shadow-md cursor-default">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-indigo-600 transition-colors uppercase">
                                    {lead.readable_id || lead._id.substring(0, 8)}
                                </span>
                                <Badge variant={lead.status === 'sold' ? 'default' : lead.status === 'rejected' ? 'destructive' : 'secondary'} className={`text-[9px] h-[18px] px-1.5 uppercase shadow-sm tracking-widest ${lead.status === 'sold' && 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
                                    {lead.status}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        {lead.status === 'sold' ? (
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-0.5 tracking-tight">
                                +${lead.sold_price.toFixed(2)}
                                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground mr-2">--</p>
                        )}
                        {lead.buyer_name && <p className="text-xs text-muted-foreground truncate max-w-[100px] mt-0.5">{lead.buyer_name}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
}
