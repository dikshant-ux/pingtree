'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface RecentLead {
    _id: string;
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

    if (loading) return <div className="text-muted-foreground text-sm">Loading recent leads...</div>;

    if (leads.length === 0) return <div className="text-muted-foreground text-sm">No recent activity.</div>;

    return (
        <div className="space-y-4">
            {leads.map((lead) => (
                <div key={lead._id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">Lead {lead._id.slice(-6)}</span>
                            <Badge variant={lead.status === 'sold' ? 'default' : lead.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px] h-5 px-1.5 uppercase">
                                {lead.status}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                        </p>
                    </div>
                    <div className="text-right">
                        {lead.status === 'sold' ? (
                            <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                +${lead.sold_price.toFixed(2)}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">--</p>
                        )}
                        {lead.buyer_name && <p className="text-xs text-muted-foreground truncate max-w-[100px]">{lead.buyer_name}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
}
