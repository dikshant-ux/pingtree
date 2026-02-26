
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EndpointConfig } from "@/types/wizard";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface EndpointFormProps {
    config: EndpointConfig;
    onChange: (config: EndpointConfig) => void;
}

export default function EndpointForm({ config, onChange }: EndpointFormProps) {
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (field: keyof EndpointConfig, value: any) => {
        onChange({ ...config, [field]: value });
    };

    const selectClass = "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="space-y-4 border rounded-lg p-4 bg-card/50">
            <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                    <Label>Method</Label>
                    <select
                        className={selectClass}
                        value={config.method}
                        onChange={(e) => handleChange("method", e.target.value)}
                    >
                        <option value="POST">POST</option>
                        <option value="GET">GET</option>
                    </select>
                </div>
                <div className="col-span-3">
                    <Label>Endpoint URL</Label>
                    <Input
                        value={config.url || ''}
                        onChange={(e) => handleChange("url", e.target.value)}
                        placeholder="https://api.buyer.com/v1/leads"
                    />
                </div>
            </div>

            <div className="space-y-4 pt-2">
                <Label>Authentication</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                        className={selectClass}
                        value={config.auth_type}
                        onChange={(e) => handleChange("auth_type", e.target.value)}
                    >
                        <option value="none">No Authentication</option>
                        <option value="basic">Basic Auth (Base64)</option>
                        <option value="header">Custom Header (API Key)</option>
                        <option value="bearer">Bearer Token</option>
                    </select>

                    {/* Dynamic Auth Fields */}
                    {config.auth_type === 'basic' && (
                        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input
                                    value={config.username || ''}
                                    onChange={(e) => handleChange("username", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <Label>Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={config.password || ''}
                                        onChange={(e) => handleChange("password", e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {config.auth_type === 'header' && (
                        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <Label>Header Name</Label>
                                <Input
                                    value={config.header_name || ''}
                                    onChange={(e) => handleChange("header_name", e.target.value)}
                                    placeholder="x-api-key"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Header Value</Label>
                                <Input
                                    value={config.header_value || ''}
                                    onChange={(e) => handleChange("header_value", e.target.value)}
                                    type="password"
                                />
                            </div>
                        </div>
                    )}

                    {config.auth_type === 'bearer' && (
                        <div className="col-span-1 md:col-span-2 space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label>Bearer Token</Label>
                            <Input
                                value={config.token || ''}
                                onChange={(e) => handleChange("token", e.target.value)}
                                placeholder="eyJhbGciOiJIUzI1Ni..."
                                type="password"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
