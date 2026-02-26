'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Buyer } from '@/types';
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowDown, DollarSign, Play, AlertCircle, CheckCircle2, RotateCcw, Plus, Trash2, Code, Copy, Terminal
} from 'lucide-react';
import Link from 'next/link';

export default function PingTreePage() {
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [loading, setLoading] = useState(true);

    // Simulation State
    const [simulating, setSimulating] = useState(false);

    // Default fields: state, zip_code, age initialized but editable/removable
    const [customFields, setCustomFields] = useState<{ key: string, value: string }[]>([
        { key: 'state', value: '' },
        { key: 'zip_code', value: '' },
        { key: 'age', value: '' }
    ]);

    const [simulationResult, setSimulationResult] = useState<{
        matched: string[],
        rejected: Record<string, string>, // buyerId -> reason
        winner?: string
    } | null>(null);

    useEffect(() => {
        fetchBuyers();
    }, []);

    const fetchBuyers = async () => {
        try {
            const res = await api.get('/buyers/');
            // Sort client-side to match backend logic: Payout DESC, Priority ASC
            const sorted = (res.data as Buyer[])
                .filter(b => b.status === 'active')
                .sort((a, b) => {
                    if (b.payout !== a.payout) return b.payout - a.payout;
                    return a.priority - b.priority;
                });
            setBuyers(sorted);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addCustomField = () => {
        setCustomFields([...customFields, { key: '', value: '' }]);
    };

    const removeCustomField = (index: number) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    const updateCustomField = (index: number, field: 'key' | 'value', val: string) => {
        const newFields = [...customFields];
        newFields[index][field] = val;
        setCustomFields(newFields);
    };

    const runSimulation = () => {
        setSimulating(true);
        const matched: string[] = [];
        const rejected: Record<string, string> = {};
        let winner: string | undefined;

        // Construct full simulated lead object
        const simulatedLead: Record<string, any> = {};
        customFields.forEach(f => {
            if (f.key) {
                // Auto-convert age to number for logic checks if key is "age"
                if (f.key.toLowerCase() === 'age') {
                    const parsed = parseInt(f.value);
                    simulatedLead[f.key] = isNaN(parsed) ? f.value : parsed;
                } else {
                    simulatedLead[f.key] = f.value;
                }
            }
        });

        for (const buyer of buyers) {
            // Check State
            if (buyer.filters.states?.length > 0) {
                if (!simulatedLead.state || !buyer.filters.states.map(s => s.toUpperCase()).includes(String(simulatedLead.state).toUpperCase())) {
                    rejected[buyer._id] = 'State Mismatch';
                    continue;
                }
            }

            // Check Zip
            if (buyer.filters.zip_codes?.length > 0) {
                if (!simulatedLead.zip_code || !buyer.filters.zip_codes.includes(String(simulatedLead.zip_code))) {
                    rejected[buyer._id] = 'Zip Mismatch';
                    continue;
                }
            }

            // Check Age
            // We expect "age" key in simulatedLead for this standard filter
            if (simulatedLead.age !== undefined && typeof simulatedLead.age === 'number') {
                const age = simulatedLead.age;
                if (buyer.filters.min_age && age < buyer.filters.min_age) {
                    rejected[buyer._id] = `Too Young (Min ${buyer.filters.min_age})`;
                    continue;
                }
                if (buyer.filters.max_age && age > buyer.filters.max_age) {
                    rejected[buyer._id] = `Too Old (Max ${buyer.filters.max_age})`;
                    continue;
                }
            }

            // Check Custom Conditions
            if (buyer.filters.custom_conditions) {
                let conditionFailed = false;
                for (const [key, requiredValue] of Object.entries(buyer.filters.custom_conditions)) {
                    // Loose equality check to handle string vs number differences in input
                    if (simulatedLead[key] != requiredValue) {
                        rejected[buyer._id] = `Condition Fail: ${key} != ${requiredValue}`;
                        conditionFailed = true;
                        break;
                    }
                }
                if (conditionFailed) continue;
            }

            // If passed all, this is the match (assuming infinite budget for sim)
            matched.push(buyer._id);
            if (!winner) {
                winner = buyer._id; // First match wins in simple waterfall
            }
        }

        setSimulationResult({ matched, rejected, winner });
    };

    const resetSimulation = () => {
        setSimulating(false);
        setSimulationResult(null);
        setCustomFields([
            { key: 'state', value: '' },
            { key: 'zip_code', value: '' },
            { key: 'age', value: '' }
        ]);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could show toast here
    };

    if (loading) return <div>Loading routing configuration...</div>;

    const endpointUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/v1/leads/` : '/api/v1/leads/';

    const curlExample = `curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "state": "CA",
    "zip_code": "90210",
    "age": 30,
    "first_name": "John",
    "last_name": "Doe"
  }'`;

    const jsExample = `const response = await fetch('${endpointUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    state: 'CA',
    zip_code: '90210',
    age: 30,
    first_name: 'John',
    last_name: 'Doe'
  })
});

const result = await response.json();
console.log(result);`;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Ping Tree</h2>
                    <p className="text-muted-foreground">Manage your routing logic and integrations.</p>
                </div>
            </div>

            <Tabs defaultValue="routing" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="routing">Routing & Simulation</TabsTrigger>
                    <TabsTrigger value="ingestion">Lead Ingestion</TabsTrigger>
                </TabsList>

                {/* ROUTING TAB */}
                <TabsContent value="routing">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Visual Ping Tree */}
                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">Active Routing Path</h2>
                                <p className="text-muted-foreground">
                                    Leads cascade from top to bottom based on Payout (Highest) then Priority.
                                </p>
                            </div>

                            <div className="relative space-y-4 pb-12">
                                {/* Vertical Line */}
                                <div className="absolute left-8 top-4 bottom-0 w-0.5 bg-border -z-10" />

                                {buyers.length === 0 ? (
                                    <div className="p-8 border border-dashed rounded-xl text-center bg-muted/30">
                                        <p className="text-muted-foreground">No active buyers found.</p>
                                        <Link href="/dashboard/buyers/create">
                                            <Button variant="link" className="mt-2">Add your first buyer</Button>
                                        </Link>
                                    </div>
                                ) : (
                                    buyers.map((buyer, index) => {
                                        const isWinner = simulationResult?.winner === buyer._id;
                                        const isRejected = simulationResult?.rejected[buyer._id];

                                        let borderClass = "border-border";
                                        let cardClass = "bg-card";

                                        if (simulating) {
                                            if (isWinner) {
                                                borderClass = "border-green-500 ring-2 ring-green-500/20";
                                                cardClass = "bg-green-500/5";
                                            } else if (isRejected) {
                                                borderClass = "border-red-200 opacity-60";
                                            }
                                        }

                                        return (
                                            <div key={buyer._id} className="relative pl-16 transition-all duration-300">
                                                {/* Index Node */}
                                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border bg-background z-10 
                                                    ${isWinner ? "border-green-500 text-green-600 bg-green-50" : "border-border text-muted-foreground"}`}>
                                                    {index + 1}
                                                </div>

                                                {/* Connector Arrow */}
                                                {index < buyers.length - 1 && (
                                                    <div className="absolute left-8 -bottom-6 w-px h-6 bg-border flex items-center justify-center overflow-visible">
                                                        <ArrowDown className="w-4 h-4 text-muted-foreground/30 translate-y-2" />
                                                    </div>
                                                )}

                                                <Card className={`${borderClass} ${cardClass} transition-colors`}>
                                                    <CardContent className="p-4 flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold text-foreground">{buyer.name}</h3>
                                                                {isWinner && <Badge className="bg-green-500 hover:bg-green-600">WINNER</Badge>}
                                                                {isRejected && <Badge variant="outline" className="text-red-500 border-red-200">{isRejected}</Badge>}
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                <div className="flex items-center gap-1">
                                                                    <DollarSign className="w-3 h-3" />
                                                                    <span className="font-medium text-foreground">${buyer.payout}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-xs">Priority:</span>
                                                                    <span className="font-medium text-foreground">{buyer.priority}</span>
                                                                </div>
                                                                <div className="flex gap-1 flex-wrap">
                                                                    {buyer.filters.states?.length > 0 && (
                                                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-indigo-50 text-indigo-700">
                                                                            {buyer.filters.states.length} States
                                                                        </Badge>
                                                                    )}
                                                                    {buyer.filters.min_age && (
                                                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-orange-50 text-orange-700">
                                                                            {buyer.filters.min_age}+
                                                                        </Badge>
                                                                    )}
                                                                    {buyer.filters.custom_conditions && Object.keys(buyer.filters.custom_conditions).length > 0 && (
                                                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-purple-50 text-purple-700">
                                                                            {Object.keys(buyer.filters.custom_conditions).length} Rules
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <Link href={`/dashboard/buyers/${buyer._id}`}>
                                                            <Button variant="ghost" size="sm" className="h-8">
                                                                Config
                                                            </Button>
                                                        </Link>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Right Column: Simulator */}
                        <div>
                            <Card className="sticky top-6 border-indigo-100 dark:border-indigo-900/30 shadow-md">
                                <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10 pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Play className="w-5 h-5 text-indigo-600" />
                                        Route Simulator
                                    </CardTitle>
                                    <CardDescription>
                                        Test how a lead travels through your ping tree.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">

                                    {/* Dynamic Field List */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-medium">Lead Data Payload</label>
                                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={addCustomField}>
                                                <Plus className="w-3 h-3 mr-1" /> Add Field
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {customFields.map((field, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <input
                                                        placeholder="Key (e.g. state)"
                                                        className="w-1/3 px-2 py-1.5 rounded-md border text-xs bg-background"
                                                        value={field.key}
                                                        onChange={e => updateCustomField(idx, 'key', e.target.value)}
                                                    />
                                                    <input
                                                        placeholder="Value"
                                                        className="flex-1 px-2 py-1.5 rounded-md border text-xs bg-background"
                                                        value={field.value}
                                                        onChange={e => updateCustomField(idx, 'value', e.target.value)}
                                                    />
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={() => removeCustomField(idx)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {customFields.length === 0 && (
                                                <div className="text-center py-8 border border-dashed rounded-md bg-muted/20">
                                                    <p className="text-xs text-muted-foreground">No data fields.</p>
                                                    <Button variant="link" size="sm" onClick={addCustomField} className="h-6 text-xs">Start adding data</Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-2">
                                        {simulating ? (
                                            <Button className="w-full" variant="outline" onClick={resetSimulation}>
                                                <RotateCcw className="w-4 h-4 mr-2" />
                                                Reset
                                            </Button>
                                        ) : (
                                            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white" onClick={runSimulation}>
                                                Run Test
                                            </Button>
                                        )}
                                    </div>

                                    {simulating && simulationResult?.winner && (
                                        <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-green-900">Sold Successfully!</p>
                                                <p className="text-xs text-green-700 mt-1">
                                                    Matched <strong>{buyers.find(b => b._id === simulationResult.winner)?.name}</strong> for
                                                    ${buyers.find(b => b._id === simulationResult.winner)?.payout}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {simulating && !simulationResult?.winner && (
                                        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-red-900">Lead Rejected</p>
                                                <p className="text-xs text-red-700 mt-1">
                                                    No buyers accepted this lead criteria.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* INGESTION TAB */}
                <TabsContent value="ingestion">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Terminal className="w-5 h-5 text-indigo-500" />
                                    API Integration Details
                                </CardTitle>
                                <CardDescription>
                                    Use these details to configure your lead sources to post data to our system.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <label className="text-sm font-medium block mb-2">Ingestion Endpoint (POST)</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 p-3 bg-muted rounded-md border font-mono text-sm break-all">
                                            {endpointUrl}
                                        </div>
                                        <Button variant="outline" onClick={() => copyToClipboard(endpointUrl)}>
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copy
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                            <Code className="w-4 h-4" /> cURL Example
                                        </h4>
                                        <div className="relative group">
                                            <div className="p-4 bg-slate-950 text-slate-50 rounded-lg text-xs font-mono overflow-auto h-48">
                                                <pre>{curlExample}</pre>
                                            </div>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => copyToClipboard(curlExample)}
                                            >
                                                <Copy className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                            <Code className="w-4 h-4" /> JavaScript Example
                                        </h4>
                                        <div className="relative group">
                                            <div className="p-4 bg-slate-950 text-slate-50 rounded-lg text-xs font-mono overflow-auto h-48">
                                                <pre>{jsExample}</pre>
                                            </div>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => copyToClipboard(jsExample)}
                                            >
                                                <Copy className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <h4 className="font-medium mb-3">Authentication Method</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Currently, the endpoint is open for testing. In production, you should enable API Key authentication in settings.
                                        (Coming Soon)
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
