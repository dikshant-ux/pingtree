
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WizardBuyerConfig, WizardFilterRule } from "@/types/wizard";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Step6Props {
    data: WizardBuyerConfig;
    updateData: (updates: Partial<WizardBuyerConfig>) => void;
}

export default function Step6_FiltersCaps({ data, updateData }: Step6Props) {
    const filters = data.filters || [];
    const caps = data.caps || { daily: 0, hourly: 0 };

    const [availableFields, setAvailableFields] = useState<string[]>([
        "First_Name", "Last_Name", "Email", "Phone", "Address", "Zip",
        "Dob", "Gender", "Ip_Address", "User_Agent", "click_id",
        "city", "state", "fullState",
        "gclid", "fbp", "fbc", "utm_source", "utm_medium", "utm_campaign",
        "utm_term", "utm_content", "eventid", "unique_id", "subsource", "source",
        "loanAmount", "loanPurpose", "dob_mm", "dob_dd", "dob_yyyy", "SSN",
        "payFrequency", "nextPayDate", "bankAccountType", "incomeMethod", "incomeType",
        "isMilitary", "Employer", "incomeNetMonthly", "debtAssistance", "creditRating",
        "ownVehicle", "bankName", "bankState", "routingNumber", "accountNumber",
        "xxTrustedFormCertUrl", "xxTrustedFormToken", "xxTrustedFormPingUrl",
        "source_url", "source_domain", "trusted_form_url", "trusted_form_token"
    ]);

    useEffect(() => {
        const fetchFields = async () => {
            try {
                const res = await api.get("/leads/fields");
                if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                    setAvailableFields(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch lead fields", error);
            }
        };
        fetchFields();
    }, []);

    // Filters Logic
    const addFilter = () => {
        updateData({
            filters: [
                ...filters,
                { field: '', operator: '=', value: '' }
            ]
        });
    };

    const updateFilter = (index: number, field: keyof WizardFilterRule, value: any) => {
        const newFilters = [...filters];
        newFilters[index] = { ...newFilters[index], [field]: value };
        updateData({ filters: newFilters });
    };

    const removeFilter = (index: number) => {
        const newFilters = filters.filter((_, i) => i !== index);
        updateData({ filters: newFilters });
    };

    // Caps Logic
    const updateCap = (field: keyof typeof caps, value: number) => {
        updateData({
            caps: {
                ...caps,
                [field]: value
            }
        });
    };

    const selectClass = "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="space-y-8">
            {/* Filters Engine */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Filtering Rules (Targeting)</CardTitle>
                    <Button onClick={addFilter} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" /> Add Rule
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {filters.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground text-sm italic border-2 border-dashed rounded-lg">
                            No active filters. This buyer will receive ALL matching leads.
                        </div>
                    )}

                    {filters.map((filter, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-1 flex justify-center text-xs font-bold text-muted-foreground">
                                IF
                            </div>
                            <div className="col-span-4">
                                <Input
                                    value={filter.field}
                                    onChange={(e) => updateFilter(index, 'field', e.target.value)}
                                    placeholder="Field (e.g. state)"
                                    list={`fields-list-${index}`}
                                />
                                <datalist id={`fields-list-${index}`}>
                                    {availableFields.map(f => (
                                        <option key={f} value={f} />
                                    ))}
                                </datalist>
                            </div>
                            <div className="col-span-2">
                                <select
                                    className={selectClass}
                                    value={filter.operator}
                                    onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                                >
                                    <option value="=">Equals (=)</option>
                                    <option value="!=">Not Equals (!=)</option>
                                    <option value="IN">In List (IN)</option>
                                    <option value="NOT IN">Not In List</option>
                                    <option value="STARTS_WITH">Starts With</option>
                                </select>
                            </div>
                            <div className="col-span-4">
                                <Input
                                    value={filter.value}
                                    onChange={(e) => updateFilter(index, 'value', e.target.value)}
                                    placeholder="Value (e.g. CA, TX)"
                                />
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFilter(index)}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Volume Caps */}
            <Card>
                <CardHeader><CardTitle>Volume Caps</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label>Daily Cap</Label>
                            <Input
                                type="number"
                                min="0"
                                value={caps.daily}
                                onChange={(e) => updateCap('daily', parseInt(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">0 = Unlimited</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Hourly Cap</Label>
                            <Input
                                type="number"
                                min="0"
                                value={caps.hourly}
                                onChange={(e) => updateCap('hourly', parseInt(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">0 = Unlimited</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Per Minute Throttle</Label>
                            <Input
                                type="number"
                                min="0"
                                value={caps.per_minute}
                                onChange={(e) => updateCap('per_minute', parseInt(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">Rate limit protection</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
