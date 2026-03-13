'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Webhook as WebhookIcon, Plus, Trash2, Save } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SearchMultiSelect } from "@/components/ui/search-multiselect";
import api from '@/lib/api';

interface WebhookConfig {
    id?: string;
    _id?: string;
    name: string;
    url: string;
    is_active: boolean;
    content_type?: 'application/json' | 'application/x-www-form-urlencoded';
    status_filters: string[];
    source_filters: string[];
    source_domain_filters: string[];
    headers: Record<string, string>;
}

const STATUS_OPTIONS = ['sold', 'unsold', 'rejected', 'Invalid Lead'];

export default function WebhooksPage() {
    const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
    const [selected, setSelected] = useState<WebhookConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sourceOptions, setSourceOptions] = useState<string[]>([]);
    const [domainOptions, setDomainOptions] = useState<string[]>([]);

    const id = (w: WebhookConfig | null) => w?.id ?? w?._id ?? '';

    useEffect(() => {
        fetchWebhooks();
    }, []);

    useEffect(() => {
        api.get('/reports/sources').then((res) => {
            if (res.data?.sources) setSourceOptions(res.data.sources);
            if (res.data?.domains) setDomainOptions(res.data.domains);
        }).catch(() => {});
    }, []);

    const fetchWebhooks = async () => {
        try {
            const res = await api.get('/webhooks/');
            setWebhooks(res.data);
            if (res.data.length > 0 && !selected) setSelected(res.data[0]);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load webhooks");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const res = await api.post('/webhooks/', {
                name: 'New Webhook',
                url: 'https://your-platform.com/webhook',
                is_active: true,
                content_type: 'application/json',
                status_filters: ['sold'],
                source_filters: [],
                source_domain_filters: [],
                headers: {},
            });
            setWebhooks([...webhooks, res.data]);
            setSelected(res.data);
            toast.success("Webhook created");
        } catch (err) {
            toast.error("Failed to create webhook");
        }
    };

    const handleSave = async () => {
        if (!selected || !id(selected)) return;
        try {
            const res = await api.put(`/webhooks/${id(selected)}`, {
                name: selected.name,
                url: selected.url,
                is_active: selected.is_active,
                content_type: selected.content_type,
                status_filters: selected.status_filters,
                source_filters: selected.source_filters,
                source_domain_filters: selected.source_domain_filters,
                headers: selected.headers,
            });
            setWebhooks(webhooks.map(w => id(w) === id(selected) ? res.data : w));
            setSelected(res.data);
            toast.success("Webhook saved");
        } catch (err) {
            toast.error("Failed to save webhook");
        }
    };

    const handleDelete = async (webhookId: string) => {
        if (!webhookId || !confirm("Delete this webhook?")) return;
        try {
            await api.delete(`/webhooks/${webhookId}`);
            const remaining = webhooks.filter(w => id(w) !== webhookId);
            setWebhooks(remaining);
            if (selected && id(selected) === webhookId) {
                setSelected(remaining.length > 0 ? remaining[0] : null);
            }
            toast.success("Webhook deleted");
        } catch (err) {
            toast.error("Failed to delete webhook");
        }
    };

    const updateFilters = (field: 'status_filters' | 'source_filters' | 'source_domain_filters', value: string[]) => {
        if (!selected) return;
        setSelected({ ...selected, [field]: value });
    };

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6 max-w-6xl">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
                    <p className="text-muted-foreground mt-1">
                        Send live leads to external platforms. Filter by status, source, and source domain.
                    </p>
                </div>
                <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" /> Add Webhook
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-3 h-fit">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Webhooks</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0 space-y-1">
                        {webhooks.length === 0 ? (
                            <p className="text-xs text-center py-4 text-muted-foreground">No webhooks configured.</p>
                        ) : (
                            webhooks.map((w) => (
                                <div
                                    key={id(w)}
                                    onClick={() => setSelected(w)}
                                    className={`p-3 rounded-md cursor-pointer transition-all flex items-center justify-between ${id(selected) === id(w) ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-accent'}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{w.name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{w.is_active ? 'Active' : 'Disabled'}</p>
                                    </div>
                                    <WebhookIcon className={`h-4 w-4 shrink-0 ${w.is_active ? 'text-primary' : 'text-muted-foreground opacity-20'}`} />
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <div className="lg:col-span-9 space-y-6">
                    {selected ? (
                        <Card className="border-primary/20">
                            <CardHeader className="bg-primary/5 pb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Webhook Settings</CardTitle>
                                        <CardDescription>Configure endpoint and filters. Only leads matching filters will be sent.</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 mr-4">
                                            <Label className="text-xs font-semibold">ENABLED</Label>
                                            <Switch
                                                checked={selected.is_active}
                                                onCheckedChange={(v) => setSelected({ ...selected, is_active: v })}
                                            />
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => handleDelete(id(selected)!)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                        <Button size="sm" onClick={handleSave}>
                                            <Save className="h-4 w-4 mr-2" /> Save
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input
                                            value={selected.name}
                                            onChange={(e) => setSelected({ ...selected, name: e.target.value })}
                                            placeholder="My Webhook"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Webhook URL</Label>
                                    <Input
                                        value={selected.url}
                                        onChange={(e) => setSelected({ ...selected, url: e.target.value })}
                                        placeholder="https://your-platform.com/webhook"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Content Type</Label>
                                    <Select
                                        value={selected.content_type || 'application/json'}
                                        onValueChange={(v: 'application/json' | 'application/x-www-form-urlencoded') =>
                                            setSelected({ ...selected, content_type: v })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="application/json">application/json</SelectItem>
                                            <SelectItem value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        JSON sends a structured body. Form-urlencoded sends flat key=value pairs.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Status filters. Empty = all.</Label>
                                    <SearchMultiSelect
                                        options={STATUS_OPTIONS}
                                        value={selected.status_filters || []}
                                        onChange={(v) => updateFilters('status_filters', v)}
                                        placeholder="Select statuses (e.g. sold, rejected)"
                                        emptyMessage="No statuses"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Source filters. Only send leads from these sources. Empty = all.</Label>
                                    <SearchMultiSelect
                                        options={sourceOptions}
                                        value={selected.source_filters || []}
                                        onChange={(v) => updateFilters('source_filters', v)}
                                        placeholder="Search and select sources"
                                        emptyMessage="No sources. Type to add custom."
                                        creatable
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Source domain filters. Only send leads from these domains. Empty = all.</Label>
                                    <SearchMultiSelect
                                        options={domainOptions}
                                        value={selected.source_domain_filters || []}
                                        onChange={(v) => updateFilters('source_domain_filters', v)}
                                        placeholder="Search and select domains"
                                        emptyMessage="No domains. Type to add custom."
                                        creatable
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex items-center justify-center p-12 border-2 border-dashed rounded-xl border-muted text-muted-foreground">
                            <p>Add or select a webhook to configure.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
