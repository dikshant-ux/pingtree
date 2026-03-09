
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    Filter,
    DollarSign,
    ArrowRight,
    Clock,
    Shield
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TraceEvent {
    timestamp: string;
    stage: string;
    status: string;
    buyer_id?: string;
    buyer_name?: string;
    details?: string;
}

interface TraceTimelineProps {
    trace: TraceEvent[];
}

export function TraceTimeline({ trace }: TraceTimelineProps) {
    if (!trace || trace.length === 0) {
        return <div className="text-muted-foreground text-sm">No trace data available.</div>;
    }

    const getIcon = (event: TraceEvent) => {
        if (event.status === 'Sold' || event.status === 'Received') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        if (event.status === 'Rejected') return <XCircle className="w-5 h-5 text-red-500" />;
        if (event.status === 'Skipped') return <Filter className="w-5 h-5 text-muted-foreground" />;
        if (event.status === 'Error') return <AlertCircle className="w-5 h-5 text-orange-500" />;
        return <Clock className="w-5 h-5 text-indigo-500" />;
    };


    return (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {trace.map((event, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                    {/* Icon */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-secondary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        {getIcon(event)}
                    </div>

                    {/* Content Card */}
                    <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground text-sm">{event.stage}</span>
                                <Badge variant={
                                    event.status === 'Sold' ? 'default' :
                                        event.status === 'Rejected' ? 'destructive' :
                                            event.status === 'Skipped' ? 'outline' : 'secondary'
                                } className="text-[10px] h-5 px-1.5">
                                    {event.status}
                                </Badge>
                            </div>
                            <time className="font-mono text-[10px] text-muted-foreground">{new Date(event.timestamp).toLocaleTimeString()}</time>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            {event.buyer_id && (
                                <div className="flex items-center gap-1 text-xs font-medium text-foreground mb-1">
                                    {event.stage === 'Cap' ? <Shield className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                                    <span className="font-semibold text-primary">
                                        {event.buyer_name || `Buyer ${event.buyer_id.substring(0, 8)}...`}
                                    </span>
                                </div>
                            )}
                            <p className="text-foreground/80">{event.details}</p>
                        </div>
                    </Card>
                </div>
            ))}
        </div>
    );
}
