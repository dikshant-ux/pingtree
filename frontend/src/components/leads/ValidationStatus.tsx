'use client';

import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Globe, AlertCircle, CheckCircle2, XCircle, Info } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ValidationStatusProps {
    results: any[];
}

export function ValidationStatus({ results }: ValidationStatusProps) {
    if (!results || results.length === 0) return <span className="text-[10px] text-slate-400 italic">None</span>;

    // Find the Lead Validation Tool (LVT) result - can be named LVT or LV
    const lvtResult = results.find(r => 
        r.validator_name?.toUpperCase() === 'LVT' || 
        r.validator_name?.toUpperCase() === 'LV' ||
        r.validator_name === 'Lead Validation'
    );

    if (!lvtResult) {
        // Fallback to showing other validator names if LVT isn't present
        return (
            <TooltipProvider>
                <div className="flex flex-wrap gap-1">
                    {results.map((res: any, idx: number) => (
                        <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                                <Badge
                                    variant={res.success ? "outline" : "destructive"}
                                    className={res.success ? "text-[9px] border-emerald-200 text-emerald-700 bg-emerald-50 cursor-help" : "text-[9px] cursor-help"}
                                >
                                    {res.validator_name}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs p-2">
                                <div className="space-y-1">
                                    <p className="font-bold flex items-center gap-2">
                                        <AlertCircle className="h-3 w-3" /> {res.validator_name} Details
                                    </p>
                                    <div className="flex flex-col gap-0.5 text-[11px]">
                                        <p><span className="text-muted-foreground">Status:</span> <span className={res.success ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                                            {res.success ? "Passed" : "Failed"}
                                        </span></p>
                                        {res.response_body?.message && <p><span className="text-muted-foreground">Message:</span> {res.response_body.message}</p>}
                                        {res.timestamp && <p><span className="text-muted-foreground">Time:</span> {new Date(res.timestamp).toLocaleTimeString()}</p>}
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            </TooltipProvider>
        );
    }

    const responseBody = lvtResult.response_body || {};
    const apiError = responseBody.error || responseBody.body?.error;
    const hasData = !!(responseBody.data && (responseBody.data.email || responseBody.data.phone || responseBody.data.ip));
    
    // We only show the "LV Error" badge if there is a technical error AND no field data.
    // If field data exists, we prefer showing the separated view even if the overall status is "invalid".
    const isTechnicalFailure = apiError && !hasData;

    if (isTechnicalFailure) {
        const errorMessage = typeof apiError === 'string' ? apiError : (apiError?.message || responseBody.message || "Validation service error");
        const errorCode = apiError?.code || "API_ERROR";

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant="destructive" className="flex items-center gap-1 text-[10px] px-2 py-0.5 font-bold cursor-help shadow-sm">
                            <AlertCircle className="h-3 w-3" />
                            <span>LV Error</span>
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs p-3 max-w-[250px]">
                        <div className="space-y-2">
                            <p className="font-bold text-rose-600 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" /> Validation Failed
                            </p>
                            <div className="space-y-1 text-[11px]">
                                <p><span className="text-muted-foreground font-medium">Error:</span> {errorMessage}</p>
                                {errorCode && <p><span className="text-muted-foreground font-medium">Code:</span> <code className="bg-slate-100 px-1 rounded text-[10px]">{errorCode}</code></p>}
                                {responseBody.error && typeof responseBody.error === 'string' && responseBody.error !== errorMessage && (
                                    <p><span className="text-muted-foreground font-medium">System:</span> {responseBody.error}</p>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 italic border-t pt-2">
                                Please check your API configuration or whitelist settings.
                            </p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    const data = responseBody.data || {};

    const getStatusInfo = (fieldData: any) => {
        if (!fieldData) return { icon: Info, color: 'text-slate-400', bg: 'bg-slate-50', label: 'N/A', error: null };

        const status = fieldData.status;
        const error = fieldData.error;

        if (error) {
            return { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Error', error };
        }

        if (status === 'valid') {
            return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Valid', error: null };
        }

        if (status === 'invalid') {
            return { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Invalid', error: null };
        }

        return { icon: Info, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200', label: status || 'Unknown', error: null };
    };

    const fields = [
        { key: 'email', label: 'Email', icon: Mail, data: data.email },
        { key: 'phone', label: 'Phone', icon: Phone, data: data.phone },
        { key: 'ip', label: 'IP', icon: Globe, data: data.ip },
    ];

    return (
        <TooltipProvider>
            <div className="flex flex-wrap gap-1.5">
                {fields.map((field) => {
                    const info = getStatusInfo(field.data);
                    const StatusIcon = info.icon;
                    const FieldIcon = field.icon;

                    return (
                        <Tooltip key={field.key}>
                            <TooltipTrigger asChild>
                                <Badge
                                    variant="outline"
                                    className={`flex items-center gap-1 text-[10px] px-1.5 py-0 border ${info.bg} ${info.color} ${info.border || 'border-transparent'} font-bold cursor-help`}
                                >
                                    <FieldIcon className="h-2.5 w-2.5" />
                                    <span>{field.label}</span>
                                    <StatusIcon className="h-2.5 w-2.5 ml-0.5" />
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs p-2">
                                <div className="space-y-1">
                                    <p className="font-bold flex items-center gap-2">
                                        <field.icon className="h-3 w-3" /> {field.label} Validation
                                    </p>
                                    <div className="flex flex-col gap-0.5 text-[11px]">
                                        {field.data?.input && <p><span className="text-muted-foreground">Input:</span> {field.data.input}</p>}
                                        <p><span className="text-muted-foreground">Status:</span> <span className={info.color}>{info.label}</span></p>
                                        {info.error && <p className="text-amber-600 font-medium">⚠️ {info.error}</p>}
                                        {field.data?.provider && <p><span className="text-muted-foreground">Provider:</span> {field.data.provider}</p>}
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}
