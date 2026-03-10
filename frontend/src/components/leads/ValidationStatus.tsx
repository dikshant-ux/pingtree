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

    // Find the Lead Validation Tool (LVT) result
    const lvtResult = results.find(r => r.validator_name === 'LVT');

    if (!lvtResult) {
        // Fallback to showing other validator names if LVT isn't present
        return (
            <div className="flex flex-wrap gap-1">
                {results.map((res: any, idx: number) => (
                    <Badge
                        key={idx}
                        variant={res.success ? "outline" : "destructive"}
                        className={res.success ? "text-[9px] border-emerald-200 text-emerald-700 bg-emerald-50" : "text-[9px]"}
                    >
                        {res.validator_name}
                    </Badge>
                ))}
            </div>
        );
    }

    const data = lvtResult.response_body?.data || {};

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
