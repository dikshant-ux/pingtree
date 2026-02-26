
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WizardBuyerConfig } from "@/types/wizard";
import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { transformBackendToWizard } from "@/lib/wizard-utils"; // Import if needed for inverse, but here we need wizard -> backend logic which is in CreateBuyerWizard. We should reuse or duplicate transform logic.
// Actually Step7 receives 'data' which IS the config.

interface Step7Props {
    data: WizardBuyerConfig;
    updateData: (updates: Partial<WizardBuyerConfig>) => void;
}

export default function Step7_TestConsole({ data }: Step7Props) {
    const [inputJson, setInputJson] = useState('{\n  "Zip": "90210",\n  "State": "CA",\n  "First_Name": "John",\n  "Last_Name": "Doe",\n  "Email": "test@example.com",\n  "Phone": "5555555555"\n}');
    const [testResult, setTestResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const runTest = async () => {
        setIsLoading(true);
        setTestResult(null);
        try {
            let payload = {};
            try {
                payload = JSON.parse(inputJson);
            } catch (e) {
                toast.error("Invalid JSON input");
                setIsLoading(false);
                return;
            }

            // Client-side transformation for the request
            // We need to send the 'backend-ready' config structure to the test endpoint
            // OR we update the test endpoint to accept Wizard structure. 
            // The backend endpoint I wrote accepts `buyer_config` dict.
            // If I send the raw wizard state, the backend mapping logic expects 'ping_mapping', 'post_mapping' etc.
            // So I should transform it here first OR make the backend smarter.

            // Let's duplicate the basic transform logic here to be safe, or import it if I export it from CreateBuyerWizard.
            // Since CreateBuyerWizard has the logic inside the component, I'll quickly re-implement a lightweight version here or move it to utils.
            // Moving it to utils would be cleaner but for now I will construct the essential parts needed for the test.

            // Actually, the backend 'test' logic I wrote expects: ping_url, ping_mapping (list of dicts with internal_field, buyer_field), headers.
            // The wizard data has 'field_mapping' (array) and 'endpoints' (object).
            // Let's transform it to match what backend expects.

            const pingUrl = data.endpoints.ping?.url || data.endpoints.full?.url;
            const postUrl = data.endpoints.post?.url;

            const headers: Record<string, string> = {};
            const processAuth = (ep: any) => {
                if (ep?.auth_type === 'header' && ep.header_name) {
                    headers[ep.header_name] = ep.header_value;
                } else if (ep?.auth_type === 'bearer' && ep.token) {
                    headers['Authorization'] = `Bearer ${ep.token}`;
                } else if (ep?.auth_type === 'basic' && ep.username) {
                    headers['Authorization'] = `Basic ${btoa(`${ep.username}:${ep.password}`)}`;
                }
            };
            processAuth(data.endpoints.ping || data.endpoints.full);

            const mapField = (m: any) => ({
                internal_field: m.internal,
                buyer_field: m.buyer,
                static_value: m.static_value || null
            });

            const backendConfig = {
                ping_url: pingUrl,
                post_url: postUrl,
                headers: headers,
                // filters: ...,
                ping_mapping: data.field_mapping.filter(m => m.send_in_ping).map(mapField),
                post_mapping: data.field_mapping.filter(m => m.send_in_post).map(mapField),
                field_mapping: data.field_mapping.map(mapField),
                response_parsing: {
                    success_field: data.response_parser.success.path,
                    success_value: data.response_parser.success.value,
                    price_field: data.response_parser.price_path,
                    redirect_url_field: data.response_parser.redirect_url_path
                }
            };

            const res = await api.post('/buyers/test', {
                buyer_config: backendConfig,
                payload: payload,
                mode: data.integration_type === 'full_post' ? 'post' : 'ping'
            });

            setTestResult(res.data);
            if (res.data.status === 'success') {
                toast.success("Test Request Successful");
            } else {
                toast.warning("Test Request Failed/Rejected");
            }

        } catch (error: any) {
            console.error(error);
            toast.error("Test execution failed");
            setTestResult({
                status: 'error',
                logs: [`[FATAL] Error executing test: ${error.message || 'Unknown error'}`]
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4">
                <div className="flex-1 space-y-4">
                    <Label>Test Input (Internal Lead Data)</Label>
                    <textarea
                        value={inputJson}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputJson(e.target.value)}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs h-96"
                    />
                    <Button onClick={runTest} className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {isLoading ? "Running Test..." : "Send Test Request"}
                    </Button>
                </div>

                <div className="flex-1 space-y-4">
                    <Label>Result Preview</Label>
                    <Card className={`h-96 overflow-hidden border-2 ${testResult?.status === 'success' ? 'border-green-500 bg-green-50/10' : testResult?.status === 'rejected' || testResult?.status === 'error' ? 'border-red-500 bg-red-50/10' : 'border-border'}`}>
                        <CardContent className="p-4 h-full overflow-auto">
                            {!testResult ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm space-y-2">
                                    <div className="p-3 bg-muted rounded-full"><Loader2 className="w-6 h-6" /></div>
                                    <p>Ready to simulate. Click "Send Test Request".</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className={`flex items-center gap-2 font-bold ${testResult.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                        {testResult.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                        {testResult.status.toUpperCase()}
                                    </div>

                                    {testResult.parsed_output && (
                                        <div className="space-y-1">
                                            <div className="text-xs font-semibold text-muted-foreground">PARSED OUTPUT</div>
                                            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(testResult.parsed_output, null, 2)}</pre>
                                        </div>
                                    )}

                                    {testResult.response && (
                                        <div className="space-y-1">
                                            <div className="text-xs font-semibold text-muted-foreground">RAW RESPONSE ({testResult.response.status_code}) - {Math.round(testResult.response.duration_ms)}ms</div>
                                            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">{
                                                typeof testResult.response.body === 'string'
                                                    ? testResult.response.body
                                                    : JSON.stringify(testResult.response.body, null, 2)
                                            }</pre>
                                        </div>
                                    )}

                                    {testResult.request && (
                                        <div className="space-y-1">
                                            <div className="text-xs font-semibold text-muted-foreground">REQUEST SENT</div>
                                            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(testResult.request, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card className="bg-slate-950 text-slate-50 border-slate-800">
                <CardHeader className="py-3 bg-slate-900/50 border-b border-slate-800"><CardTitle className="text-sm font-mono text-slate-400">Execution Log</CardTitle></CardHeader>
                <CardContent className="py-3">
                    <div className="font-mono text-xs space-y-1 opacity-90 max-h-48 overflow-auto">
                        {!testResult?.logs?.length && <div className="text-slate-600 italic">Waiting for execution...</div>}
                        {testResult?.logs?.map((log: string, i: number) => (
                            <div key={i} className={`
                                ${log.includes('[FATAL]') || log.includes('Error') || log.includes('failed') ? 'text-red-400' : ''}
                                ${log.includes('Success') ? 'text-green-400' : ''}
                                ${log.includes('[NET]') ? 'text-blue-300' : ''}
                            `}>
                                {log}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
