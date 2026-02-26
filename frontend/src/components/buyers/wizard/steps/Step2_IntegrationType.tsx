
import { Label } from "@/components/ui/label";
import { WizardBuyerConfig } from "@/types/wizard";
import { Card, CardContent } from "@/components/ui/card";

interface Step2Props {
    data: WizardBuyerConfig;
    updateData: (updates: Partial<WizardBuyerConfig>) => void;
}

export default function Step2_IntegrationType({ data, updateData }: Step2Props) {
    return (
        <div className="space-y-8">
            <Card>
                <CardContent className="pt-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-medium">Choose Integration Model</h3>
                        <p className="text-sm text-muted-foreground">
                            How does this buyer accept leads? This determines the subsequent configuration steps.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div
                            onClick={() => updateData({ integration_type: 'ping_post' })}
                            className={`
                            flex items-start space-x-4 border rounded-xl p-6 cursor-pointer transition-all
                            ${data.integration_type === 'ping_post' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}
                        `}>
                            <div className="mt-1">
                                <input type="radio" checked={data.integration_type === 'ping_post'} readOnly className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <span className="font-bold text-lg">Ping & Post (Real-Time Bidding)</span>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    The standard exchange model. We first send a partial <strong>Ping</strong> request with anonymized data to get a bid. If the bid wins, we send the full <strong>Post</strong> request.
                                </p>
                                <div className="pt-2 flex gap-2">
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">Dynamic Pricing</span>
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">High Volume</span>
                                </div>
                            </div>
                        </div>

                        <div
                            onClick={() => updateData({ integration_type: 'full_post' })}
                            className={`
                            flex items-start space-x-4 border rounded-xl p-6 cursor-pointer transition-all
                            ${data.integration_type === 'full_post' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}
                        `}>
                            <div className="mt-1">
                                <input type="radio" checked={data.integration_type === 'full_post'} readOnly className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <span className="font-bold text-lg">Direct Post Only</span>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Send full lead data immediately to a single endpoint. Pricing is dynamic and extracted from the buyer's response, or uses a default priority for ranking.
                                </p>
                                <div className="pt-2 flex gap-2">
                                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold uppercase">Dynamic Pricing</span>
                                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold uppercase">Simple</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
