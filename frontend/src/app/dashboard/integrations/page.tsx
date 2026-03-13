'use client';

import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Trash2, 
    Edit2, 
    Play, 
    Share2, 
    CheckCircle2, 
    XCircle,
    Copy,
    ExternalLink,
    Info,
    Settings2,
    Activity,
    Shield,
    RefreshCw,
    RotateCcw,
    Pause
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import api from '@/lib/api';

const EVENT_TYPES = [
    { id: 'lead_sold', label: 'Lead Sold', color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'lead_unsold', label: 'Lead Unsold', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { id: 'lead_rejected', label: 'Lead Rejected', color: 'bg-red-100 text-red-700 border-red-200' },
];

export default function IntegrationsPage() {
    const [webhooks, setWebhooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentWebhook, setCurrentWebhook] = useState<any>(null);
    
    // Sync Task state
    const [syncTask, setSyncTask] = useState<any>(null);
    const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        event_types: [] as string[],
        secret_key: '',
        is_active: true
    });

    useEffect(() => {
        fetchWebhooks();
        fetchSyncStatus();
        
        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, []);

    // Polling for sync status
    useEffect(() => {
        if (syncTask?.status === 'running') {
            const interval = setInterval(fetchSyncStatus, 2000);
            return () => clearInterval(interval);
        }
    }, [syncTask?.status]);

    const fetchSyncStatus = async () => {
        try {
            const res = await api.get('/webhooks/sync/status');
            setSyncTask(res.data);
        } catch (err) {
            console.error("Failed to fetch sync status", err);
        }
    };

    const handleSyncStart = async () => {
        try {
            await api.post('/webhooks/sync/start');
            toast.success("Sync started");
            fetchSyncStatus();
        } catch (err) {
            toast.error("Failed to start sync");
        }
    };

    const handleSyncPause = async () => {
        try {
            await api.post('/webhooks/sync/pause');
            toast.info("Sync paused");
            fetchSyncStatus();
        } catch (err) {
            toast.error("Failed to pause sync");
        }
    };

    const handleSyncReset = async () => {
        if (!confirm("Reset sync progress? This will allow you to start from the beginning.")) return;
        try {
            await api.post('/webhooks/sync/reset');
            toast.success("Sync reset to 0");
            fetchSyncStatus();
        } catch (err) {
            toast.error("Failed to reset sync");
        }
    };

    const fetchWebhooks = async () => {
        try {
            setLoading(true);
            const res = await api.get('/webhooks');
            setWebhooks(res.data);
        } catch (err) {
            toast.error("Failed to fetch webhooks");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.url || formData.event_types.length === 0) {
            toast.error("Please fill in all required fields");
            return;
        }
        try {
            await api.post('/webhooks', formData);
            toast.success("Webhook created successfully");
            setIsCreateOpen(false);
            resetForm();
            fetchWebhooks();
        } catch (err) {
            toast.error("Failed to create webhook");
        }
    };

    const handleUpdate = async () => {
        try {
            await api.put(`/webhooks/${currentWebhook._id}`, formData);
            toast.success("Webhook updated successfully");
            setIsEditOpen(false);
            resetForm();
            fetchWebhooks();
        } catch (err) {
            toast.error("Failed to update webhook");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this integration?")) return;
        try {
            await api.delete(`/webhooks/${id}`);
            toast.success("Webhook deleted");
            fetchWebhooks();
        } catch (err) {
            toast.error("Failed to delete webhook");
        }
    };

    const handleTest = async (id: string) => {
        try {
            toast.info("Sending test payload...");
            await api.post(`/webhooks/${id}/test`);
            toast.success("Test signal sent successfully");
        } catch (err: any) {
            toast.error(`Test failed: ${err.response?.data?.detail || err.message}`);
        }
    };

    const toggleEvent = (eventId: string) => {
        setFormData(prev => ({
            ...prev,
            event_types: prev.event_types.includes(eventId)
                ? prev.event_types.filter(id => id !== eventId)
                : [...prev.event_types, eventId]
        }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            url: '',
            event_types: [],
            secret_key: '',
            is_active: true
        });
        setCurrentWebhook(null);
    };

    const openEdit = (webhook: any) => {
        setCurrentWebhook(webhook);
        setFormData({
            name: webhook.name,
            url: webhook.url,
            event_types: webhook.event_types,
            secret_key: webhook.secret_key || '',
            is_active: webhook.is_active
        });
        setIsEditOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
                    <p className="text-muted-foreground">Manage external webhooks to sync lead data with other platforms.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm transition-all active:scale-95">
                            <Plus className="w-4 h-4" />
                            Add Integration
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New Integration</DialogTitle>
                            <DialogDescription>
                                Configure an external endpoint to receive lead data events.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Integration Name</Label>
                                <Input 
                                    id="name" 
                                    placeholder="e.g. Zapier / CRM Sync" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="url">Endpoint URL</Label>
                                <Input 
                                    id="url" 
                                    placeholder="https://your-api.com/webhook" 
                                    value={formData.url}
                                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="secret">Secret Key (Optional HMAC Signature)</Label>
                                <Input 
                                    id="secret" 
                                    type="password"
                                    placeholder="Keep it secret, keep it safe" 
                                    value={formData.secret_key}
                                    onChange={(e) => setFormData({...formData, secret_key: e.target.value})}
                                />
                            </div>
                            <div className="grid gap-2 pt-2">
                                <Label className="mb-2">Event Triggers</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {EVENT_TYPES.map(event => (
                                        <div 
                                            key={event.id}
                                            onClick={() => toggleEvent(event.id)}
                                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                                                formData.event_types.includes(event.id) 
                                                ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' 
                                                : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className={event.color}>{event.label}</Badge>
                                                <span className="text-sm text-muted-foreground italic">
                                                    {event.id === 'lead_sold' && 'Sent when a buyer accepts the lead.'}
                                                    {event.id === 'lead_unsold' && 'Sent when no buyers were found.'}
                                                    {event.id === 'lead_rejected' && 'Sent when the lead fails validation.'}
                                                </span>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                formData.event_types.includes(event.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'
                                            }`}>
                                                {formData.event_types.includes(event.id) && <Plus className="w-3 h-3 text-white rotate-45" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} className="bg-indigo-600 text-white">Enable Integration</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Bulk Migration Center */}
            <Card className="border-indigo-100 shadow-md bg-white overflow-hidden border-l-4 border-l-indigo-500">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <RefreshCw className={`w-5 h-5 text-indigo-600 ${syncTask?.status === 'running' ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Bulk Migration Center</CardTitle>
                            <CardDescription>Sync all historical leads from your database to active webhooks.</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {syncTask?.status === 'running' ? (
                            <Button variant="outline" size="sm" onClick={handleSyncPause} className="text-amber-600 border-amber-200 hover:bg-amber-50">
                                <Pause className="w-4 h-4 mr-2" /> Pause
                            </Button>
                        ) : (
                            <Button variant="default" size="sm" onClick={handleSyncStart} className="bg-indigo-600 hover:bg-indigo-700">
                                <Play className="w-4 h-4 mr-2" /> {syncTask?.processed_leads > 0 ? 'Resume' : 'Start Sync'}
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={handleSyncReset} className="text-slate-400 hover:text-red-600">
                            <RotateCcw className="w-4 h-4 mr-2" /> Reset
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Processed</span>
                                    <span className="text-xl font-bold text-slate-800 tracking-tight">{(syncTask?.processed_leads || 0).toLocaleString()}</span>
                                </div>
                                <div className="h-8 w-px bg-slate-100" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Source</span>
                                    <span className="text-xl font-bold text-slate-800 tracking-tight">{(syncTask?.total_leads || 0).toLocaleString()}</span>
                                </div>
                            </div>
                            <Badge variant={syncTask?.status === 'running' ? 'default' : 'outline'} className={syncTask?.status === 'running' ? 'bg-indigo-500 animate-pulse' : ''}>
                                {syncTask?.status || 'IDLE'}
                            </Badge>
                        </div>
                        
                        <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                                style={{ 
                                    width: `${Math.min(100, ((syncTask?.processed_leads || 0) / (syncTask?.total_leads || 1)) * 100)}%` 
                                }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>0% Started</span>
                            <span>{Math.round(((syncTask?.processed_leads || 0) / (syncTask?.total_leads || 1)) * 100)}% Progress</span>
                            <span>100% Complete</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-200/60 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        <div>
                            <CardTitle className="text-lg">Active Webhooks</CardTitle>
                            <CardDescription>Your configured data transfer endpoints.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground animate-pulse">Loading integrations...</div>
                    ) : webhooks.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
                                <Share2 className="h-6 w-6 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium">No integrations yet</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                Connect PingTree to your CRM, Zapier, or custom systems to automate lead data flow.
                            </p>
                            <Button variant="outline" className="mt-6" onClick={() => setIsCreateOpen(true)}>
                                Set up your first webhook
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/30">
                                <TableRow>
                                    <TableHead className="w-[200px]">Name</TableHead>
                                    <TableHead>Target URL</TableHead>
                                    <TableHead>Event Subscriptions</TableHead>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {webhooks.map((webhook) => (
                                    <TableRow key={webhook._id} className="group hover:bg-slate-50/80 transition-colors">
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{webhook.name}</span>
                                                {webhook.secret_key && (
                                                    <span className="text-[10px] text-indigo-500 flex items-center gap-1 mt-1">
                                                        <Shield className="w-3 h-3" /> Signed (HMAC)
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate">
                                            <code className="text-xs text-slate-500 font-mono bg-slate-100/50 px-1.5 py-0.5 rounded">
                                                {webhook.url}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1.5">
                                                {webhook.event_types.map((et: string) => (
                                                    <Badge 
                                                        key={et} 
                                                        variant="secondary" 
                                                        className={cn("px-2 py-0 text-[10px] uppercase font-bold", EVENT_TYPES.find(e => e.id === et)?.color)}
                                                    >
                                                        {et.replace('lead_', '')}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={webhook.is_active ? "default" : "outline"} className={webhook.is_active ? "bg-emerald-500 text-white" : ""}>
                                                {webhook.is_active ? 'ACTIVE' : 'PAUSED'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600 transition-colors" onClick={() => handleTest(webhook._id)}>
                                                <Play className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900 transition-colors" onClick={() => openEdit(webhook)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 transition-colors" onClick={() => handleDelete(webhook._id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <Card className="bg-indigo-600 border-none text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-12 duration-500">
                        <Share2 className="w-24 h-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Settings2 className="w-5 h-5" />
                            How it works
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-indigo-50 text-sm space-y-4">
                        <p>
                            External data sync runs as a <strong>Background Task</strong>. This means it never slows down your lead processing latency.
                        </p>
                        <ul className="space-y-2 list-disc list-inside opacity-90">
                            <li>Data is sent via HTTPS POST as JSON</li>
                            <li>Includes full lead data + auction outcome</li>
                            <li>Retry logic automatically handles blips</li>
                            <li>HMAC verification ensures security</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="border-dashed border-slate-200 bg-slate-50/30">
                    <CardHeader>
                        <CardTitle className="text-slate-700 flex items-center gap-2">
                            <Info className="w-5 h-5 text-indigo-400" />
                            Integration Examples
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                            <div>
                                <p className="font-medium text-sm">Post-Sold CRM Update</p>
                                <p className="text-xs text-muted-foreground">Sync high-quality leads into your CRM immediately after they are sold to a buyer.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                            <div>
                                <p className="font-medium text-sm">Slack / Discord Notification</p>
                                <p className="text-xs text-muted-foreground">Connect a notification channel to monitor your lead flow in real-time.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                            <div>
                                <p className="font-medium text-sm">Marketing Re-Targeting</p>
                                <p className="text-xs text-muted-foreground">Send rejected or unsold leads to an email platform for specialized remarketing campaigns.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Modal (similar to create, but using setCurrentWebhook and handleUpdate) */}
            <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) resetForm(); }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Integration</DialogTitle>
                        <DialogDescription>
                            Modify your external endpoint configuration.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Integration Name</Label>
                            <Input 
                                id="edit-name" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-url">Endpoint URL</Label>
                            <Input 
                                id="edit-url" 
                                value={formData.url}
                                onChange={(e) => setFormData({...formData, url: e.target.value})}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-secret">Secret Key (HMAC Key)</Label>
                            <Input 
                                id="edit-secret" 
                                type="password"
                                placeholder={currentWebhook?.secret_key ? "••••••••••••••••" : "Not set"} 
                                value={formData.secret_key}
                                onChange={(e) => setFormData({...formData, secret_key: e.target.value})}
                            />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <Label htmlFor="edit-active">Active Status</Label>
                            <Switch 
                                id="edit-active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                            />
                        </div>
                        <div className="grid gap-2 pt-2">
                            <Label className="mb-2">Event Triggers</Label>
                            <div className="grid grid-cols-1 gap-2">
                                {EVENT_TYPES.map(event => (
                                    <div 
                                        key={event.id}
                                        onClick={() => toggleEvent(event.id)}
                                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                                            formData.event_types.includes(event.id) 
                                            ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' 
                                            : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className={event.color}>{event.label}</Badge>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                            formData.event_types.includes(event.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'
                                        }`}>
                                            {formData.event_types.includes(event.id) && <Plus className="w-3 h-3 text-white rotate-45" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdate} className="bg-indigo-600 text-white">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
