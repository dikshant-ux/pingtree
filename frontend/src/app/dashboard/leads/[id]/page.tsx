'use client';

import { useEffect, useState, use } from 'react';
import api from '@/lib/api';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TraceTimeline } from '@/components/leads/TraceTimeline';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import { usePathname } from 'next/navigation';
import { ValidationStatus } from '@/components/leads/ValidationStatus';

export default function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const pathname = usePathname();
    const { setCustomLabel } = useBreadcrumbs();
    const [lead, setLead] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLead = async () => {
            try {
                const res = await api.get(`/leads/${id}`);
                setLead(res.data);
                if (res.data.readable_id) {
                    setCustomLabel(pathname, res.data.readable_id);
                }
            } catch (err) {
                console.error("Failed to fetch lead", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLead();
    }, [id, pathname, setCustomLabel]);

    if (loading) return <div>Loading lead details...</div>;
    if (!lead) return <div>Lead not found.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/leads">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        Lead Details
                        <Badge variant="outline" className="font-bold text-base bg-indigo-50 text-indigo-700 border-indigo-200">
                            {lead.readable_id || `#${lead._id.substring(0, 8)}`}
                        </Badge>
                    </h2>
                    <p className="text-muted-foreground">
                        Processed on {new Date(lead.created_at).toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Data Payload */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lead Data</CardTitle>
                            <CardDescription>Raw data payload received.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs font-mono overflow-auto max-h-[500px]">
                                {JSON.stringify(lead.lead_data, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Outcome</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm font-medium">Status</span>
                                <Badge variant={
                                    lead.status === 'sold' ? 'default' :
                                        lead.status === 'rejected' ? 'destructive' : 'secondary'
                                }>
                                    {lead.status.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm font-medium">Sold Price</span>
                                <span className="font-mono font-bold text-green-600">${lead.sold_price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm font-medium">Latency</span>
                                <span className="text-muted-foreground">{lead.latency_ms}ms</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm font-medium">Buyer</span>
                                <span className="text-sm font-semibold text-indigo-600">
                                    {lead.buyer_name || lead.buyer_id || '-'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {lead.validation_results && lead.validation_results.length > 0 && (
                        <Card className="border-indigo-100 shadow-sm overflow-hidden">
                            <CardHeader className="bg-indigo-50/30 pb-3 border-b border-indigo-100">
                                <CardTitle className="text-lg">Validation Summary</CardTitle>
                                <CardDescription>Smart quality analysis results.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-5 flex flex-col gap-4">
                                <ValidationStatus results={lead.validation_results} />
                                <div className="text-[10px] text-muted-foreground bg-slate-50 p-2 rounded border border-slate-100 italic">
                                    Hover over badges to see detailed feedback and provider information.
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {lead.validation_results && lead.validation_results.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Raw Validation Results</CardTitle>
                                <CardDescription>Full response from external validators.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-[10px] font-mono overflow-auto max-h-[400px]">
                                    {JSON.stringify(lead.validation_results, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Timeline */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Processing Timeline</CardTitle>
                            <CardDescription>Step-by-step execution trace of the ping tree logic.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <TraceTimeline trace={lead.trace} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
