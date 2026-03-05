
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { WizardBuyerConfig } from "@/types/wizard";

interface Step1Props {
    data: WizardBuyerConfig;
    updateData: (updates: Partial<WizardBuyerConfig>) => void;
}

export default function Step1_BasicInfo({ data, updateData }: Step1Props) {
    const handleChange = (field: string, value: any) => {
        updateData({
            buyer: {
                ...data.buyer,
                [field]: value
            }
        });
    };

    const selectClass = "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="space-y-8">
            {/* Basic Identity */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Buyer Name</Label>
                            <Input
                                value={data.buyer.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                placeholder="e.g. LendingTree"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Company Entity</Label>
                            <Input
                                value={data.buyer.company}
                                onChange={(e) => handleChange("company", e.target.value)}
                                placeholder="LendingTree, LLC"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Vertical</Label>
                            <select
                                className={selectClass}
                                value={data.buyer.vertical}
                                onChange={(e) => handleChange("vertical", e.target.value)}
                            >
                                <option value="Home Services">Home Services</option>
                                <option value="Solar">Solar</option>
                                <option value="Auto Insurance">Auto Insurance</option>
                                <option value="Personal Loans">Personal Loans</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Environment</Label>
                            <select
                                className={selectClass}
                                value={data.buyer.environment}
                                onChange={(e) => handleChange("environment", e.target.value)}
                            >
                                <option value="test">Test / Sandbox</option>
                                <option value="live">Live / Production</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Response Timeout (ms)</Label>
                            <Input
                                type="number"
                                value={data.buyer.timeout_ms}
                                onChange={(e) => handleChange("timeout_ms", parseInt(e.target.value) || 0)}
                                placeholder="1000"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>


        </div>
    );
}
