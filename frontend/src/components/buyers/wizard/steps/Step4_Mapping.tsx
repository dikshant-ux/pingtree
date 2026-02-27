
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { WizardBuyerConfig, WizardFieldMappingItem } from "@/types/wizard";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Step4Props {
    data: WizardBuyerConfig;
    updateData: (updates: Partial<WizardBuyerConfig>) => void;
}

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function Step4_Mapping({ data, updateData }: Step4Props) {
    const mappings = data.field_mapping || [];
    const [availableFields, setAvailableFields] = useState<string[]>([
        "First_Name", "Last_Name", "Email", "Phone", "Address", "City", "State", "Zip",
        "Dob", "Gender", "Ip_Address", "User_Agent", "click_id",
        "loanAmount", "loanPurpose", "dob_mm", "dob_dd", "dob_yyyy", "SSN",
        "payFrequency", "nextPayDate", "bankAccountType", "incomeMethod", "incomeType",
        "isMilitary", "Employer", "incomeNetMonthly", "debtAssistance", "creditRating",
        "ownVehicle", "bankName", "bankState", "routingNumber", "accountNumber",
        "xxTrustedFormCertUrl", "xxTrustedFormToken", "xxTrustedFormPingUrl",
        "source_url", "source_domain", "trusted_form_url", "trusted_form_token", "ip"
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

    const updateMapping = (index: number, field: keyof WizardFieldMappingItem, value: any) => {
        const newMappings = [...mappings];
        newMappings[index] = { ...newMappings[index], [field]: value };
        updateData({ field_mapping: newMappings });
    };

    const addMapping = (internal: string = "") => {
        updateData({
            field_mapping: [
                ...mappings,
                { internal, buyer: "", required: true, send_in_ping: true, send_in_post: true }
            ]
        });
    };

    const removeMapping = (index: number) => {
        const newMappings = mappings.filter((_, i) => i !== index);
        updateData({ field_mapping: newMappings });
    };

    const autoMapFields = () => {
        const standardFields = [
            "First_Name", "Last_Name", "Email", "Phone", "Address", "City", "State", "Zip",
            "Dob", "Gender", "Ip_Address", "User_Agent", "click_id",
            "loanAmount", "loanPurpose", "dob_mm", "dob_dd", "dob_yyyy", "SSN",
            "payFrequency", "nextPayDate", "bankAccountType", "incomeMethod", "incomeType",
            "isMilitary", "Employer", "incomeNetMonthly", "debtAssistance", "creditRating",
            "ownVehicle", "bankName", "bankState", "routingNumber", "accountNumber",
            "xxTrustedFormCertUrl", "xxTrustedFormToken", "xxTrustedFormPingUrl",
            "source_url", "source_domain", "trusted_form_url", "trusted_form_token", "ip"
        ];

        const existingFields = new Set(mappings.map(m => m.internal));
        const newMappings = [...mappings];

        standardFields.forEach(field => {
            if (!existingFields.has(field)) {
                // Determine buyer field name (often just lowercase version)
                let buyerField = field.toLowerCase();

                // Special overrides for common mappings if needed
                if (field === "First_Name") buyerField = "first_name";
                if (field === "Last_Name") buyerField = "last_name";

                newMappings.push({
                    internal: field,
                    buyer: buyerField,
                    required: true,
                    send_in_ping: true,
                    send_in_post: true
                });
            }
        });

        updateData({ field_mapping: newMappings });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-2">
                <Button onClick={autoMapFields} variant="outline" size="sm" className="text-primary border-primary hover:bg-primary/5">
                    <Plus className="w-4 h-4 mr-2" /> Auto-Map All Fields
                </Button>
                <Button onClick={() => addMapping()} size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Field
                </Button>
            </div>

            <Card className="bg-muted/30">
                <CardContent className="p-4">
                    <div className="space-y-3">
                        {/* Header */}
                        <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                            <div className="col-span-3">PingTree Field</div>
                            <div className="col-span-1 text-center">→</div>
                            <div className="col-span-3">Buyer Param</div>
                            <div className="col-span-2">Static Val</div>
                            <div className="col-span-2 text-center">Inclusion</div>
                            <div className="col-span-1"></div>
                        </div>

                        {mappings.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 items-center bg-background p-2 rounded-md border shadow-sm group hover:border-primary/50 transition-colors">
                                {/* Internal Field */}
                                <div className="col-span-3">
                                    <Input
                                        list={`fields-${index}`}
                                        value={item.internal}
                                        onChange={(e) => updateMapping(index, "internal", e.target.value)}
                                        placeholder="Select Field"
                                        className="h-8 text-sm"
                                    />
                                    <datalist id={`fields-${index}`}>
                                        {availableFields.map(f => <option key={f} value={f} />)}
                                    </datalist>
                                </div>

                                {/* Arrow */}
                                <div className="col-span-1 flex justify-center text-muted-foreground">
                                    →
                                </div>

                                {/* Buyer Field */}
                                <div className="col-span-3">
                                    <Input
                                        value={item.buyer}
                                        onChange={(e) => updateMapping(index, "buyer", e.target.value)}
                                        placeholder="param_name"
                                        className="h-8 text-sm font-mono text-blue-600 bg-blue-50/50"
                                    />
                                </div>

                                {/* Static Value */}
                                <div className="col-span-2">
                                    <Input
                                        value={item.static_value || ""}
                                        onChange={(e) => updateMapping(index, "static_value", e.target.value)}
                                        placeholder="(Optional)"
                                        className="h-8 text-xs text-muted-foreground bg-muted/50"
                                    />
                                </div>

                                {/* Flags */}
                                <div className="col-span-2 flex justify-center gap-1">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`
                                                cursor-pointer px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all
                                                ${item.send_in_ping ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-muted text-muted-foreground border-transparent opacity-50 hover:opacity-100'}
                                            `}
                                            onClick={() => updateMapping(index, "send_in_ping", !item.send_in_ping)}
                                            title="Include in Ping Request"
                                        >
                                            PING
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`
                                                cursor-pointer px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all
                                                ${item.send_in_post ? 'bg-green-100 text-green-700 border-green-200' : 'bg-muted text-muted-foreground border-transparent opacity-50 hover:opacity-100'}
                                            `}
                                            onClick={() => updateMapping(index, "send_in_post", !item.send_in_post)}
                                            title="Include in Post Request"
                                        >
                                            POST
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 flex justify-end">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeMapping(index)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {mappings.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm italic border-2 border-dashed rounded-lg">
                                No mappings defined. Click "Add Field" to map data.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm flex gap-3 items-start border border-blue-100">
                <div className="mt-0.5">💡</div>
                <div>
                    <strong>Pro Tip:</strong> Use the <strong>PING</strong> tag for fields required for bidding (like Zip Code). Use the <strong>POST</strong> tag for PII (like Email) to ensure it's never sent during the bid phase.
                </div>
            </div>
        </div>
    );
}
