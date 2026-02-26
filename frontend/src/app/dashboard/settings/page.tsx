'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from '@/components/mode-toggle';

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
