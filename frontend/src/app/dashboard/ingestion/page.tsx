'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Script from 'next/script';
import {
    Copy, RefreshCw, Code, Terminal, CheckCircle2,
    Plus, Layers, ExternalLink, Trash2, Edit2,
    ChevronRight, Globe, MousePointer2
} from "lucide-react";
import api from '@/lib/api';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface LeadForm {
    _id: string;
    name: string;
    title: string;
    primary_color: string;
    allowed_domains: string[];
    is_active: boolean;
    reject_redirect_url?: string;
    click_id_configs: { key: string; method: string; param_name?: string; script_url?: string; }[];
}

export default function IngestionPage() {
    const [apiKey, setApiKey] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRotating, setIsRotating] = useState(false);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    // Multi-Form State
    const [forms, setForms] = useState<LeadForm[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newForm, setNewForm] = useState({
        name: '',
        title: '',
        primary_color: '#28a745',
        reject_redirect_url: '',
        click_id_configs: [] as { key: string; method: string; param_name?: string; script_url?: string; }[]
    });
    const [editingForm, setEditingForm] = useState<LeadForm | null>(null);
    const [selectedForm, setSelectedForm] = useState<LeadForm | null>(null);
    const [baseUrl, setBaseUrl] = useState<string>('');

    useEffect(() => {
        // Correctly derive base URL from the API endpoint to ensure it points to the backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        if (apiUrl) {
            setBaseUrl(apiUrl.replace('/api/v1', ''));
        } else if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
    }, []);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        setIsLoading(true);
        await Promise.all([fetchApiKey(), fetchForms()]);
        setIsLoading(false);
    };

    const fetchApiKey = async () => {
        try {
            const res = await api.get('/auth/me/api-key');
            setApiKey(res.data.api_key);
        } catch (err) {
            console.error("Failed to fetch API key", err);
            toast.error("Failed to load API key");
        }
    };

    const fetchForms = async () => {
        try {
            const res = await api.get('/forms/');
            setForms(res.data);
            if (res.data.length > 0 && !selectedForm) {
                setSelectedForm(res.data[0]);
            }
        } catch (err) {
            console.error("Failed to fetch forms", err);
        }
    };

    const handleCreateForm = async () => {
        try {
            const res = await api.post('/forms/', newForm);
            setForms([...forms, res.data]);
            setSelectedForm(res.data);
            setIsCreateModalOpen(false);
            setNewForm({
                name: '',
                title: '',
                primary_color: '#28a745',
                reject_redirect_url: '',
                click_id_configs: []
            });
            toast.success("Form Created Successfully");
        } catch (err) {
            toast.error("Failed to create form");
        }
    };

    const handleEditClick = (form: LeadForm, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingForm({ ...form });
        setIsEditModalOpen(true);
    };

    const handleUpdateForm = async () => {
        if (!editingForm) return;
        try {
            const res = await api.patch(`/forms/${editingForm._id}`, editingForm);
            setForms(forms.map(f => f._id === editingForm._id ? res.data : f));
            if (selectedForm?._id === editingForm._id) {
                setSelectedForm(res.data);
            }
            setIsEditModalOpen(false);
            toast.success("Form Updated Successfully");
        } catch (err) {
            toast.error("Failed to update form");
        }
    };

    const handleDeleteForm = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this form?")) return;
        try {
            await api.delete(`/forms/${id}`);
            setForms(forms.filter(f => f._id !== id));
            if (selectedForm?._id === id) setSelectedForm(null);
            toast.success("Form deleted");
        } catch (err) {
            toast.error("Failed to delete form");
        }
    };

    const rotateApiKey = async () => {
        if (!confirm("Are you sure? Old API key will stop working immediately.")) return;

        setIsRotating(true);
        try {
            const res = await api.post('/auth/me/api-key/rotate');
            setApiKey(res.data.api_key);
            toast.success("API Key Rotated Successfully");
        } catch (err) {
            console.error("Failed to rotate API key", err);
            toast.error("Failed to rotate API key");
        } finally {
            setIsRotating(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    // Embed Snippets
    const getEmbedCode = (formId?: string) => `<script src="${baseUrl}/static/pingtree.js"></script>
<script>
    (async () => {
        await PingTree.init("${apiKey || 'YOUR_API_KEY'}", { 
            formId: "${formId || 'optional_form_id'}" 
        });
    })();
</script>`;

    const getRenderCode = (form: LeadForm) => `PingTree.render("pt-lead-form", {
    formId: "${form._id}",
    title: "${form.title}",
    primaryColor: "${form.primary_color}",
    onSuccess: (data) => console.log("Success!", data)
});`;

    useEffect(() => {
        if (selectedForm && isScriptLoaded && (window as any).PingTree && apiKey) {
            const container = document.getElementById('preview-container');
            if (container) container.innerHTML = '';

            (async () => {
                await (window as any).PingTree.init(apiKey, { formId: selectedForm._id });
                setTimeout(() => {
                    (window as any).PingTree.render('preview-container', {
                        formId: selectedForm._id,
                        title: selectedForm.title,
                        primaryColor: selectedForm.primary_color,
                        onSuccess: (res: any) => toast.success("Preview Submission Successful!")
                    });
                }, 100);
            })();
        }
    }, [selectedForm, isScriptLoaded, apiKey]);

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6 max-w-6xl">
            <Script
                src={`${baseUrl}/static/pingtree.js`}
                onLoad={() => setIsScriptLoaded(true)}
            />

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Form Manager</h1>
                    <p className="text-muted-foreground mt-1">
                        Create multiple lead capture forms and track their sources.
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" /> New Form
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Form List */}
                <Card className="lg:col-span-4 h-fit">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 text-primary">
                            <Layers className="h-4 w-4" /> Your Forms
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                        {forms.length === 0 ? (
                            <div className="text-center py-10 px-4">
                                <p className="text-sm text-muted-foreground">No forms created yet.</p>
                                <Button variant="link" size="sm" onClick={() => setIsCreateModalOpen(true)}>Create your first form</Button>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {forms.map((form) => (
                                    <div
                                        key={form._id}
                                        onClick={() => setSelectedForm(form)}
                                        className={`group flex items-center justify-between p-3 rounded-md cursor-pointer transition-all ${selectedForm?._id === form._id ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-accent'}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium truncate">{form.name}</h4>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{form._id.slice(-8)}</p>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleEditClick(form, e)}>
                                                <Edit2 className="h-3 w-3 text-primary" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleDeleteForm(form._id, e)}>
                                                <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right: Selected Form Details & Designer */}
                <div className="lg:col-span-8 space-y-6">
                    {selectedForm ? (
                        <>
                            {/* Implementation Snippet */}
                            <Card className="border-indigo-100 bg-indigo-50/10">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                                                <Code className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base text-indigo-900">Implementation</CardTitle>
                                                <CardDescription>Embed this form on any website or domain.</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => copyToClipboard(getEmbedCode(), "Main script tag")}>
                                                <Copy className="h-3 w-3 mr-2" /> Script
                                            </Button>
                                            <Button className="bg-indigo-600 hover:bg-indigo-700" size="sm" onClick={() => copyToClipboard(getRenderCode(selectedForm), "Render code")}>
                                                <Copy className="h-3 w-3 mr-2" /> Render Code
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative group">
                                        <pre className="p-4 rounded-lg bg-slate-950 text-slate-50 font-mono text-xs overflow-x-auto border border-slate-800">
                                            {getRenderCode(selectedForm)}
                                        </pre>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tracking & Insights (Placeholder for now) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="bg-sky-50/30 border-sky-100">
                                    <CardHeader className="py-4">
                                        <CardTitle className="text-[10px] font-bold uppercase text-sky-700 flex items-center gap-2">
                                            <Globe className="h-3 w-3" /> Auto Source Tracking
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-4">
                                        <p className="text-xs text-sky-800 leading-relaxed">
                                            PingTree automatically captures the <strong>domain</strong> and <strong>full URL</strong> of where this form is submitted.
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-emerald-50/30 border-emerald-100">
                                    <CardHeader className="py-4">
                                        <CardTitle className="text-[10px] font-bold uppercase text-emerald-700 flex items-center gap-2">
                                            <MousePointer2 className="h-3 w-3" /> Multiple Instances
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-4">
                                        <p className="text-xs text-emerald-800 leading-relaxed">
                                            Each form instance reports back its unique <code>form_id</code> so you can A/B test designs.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Designer Preview */}
                            <Card className="border-indigo-200">
                                <CardHeader className="bg-indigo-50/50 border-b">
                                    <CardTitle className="text-base text-indigo-900">Live Designer Preview</CardTitle>
                                    <CardDescription>Instant preview of how "{selectedForm.name}" will look embedded.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="bg-slate-200/50 p-4 md:p-8 min-h-[600px] max-h-[800px] overflow-y-auto">
                                        <div id="preview-container" className="shadow-2xl rounded-xl overflow-hidden bg-white"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center p-12 border-2 border-dashed rounded-xl border-muted text-muted-foreground">
                            <p>Select a form to manage implementation and view tracking info.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* API Key Management at the bottom */}
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Your Master API Key</CardTitle>
                    <CardDescription>Use this key globally for all PingTree integrations.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <div className="relative flex-1">
                        <Input
                            value={apiKey}
                            readOnly
                            className="font-mono pr-10 bg-background"
                            type="password"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => copyToClipboard(apiKey, "API Key")}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={rotateApiKey}
                        disabled={isRotating}
                        title="Regenerate API Key"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRotating ? 'animate-spin' : ''}`} />
                    </Button>
                </CardContent>
            </Card>

            {/* Create Form Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Lead Form</DialogTitle>
                        <DialogDescription>
                            Configure a new form for a specific website or landing page.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Internal Name</label>
                            <Input
                                placeholder="e.g. Finance Site Landing Page"
                                value={newForm.name}
                                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Public Title</label>
                            <Input
                                placeholder="e.g. Get a Loan in Minutes"
                                value={newForm.title}
                                onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Theme Color</label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    className="w-12 h-10 p-1"
                                    value={newForm.primary_color}
                                    onChange={(e) => setNewForm({ ...newForm, primary_color: e.target.value })}
                                />
                                <Input
                                    value={newForm.primary_color}
                                    onChange={(e) => setNewForm({ ...newForm, primary_color: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-destructive">Reject Redirection URL (Optional)</label>
                            <Input
                                placeholder="e.g. https://yoursite.com/thank-you"
                                value={newForm.reject_redirect_url}
                                onChange={(e) => setNewForm({ ...newForm, reject_redirect_url: e.target.value })}
                            />
                            <p className="text-[10px] text-muted-foreground italic">Users will be redirected here if no buyers buy the lead.</p>
                        </div>

                        <div className="space-y-3 border-t pt-4">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <MousePointer2 className="h-4 w-4" /> Click ID Tracking
                            </label>
                            <div className="space-y-2">
                                {newForm.click_id_configs.map((config, index) => (
                                    <div key={index} className="flex gap-2 items-end bg-accent/30 p-2 rounded-md border border-border">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Field Key</label>
                                            <Input
                                                value={config.key}
                                                onChange={(e) => {
                                                    const updated = [...newForm.click_id_configs];
                                                    updated[index].key = e.target.value;
                                                    setNewForm({ ...newForm, click_id_configs: updated });
                                                }}
                                                placeholder="e.g. click_id"
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Method</label>
                                            <select
                                                value={config.method}
                                                className="w-full h-8 text-xs bg-background border border-input rounded-md px-2"
                                                onChange={(e) => {
                                                    const updated = [...newForm.click_id_configs];
                                                    updated[index].method = e.target.value;
                                                    if (e.target.value === 'url') updated[index].param_name = config.key;
                                                    if (e.target.value === 'rtk') updated[index].script_url = 'https://tr.cloudsoutions.com/uniclick.js?attribution=lastpaid&cookiedomain=cashinsecond.com&cookieduration=90&defaultcampaignid=6718e7b9f169cec28f38fbef&regviewonce=false';
                                                    setNewForm({ ...newForm, click_id_configs: updated });
                                                }}
                                            >
                                                <option value="url">URL Parameter</option>
                                                <option value="rtk">RTK Script</option>
                                            </select>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive"
                                            onClick={() => {
                                                const updated = newForm.click_id_configs.filter((_, i) => i !== index);
                                                setNewForm({ ...newForm, click_id_configs: updated });
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-[10px] h-7"
                                        onClick={() => {
                                            setNewForm({
                                                ...newForm,
                                                click_id_configs: [...newForm.click_id_configs, { key: 'click_id', method: 'url', param_name: 'click_id' }]
                                            });
                                        }}
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> Add click_id (URL)
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-[10px] h-7"
                                        onClick={() => {
                                            setNewForm({
                                                ...newForm,
                                                click_id_configs: [...newForm.click_id_configs, {
                                                    key: 'rtkclickid',
                                                    method: 'rtk',
                                                    script_url: 'https://tr.cloudsoutions.com/uniclick.js?attribution=lastpaid&cookiedomain=cashinsecond.com&cookieduration=90&defaultcampaignid=6718e7b9f169cec28f38fbef&regviewonce=false'
                                                }]
                                            });
                                        }}
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> Add rtkclickid (Script)
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateForm} disabled={!newForm.name || !newForm.title}>Create Form</Button>
                    </DialogFooter>
                </DialogContent >
            </Dialog >

            {/* Edit Form Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Lead Form</DialogTitle>
                        <DialogDescription>
                            Update your form configuration and themes.
                        </DialogDescription>
                    </DialogHeader>
                    {editingForm && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Internal Name</label>
                                <Input
                                    placeholder="e.g. Finance Site Landing Page"
                                    value={editingForm.name}
                                    onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Public Title</label>
                                <Input
                                    placeholder="e.g. Get a Loan in Minutes"
                                    value={editingForm.title}
                                    onChange={(e) => setEditingForm({ ...editingForm, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Theme Color</label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        className="w-12 h-10 p-1"
                                        value={editingForm.primary_color}
                                        onChange={(e) => setEditingForm({ ...editingForm, primary_color: e.target.value })}
                                    />
                                    <Input
                                        value={editingForm.primary_color}
                                        onChange={(e) => setEditingForm({ ...editingForm, primary_color: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-destructive">Reject Redirection URL (Optional)</label>
                                <Input
                                    placeholder="e.g. https://yoursite.com/thank-you"
                                    value={editingForm.reject_redirect_url || ''}
                                    onChange={(e) => setEditingForm({ ...editingForm, reject_redirect_url: e.target.value })}
                                />
                                <p className="text-[10px] text-muted-foreground italic">Users will be redirected here if no buyers buy the lead.</p>
                            </div>

                            <div className="space-y-3 border-t pt-4">
                                <label className="text-sm font-semibold flex items-center gap-2">
                                    <MousePointer2 className="h-4 w-4" /> Click ID Tracking
                                </label>
                                <div className="space-y-2">
                                    {editingForm.click_id_configs?.map((config, index) => (
                                        <div key={index} className="flex gap-2 items-end bg-accent/30 p-2 rounded-md border border-border">
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Field Key</label>
                                                <Input
                                                    value={config.key}
                                                    onChange={(e) => {
                                                        const updated = [...editingForm.click_id_configs];
                                                        updated[index].key = e.target.value;
                                                        setEditingForm({ ...editingForm, click_id_configs: updated });
                                                    }}
                                                    placeholder="e.g. click_id"
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Method</label>
                                                <select
                                                    value={config.method}
                                                    className="w-full h-8 text-xs bg-background border border-input rounded-md px-2"
                                                    onChange={(e) => {
                                                        const updated = [...editingForm.click_id_configs];
                                                        updated[index].method = e.target.value;
                                                        if (e.target.value === 'url') updated[index].param_name = config.key;
                                                        if (e.target.value === 'rtk') updated[index].script_url = 'https://tr.cloudsoutions.com/uniclick.js?attribution=lastpaid&cookiedomain=cashinsecond.com&cookieduration=90&defaultcampaignid=6718e7b9f169cec28f38fbef&regviewonce=false';
                                                        setEditingForm({ ...editingForm, click_id_configs: updated });
                                                    }}
                                                >
                                                    <option value="url">URL Parameter</option>
                                                    <option value="rtk">RTK Script</option>
                                                    <option value="custom">Custom JS</option>
                                                </select>
                                            </div>
                                            {config.method === 'custom' && (
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-[10px] uppercase font-bold text-muted-foreground">JS Code</label>
                                                    <Input
                                                        value={config.param_name}
                                                        onChange={(e) => {
                                                            const updated = [...editingForm.click_id_configs];
                                                            updated[index].param_name = e.target.value;
                                                            setEditingForm({ ...editingForm, click_id_configs: updated });
                                                        }}
                                                        placeholder="window.myId"
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                onClick={() => {
                                                    const updated = editingForm.click_id_configs.filter((_, i) => i !== index);
                                                    setEditingForm({ ...editingForm, click_id_configs: updated });
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-[10px] h-7"
                                            onClick={() => {
                                                const current = editingForm.click_id_configs || [];
                                                setEditingForm({
                                                    ...editingForm,
                                                    click_id_configs: [...current, { key: 'click_id', method: 'url', param_name: 'click_id' }]
                                                });
                                            }}
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Add click_id (URL)
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-[10px] h-7"
                                            onClick={() => {
                                                const current = editingForm.click_id_configs || [];
                                                setEditingForm({
                                                    ...editingForm,
                                                    click_id_configs: [...current, {
                                                        key: 'rtkclickid',
                                                        method: 'rtk',
                                                        script_url: 'https://tr.cloudsoutions.com/uniclick.js?attribution=lastpaid&cookiedomain=cashinsecond.com&cookieduration=90&defaultcampaignid=6718e7b9f169cec28f38fbef&regviewonce=false'
                                                    }]
                                                });
                                            }}
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Add rtkclickid (Script)
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateForm} disabled={!editingForm?.name || !editingForm?.title}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent >
            </Dialog >
        </div >
    );
}
