'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
    ShieldCheck, Plus, Trash2, Save, Play,
    Settings2, Info, CheckCircle2, XCircle
} from "lucide-react";
import api from '@/lib/api';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ValidationConfig {
    _id?: string;
    name: string;
    is_active: boolean;
    api_url: string;
    api_key: string;
    method: string;
    param_mappings: Record<string, string>;
    static_params: Record<string, string>;
    success_criteria_field: string;
    success_criteria_value: string;
}

const DEFAULT_LEAD_FIELDS = [
    "First_Name", "Last_Name", "Email", "Phone", "Address", "City", "State", "Zip",
    "Dob", "Gender", "User_Agent", "click_id",
    "gclid", "fbp", "fbc", "utm_source", "utm_medium", "utm_campaign",
    "utm_term", "utm_content", "eventid", "unique_id", "subsource", "source",
    "loanAmount", "loanPurpose", "dob_mm", "dob_dd", "dob_yyyy", "SSN",
    "payFrequency", "nextPayDate", "bankAccountType", "incomeMethod", "incomeType",
    "isMilitary", "Employer", "incomeNetMonthly", "debtAssistance", "creditRating",
    "ownVehicle", "bankName", "bankState", "routingNumber", "accountNumber",
    "driversLicenseNumber",
    "xxTrustedFormCertUrl", "xxTrustedFormToken", "xxTrustedFormPingUrl",
    "source_url", "source_domain", "trusted_form_url", "trusted_form_token"
];

export default function LeadValidationPage() {
    const [configs, setConfigs] = useState<ValidationConfig[]>([]);
    const [selectedConfig, setSelectedConfig] = useState<ValidationConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [leadFields, setLeadFields] = useState<string[]>(DEFAULT_LEAD_FIELDS);

    useEffect(() => {
        fetchConfigs();
        fetchFields();
    }, []);

    const fetchFields = async () => {
        try {
            const res = await api.get("/leads/fields");
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                setLeadFields(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch lead fields", error);
        }
    };

    const fetchConfigs = async () => {
        try {
            const res = await api.get('/validation/');
            setConfigs(res.data);
            if (res.data.length > 0 && !selectedConfig) {
                setSelectedConfig(res.data[0]);
            }
        } catch (err) {
            console.error("Failed to fetch configs", err);
            toast.error("Failed to load validation settings");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        const newConfig: ValidationConfig = {
            name: "New Validator",
            is_active: true,
            api_url: "https://lvt.vellko.com/api/validate",
            api_key: "",
            method: "GET",
            param_mappings: { "email": "email", "phone": "phone" },
            static_params: { "publisher": "MY_ID" },
            success_criteria_field: "status",
            success_criteria_value: "valid"
        };

        try {
            const res = await api.post('/validation/', newConfig);
            setConfigs([...configs, res.data]);
            setSelectedConfig(res.data);
            toast.success("Configuration created");
        } catch (err) {
            toast.error("Failed to create configuration");
        }
    };

    const handleSave = async () => {
        if (!selectedConfig?._id) return;
        try {
            const res = await api.put(`/validation/${selectedConfig._id}`, selectedConfig);
            setConfigs(configs.map(c => c._id === res.data._id ? res.data : c));
            toast.success("Configuration saved successfully");
        } catch (err) {
            toast.error("Failed to save configuration");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this configuration?")) return;
        try {
            await api.delete(`/validation/${id}`);
            setConfigs(configs.filter(c => c._id !== id));
            if (selectedConfig?._id === id) setSelectedConfig(null);
            toast.success("Configuration deleted");
        } catch (err) {
            toast.error("Failed to delete configuration");
        }
    };

    const updateMapping = (leadField: string, apiParam: string) => {
        if (!selectedConfig) return;
        const newMappings = { ...selectedConfig.param_mappings };
        if (apiParam === "") {
            delete newMappings[leadField];
        } else {
            newMappings[leadField] = apiParam;
        }
        setSelectedConfig({ ...selectedConfig, param_mappings: newMappings });
    };

    const addMappingRow = () => {
        if (!selectedConfig) return;
        const availableField = leadFields.find(f => !selectedConfig.param_mappings[f]);
        if (availableField) {
            updateMapping(availableField, availableField);
        }
    };

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6 max-w-6xl">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lead Validation</h1>
                    <p className="text-muted-foreground mt-1">
                        Configure third-party APIs to pre-screen and validate leads before entry.
                    </p>
                </div>
                <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" /> Add Validator
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Sidebar of Validators */}
                <Card className="lg:col-span-3 h-fit">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Validators</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0 space-y-1">
                        {configs.length === 0 ? (
                            <p className="text-xs text-center py-4 text-muted-foreground">No validators configured.</p>
                        ) : (
                            configs.map((config) => (
                                <div
                                    key={config._id}
                                    onClick={() => setSelectedConfig(config)}
                                    className={`p-3 rounded-md cursor-pointer transition-all flex items-center justify-between ${selectedConfig?._id === config._id ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-accent'}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{config.name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{config.is_active ? 'Active' : 'Disabled'}</p>
                                    </div>
                                    <ShieldCheck className={`h-4 w-4 ${config.is_active ? 'text-primary' : 'text-muted-foreground opacity-20'}`} />
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Right: Configuration Form */}
                <div className="lg:col-span-9 space-y-6">
                    {selectedConfig ? (
                        <>
                            <Card className="border-primary/20">
                                <CardHeader className="bg-primary/5 pb-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle>Validator Settings</CardTitle>
                                            <CardDescription>Configure how leads are sent to this validation API.</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 mr-4">
                                                <Label htmlFor="is_active_toggle" className="text-xs font-semibold">ENABLED</Label>
                                                <Switch
                                                    id="is_active_toggle"
                                                    checked={selectedConfig.is_active}
                                                    onCheckedChange={(val) => setSelectedConfig({ ...selectedConfig, is_active: val })}
                                                />
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => handleDelete(selectedConfig._id!)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                            <Button size="sm" onClick={handleSave}>
                                                <Save className="h-4 w-4 mr-2" /> Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Validator Name</Label>
                                            <Input
                                                value={selectedConfig.name}
                                                onChange={(e) => setSelectedConfig({ ...selectedConfig, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>HTTP Method</Label>
                                            <Select
                                                value={selectedConfig.method}
                                                onValueChange={(val) => setSelectedConfig({ ...selectedConfig, method: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="GET">GET (Query Params)</SelectItem>
                                                    <SelectItem value="POST">POST (JSON Body)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>API Endpoint URL</Label>
                                        <Input
                                            value={selectedConfig.api_url}
                                            placeholder="https://api.example.com/validate"
                                            onChange={(e) => setSelectedConfig({ ...selectedConfig, api_url: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>API Key / Token (Optional)</Label>
                                        <Input
                                            type="password"
                                            value={selectedConfig.api_key}
                                            onChange={(e) => setSelectedConfig({ ...selectedConfig, api_key: e.target.value })}
                                        />
                                        <p className="text-[10px] text-muted-foreground italic">Will be passed as 'api_key' parameter.</p>
                                    </div>

                                    <div className="pt-4 space-y-4">
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <Label className="text-sm font-bold flex items-center gap-2">
                                                <Settings2 className="h-4 w-4" /> Parameter Mapping
                                            </Label>
                                            <Button variant="link" size="sm" onClick={addMappingRow} className="text-xs h-7">
                                                <Plus className="h-3 w-3 mr-1" /> Add Mapping
                                            </Button>
                                        </div>

                                        <div className="space-y-3">
                                            {Object.entries(selectedConfig.param_mappings).map(([leadField, apiParam], idx) => (
                                                <div key={idx} className="flex gap-4 items-center animate-in fade-in slide-in-from-left-2 transition-all">
                                                    <div className="flex-1">
                                                        <Input
                                                            value={leadField}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const m = { ...selectedConfig.param_mappings };
                                                                // Important: we need to preserve the value but rename the key
                                                                const targetValue = m[leadField];
                                                                delete m[leadField];
                                                                m[val] = targetValue;
                                                                setSelectedConfig({ ...selectedConfig, param_mappings: m });
                                                            }}
                                                            placeholder="Lead Field"
                                                            list={`lead-fields-list-${idx}`}
                                                        />
                                                        <datalist id={`lead-fields-list-${idx}`}>
                                                            {leadFields.map(f => (
                                                                <option key={f} value={f} />
                                                            ))}
                                                        </datalist>
                                                    </div>
                                                    <div className="text-muted-foreground">→</div>
                                                    <div className="flex-[1.5]">
                                                        <Input
                                                            value={apiParam}
                                                            placeholder="API Param Name"
                                                            onChange={(e) => updateMapping(leadField, e.target.value)}
                                                        />
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => updateMapping(leadField, "")}>
                                                        <Trash2 className="h-3 w-3 text-destructive" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t space-y-4">
                                        <Label className="text-sm font-bold flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" /> Success Criteria
                                        </Label>
                                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-dashed text-xs">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase text-muted-foreground">Response Field</Label>
                                                <Input
                                                    value={selectedConfig.success_criteria_field}
                                                    placeholder="e.g. status"
                                                    onChange={(e) => setSelectedConfig({ ...selectedConfig, success_criteria_field: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase text-muted-foreground">Expected Value</Label>
                                                <Input
                                                    value={selectedConfig.success_criteria_value}
                                                    placeholder="e.g. valid"
                                                    onChange={(e) => setSelectedConfig({ ...selectedConfig, success_criteria_value: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-span-2 text-muted-foreground flex items-start gap-2 pt-2">
                                                <Info className="h-4 w-4 text-primary shrink-0" />
                                                <p>
                                                    If the validator API response contains <code>{selectedConfig.success_criteria_field}: "{selectedConfig.success_criteria_value}"</code>, the lead is accepted. Otherwise, it is rejected.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center p-12 border-2 border-dashed rounded-xl border-muted text-muted-foreground">
                            <p>Add or select a validator to configure screening logic.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
