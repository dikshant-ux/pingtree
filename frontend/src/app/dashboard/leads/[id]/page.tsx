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
                                <CardTitle>Validator Logs</CardTitle>
                                <CardDescription>Individual request and response payloads.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {lead.validation_results.map((res: any, idx: number) => (
                                    <div key={idx} className="border rounded-md p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-sm">{res.validator_name}</span>
                                            <Badge variant={res.success ? 'default' : 'destructive'}>{res.success ? 'Success' : 'Failed'}</Badge>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <div>
                                                <span className="text-xs text-muted-foreground font-semibold mb-1 block">REQUEST</span>
                                                <pre className="bg-slate-900 text-slate-100 p-3 rounded-md text-[10px] font-mono overflow-auto max-h-[200px] whitespace-pre-wrap break-all">
                                                    {res.request_payload ? JSON.stringify(res.request_payload, null, 2) : 'No payload sent'}
                                                </pre>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground font-semibold mb-1 block">RESPONSE</span>
                                                <pre className="bg-slate-900 text-slate-100 p-3 rounded-md text-[10px] font-mono overflow-auto max-h-[200px] whitespace-pre-wrap break-all">
                                                    {res.response_body ? JSON.stringify(res.response_body, null, 2) : 'No response'}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {lead.trace && lead.trace.filter((t: any) => (t.stage === 'Ping' || t.stage === 'Post') && (t.request_payload || t.raw_response)).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Buyer Logs</CardTitle>
                                <CardDescription>Ping and Post request/response payloads.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {lead.trace
                                    .filter((t: any) => (t.stage === 'Ping' || t.stage === 'Post') && (t.request_payload || t.raw_response))
                                    .map((t: any, idx: number) => (
                                        <div key={idx} className="border rounded-md p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">{t.stage}</Badge>
                                                    <span className="font-semibold text-sm">{t.buyer_name || t.buyer_id}</span>
                                                </div>
                                                <Badge variant={t.status.includes('Accept') || t.status.includes('Success') ? 'default' : 'destructive'}>{t.status}</Badge>
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <div>
                                                    <span className="text-xs text-muted-foreground font-semibold mb-1 block">REQUEST PAYLOAD</span>
                                                    <pre className="bg-slate-900 text-slate-100 p-3 rounded-md text-[10px] font-mono overflow-auto max-h-[300px] whitespace-pre-wrap break-all">
                                                        {t.request_payload && Object.keys(t.request_payload).length > 0 ? JSON.stringify(t.request_payload, null, 2) : 'No payload recorded'}
                                                    </pre>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-muted-foreground font-semibold mb-1 block">RAW RESPONSE</span>
                                                    <pre className="bg-slate-900 text-slate-100 p-3 rounded-md text-[10px] font-mono overflow-auto max-h-[300px] whitespace-pre-wrap break-all">
                                                        {t.raw_response ? JSON.stringify(t.raw_response, null, 2) : 'No response recorded'}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
