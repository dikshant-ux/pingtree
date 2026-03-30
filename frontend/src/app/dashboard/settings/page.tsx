'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from '@/components/mode-toggle';
import { useTimezone } from '@/context/TimezoneContext';
import { getAllTimezones, getUtcOffsetLabel } from '@/lib/timezone';
import { Globe, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

// ─── Timezone Picker ──────────────────────────────────────────────────────────

function TimezonePicker() {
    const { timezone, updateTimezone } = useTimezone();
    const [selected, setSelected] = useState(timezone);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const allZones = getAllTimezones();
    const filtered = search
        ? allZones.filter(tz =>
            tz.toLowerCase().includes(search.toLowerCase()) ||
            getUtcOffsetLabel(tz).toLowerCase().includes(search.toLowerCase())
          )
        : allZones;

    const handleSave = async () => {
        if (selected === timezone) return;
        setSaving(true);
        try {
            await updateTimezone(selected);
            toast.success(`Timezone updated to ${selected}`);
        } catch {
            toast.error('Failed to save timezone. Please try again.');
            setSelected(timezone); // Revert
        } finally {
            setSaving(false);
        }
    };

    // Group by region (e.g. "America", "Asia", etc.)
    const grouped = filtered.reduce<Record<string, string[]>>((acc, tz) => {
        const region = tz.includes('/') ? tz.split('/')[0] : 'Other';
        if (!acc[region]) acc[region] = [];
        acc[region].push(tz);
        return acc;
    }, {});

    const offsetLabel = getUtcOffsetLabel(selected);
    const hasChanged = selected !== timezone;

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-indigo-500" />
                    <CardTitle>Timezone</CardTitle>
                </div>
                <CardDescription>
                    All dashboard dates, stats, and reports are computed using your selected timezone.
                    Currently active: <strong>{timezone}</strong> ({getUtcOffsetLabel(timezone)})
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current selection display */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900">
                    <div>
                        <p className="text-sm font-semibold text-foreground">{selected.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{offsetLabel}</p>
                    </div>
                    {selected === timezone && (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                            <Check className="h-3 w-3" /> Saved
                        </span>
                    )}
                </div>

                {/* Search */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search timezone (e.g. Kolkata, New York, UTC)..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {/* Scrollable timezone list */}
                <div className="h-60 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-card divide-y divide-slate-100 dark:divide-slate-800">
                    {Object.keys(grouped).sort().map(region => (
                        <div key={region}>
                            <div className="sticky top-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                {region}
                            </div>
                            {grouped[region].map(tz => {
                                const offset = getUtcOffsetLabel(tz);
                                const city = tz.split('/').slice(1).join('/').replace(/_/g, ' ');
                                return (
                                    <button
                                        key={tz}
                                        onClick={() => setSelected(tz)}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/30
                                            ${selected === tz
                                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                                                : 'text-foreground'
                                            }`}
                                    >
                                        <span>{city || tz}</span>
                                        <span className={`text-xs font-mono ${selected === tz ? 'text-indigo-500' : 'text-muted-foreground'}`}>
                                            {offset}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            No timezones found for "{search}".
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex items-center gap-3">
                <Button
                    onClick={handleSave}
                    disabled={!hasChanged || saving}
                    className="gap-2"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                    {saving ? 'Saving…' : 'Save Timezone'}
                </Button>
                {hasChanged && (
                    <span className="text-xs text-amber-600 font-medium">
                        Unsaved change: {selected.split('/').pop()?.replace(/_/g, ' ')} ({getUtcOffsetLabel(selected)})
                    </span>
                )}
            </CardFooter>
        </Card>
    );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your application preferences and configurations.
                </p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="display">Display</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-4 mt-6">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Organization Info</CardTitle>
                            <CardDescription>
                                Update your organization details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="org-name">Organization Name</Label>
                                <div className="p-2 border rounded-md bg-muted/20 text-sm text-muted-foreground">
                                    Ping Tree Inc. (Read Only)
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timezone Card */}
                    <TimezonePicker />
                </TabsContent>

                {/* Notifications Settings */}
                <TabsContent value="notifications" className="space-y-4 mt-6">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Email Notifications</CardTitle>
                            <CardDescription>
                                Choose what you want to be notified about.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="marketing-emails" className="flex flex-col space-y-1">
                                    <span>Marketing emails</span>
                                    <span className="font-normal text-xs text-muted-foreground">Receive emails about new features and updates.</span>
                                </Label>
                                <Switch id="marketing-emails" />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="security-emails" className="flex flex-col space-y-1">
                                    <span>Security emails</span>
                                    <span className="font-normal text-xs text-muted-foreground">Receive emails about your account security.</span>
                                </Label>
                                <Switch id="security-emails" defaultChecked disabled />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>Save Preferences</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Display Settings */}
                <TabsContent value="display" className="space-y-4 mt-6">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                            <CardDescription>
                                Customize the look and feel of the dashboard.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between space-x-2">
                                <Label className="flex flex-col space-y-1">
                                    <span>Theme</span>
                                    <span className="font-normal text-xs text-muted-foreground">Select your preferred theme.</span>
                                </Label>
                                <ModeToggle />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="compact-mode" className="flex flex-col space-y-1">
                                    <span>Compact Mode</span>
                                    <span className="font-normal text-xs text-muted-foreground">Reduce whitespace for higher density.</span>
                                </Label>
                                <Switch id="compact-mode" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
