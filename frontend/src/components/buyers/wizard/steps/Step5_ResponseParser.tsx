import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { WizardBuyerConfig } from "@/types/wizard";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Step5Props {
    data: WizardBuyerConfig;
    updateData: (updates: Partial<WizardBuyerConfig>) => void;
}

export default function Step5_ResponseParser({ data, updateData }: Step5Props) {
    const parser = data.response_parser;

    const updateParser = (field: string, value: any) => {
        updateData({
            response_parser: {
                ...parser,
                [field]: value
            }
        });
    };

    const updateSuccessRule = (field: string, value: any) => {
        updateData({
            response_parser: {
                ...parser,
                success: {
                    ...parser.success,
                    [field]: value
                }
            }
        });
    };

    const addCustomField = () => {
        const current = parser.custom_fields || [];
        updateData({
            response_parser: {
                ...parser,
                custom_fields: [...current, { key: "", path: "" }]
            }
        });
    };

    const removeCustomField = (index: number) => {
        const current = parser.custom_fields || [];
        updateData({
            response_parser: {
                ...parser,
                custom_fields: current.filter((_, i) => i !== index)
            }
        });
    };

    const updateCustomField = (index: number, field: 'key' | 'path', value: string) => {
        const current = parser.custom_fields || [];
        const updated = [...current];
        updated[index] = { ...updated[index], [field]: value };
        updateData({
            response_parser: {
                ...parser,
                custom_fields: updated
            }
        });
    };

    const addContextRule = () => {
        const current = data.context_extraction || [];
        updateData({
            context_extraction: [...current, { response_field: "", context_key: "" }]
        });
    };

    const removeContextRule = (index: number) => {
        const current = data.context_extraction || [];
        updateData({
            context_extraction: current.filter((_, i) => i !== index)
        });
    };

    const updateContextRule = (index: number, field: 'response_field' | 'context_key', value: string) => {
        const current = data.context_extraction || [];
        const updated = [...current];
        updated[index] = { ...updated[index], [field]: value };
        updateData({
            context_extraction: updated
        });
    };



    const selectClass = "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="space-y-8">
            {/* Success Condition */}
            <Card className="border-green-200 bg-green-50/20">
                <CardContent className="pt-6 space-y-4">
                    <div>
                        <h3 className="text-lg font-medium text-green-500">Success Condition</h3>
                        <p className="text-sm text-green-500 mb-4">
                            Define acts as a "Sold" response. If this condition matches, the lead is considered accepted.
                        </p>
                    </div>

                    <div className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-4 space-y-2">
                            <Label>JSON Path</Label>
                            <Input
                                value={parser.success.path || ''}
                                onChange={(e) => updateSuccessRule('path', e.target.value)}
                                placeholder="response.status"
                                className="font-mono"
                            />
                        </div>
                        <div className="col-span-3 space-y-2">
                            <Label>Operator</Label>
                            <select
                                className={selectClass}
                                value={parser.success.operator}
                                onChange={(e) => updateSuccessRule('operator', e.target.value)}
                            >
                                <option value="equals">Equals (=)</option>
                                <option value="contains">Contains</option>
                                <option value="not_equals">Not Equals (!=)</option>
                                <option value="exists">Exists (Any Value)</option>
                            </select>
                        </div>
                        <div className="col-span-5 space-y-2">
                            <Label>Expected Value</Label>
                            <Input
                                value={parser.success.value || ''}
                                onChange={(e) => updateSuccessRule('value', e.target.value)}
                                placeholder="success"
                                disabled={parser.success.operator === 'exists'}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Extraction */}
            <Card>
                <CardContent className="pt-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-medium">Data Extraction</h3>
                        <p className="text-sm text-muted-foreground">
                            Where should we find critical data in the JSON response?
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Price / Payout Path</Label>
                            <Input
                                value={parser.price_path || ''}
                                onChange={(e) => updateParser('price_path', e.target.value)}
                                placeholder="response.price"
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">Path to the bid amount.</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Lead ID / Reference Path</Label>
                            <Input
                                value={parser.lead_id_path || ''}
                                onChange={(e) => updateParser('lead_id_path', e.target.value)}
                                placeholder="response.lead_id"
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">Important for tracking and post calls.</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Redirect URL Path</Label>
                            <Input
                                value={parser.redirect_url_path || ''}
                                onChange={(e) => updateParser('redirect_url_path', e.target.value)}
                                placeholder="response.redirect"
                                className="font-mono text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Error / Reason Path</Label>
                            <Input
                                value={parser.reason_path || ''}
                                onChange={(e) => updateParser('reason_path', e.target.value)}
                                placeholder="response.error.message"
                                className="font-mono text-sm"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>




            {/* Context Extraction (Ping to Post) */}
            <Card className="border-blue-200 bg-blue-50/20">
                <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium text-blue-600">Ping-Post Context Extraction</h3>
                            <p className="text-sm text-blue-500">
                                Extract data from Ping Response and pass it to Post Request.
                            </p>
                        </div>
                        <Button onClick={addContextRule} variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-white-50">
                            <Plus className="w-4 h-4 mr-2" /> Add Rule
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {(data.context_extraction || []).map((rule, index) => (
                            <div key={index} className="flex gap-4 items-end">
                                <div className="flex-1 space-y-2">
                                    <Label>Response Field (JSON Path)</Label>
                                    <Input
                                        value={rule.response_field}
                                        onChange={(e) => updateContextRule(index, 'response_field', e.target.value)}
                                        placeholder="e.g. lead_id"
                                        className="font-mono text-sm"
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label>Context Key (For Post Config)</Label>
                                    <Input
                                        value={rule.context_key}
                                        onChange={(e) => updateContextRule(index, 'context_key', e.target.value)}
                                        placeholder="e.g. buyer_lead_id"
                                        className="font-mono text-sm"
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => removeContextRule(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        {(data.context_extraction || []).length === 0 && (
                            <div className="text-sm text-blue-600/60 italic text-center py-4 bg-blue-100/30 rounded-lg">
                                No context extraction rules defined.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>


    );
}
