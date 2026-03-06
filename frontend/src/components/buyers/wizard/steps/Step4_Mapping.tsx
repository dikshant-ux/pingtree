
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { WizardBuyerConfig, WizardFieldMappingItem } from "@/types/wizard";
import { Plus, Trash2, Wand2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Step4Props {
    data: WizardBuyerConfig;
    updateData: (updates: Partial<WizardBuyerConfig>) => void;
}

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function Step4_Mapping({ data, updateData }: Step4Props) {
    const mappings = data.field_mapping || [];
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
        "driversLicenseNumber",
        "xxTrustedFormCertUrl", "xxTrustedFormToken", "xxTrustedFormPingUrl",
        "source_url", "source_domain", "trusted_form_url", "trusted_form_token"
    ]);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [jsonInput, setJsonInput] = useState("");
    const [previewMappings, setPreviewMappings] = useState<WizardFieldMappingItem[]>([]);

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
            "First_Name", "Last_Name", "Email", "Phone", "Address", "Zip",
            "Dob", "Gender", "Ip_Address", "User_Agent", "click_id",
            "city", "state", "fullState",
            "gclid", "fbp", "fbc", "utm_source", "utm_medium", "utm_campaign",
            "utm_term", "utm_content", "eventid", "unique_id", "subsource", "source",
            "loanAmount", "loanPurpose", "dob_mm", "dob_dd", "dob_yyyy", "SSN",
            "payFrequency", "nextPayDate", "bankAccountType", "incomeMethod", "incomeType",
            "isMilitary", "Employer", "incomeNetMonthly", "debtAssistance", "creditRating",
            "ownVehicle", "bankName", "bankState", "routingNumber", "accountNumber",
            "driversLicenseNumber",
            "xxTrustedFormCertUrl", "xxTrustedFormToken", "xxTrustedFormPingUrl",
            "source_url", "source_domain", "trusted_form_url", "trusted_form_token"
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

    const analyzeJson = () => {
        if (!jsonInput.trim()) {
            toast.error("Please paste a JSON payload first");
            return;
        }

        try {
            const parsed = JSON.parse(jsonInput);
            const keys = Object.keys(parsed);

            if (keys.length === 0) {
                toast.error("JSON payload is empty");
                return;
            }

            const existingBuyerFields = new Set(mappings.map(m => m.buyer.toLowerCase()));
            const detected: WizardFieldMappingItem[] = [];

            keys.forEach(key => {
                if (existingBuyerFields.has(key.toLowerCase())) return;

                // Heuristic matching
                let internalField = "";
                const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');

                for (const f of availableFields) {
                    const cleanF = f.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const aliases: Record<string, string[]> = {
                        "First_Name": ["fname", "firstname", "first"],
                        "Last_Name": ["lname", "lastname", "last"],
                        "Zip": ["zipcode", "postal", "postalcode"],
                        "Dob": ["dateofbirth", "birthdate"],
                        "Phone": ["phonenumber", "cell", "mobile"],
                    };

                    const isAliasMatch = aliases[f]?.some(alias => cleanKey.includes(alias));

                    if (cleanKey === cleanF || isAliasMatch) {
                        internalField = f;
                        break;
                    }
                }

                detected.push({
                    internal: internalField,
                    buyer: key,
                    required: true,
                    send_in_ping: true,
                    send_in_post: true
                });
            });

            if (detected.length === 0) {
                toast.info("All fields in JSON are already mapped");
                return;
            }

            setPreviewMappings(detected);
            toast.success(`Analyzed ${keys.length} keys, found ${detected.length} new fields`);

        } catch (e) {
            toast.error("Invalid JSON format");
        }
    };

    const updatePreviewMapping = (index: number, field: keyof WizardFieldMappingItem, value: any) => {
        const newPreview = [...previewMappings];
        newPreview[index] = { ...newPreview[index], [field]: value };
        setPreviewMappings(newPreview);
    };

    const applySmartMappings = () => {
        const newMappings = [...mappings, ...previewMappings];
        updateData({ field_mapping: newMappings });
        setIsSheetOpen(false);
        setJsonInput("");
        setPreviewMappings([]);
        toast.success(`Applied ${previewMappings.length} mappings`);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-2">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                            <Wand2 className="w-4 h-4 mr-2" /> Smart Mapping
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-2xl overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>Smart JSON Mapping</SheetTitle>
                            <SheetDescription>
                                {previewMappings.length > 0
                                    ? "Review and adjust the detected mappings before applying them."
                                    : "Paste a sample JSON payload from your buyer to automatically detect fields."}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="mt-6 space-y-6">
                            {previewMappings.length === 0 ? (
                                <>
                                    <div className="space-y-2">
                                        <Label>JSON Payload</Label>
                                        <Textarea
                                            placeholder='{ "first_name": "John", "zip": "12345" }'
                                            className="h-80 font-mono text-xs"
                                            value={jsonInput}
                                            onChange={(e) => setJsonInput(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={analyzeJson} className="w-full">
                                        Analyze JSON
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-muted-foreground uppercase px-2">
                                            <div>Buyer Key</div>
                                            <div>Mapped Internal Field</div>
                                        </div>
                                        <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2">
                                            {previewMappings.map((item, idx) => (
                                                <div key={idx} className="grid grid-cols-2 gap-4 items-center bg-muted/30 p-2 rounded border">
                                                    <div className="text-sm font-mono text-blue-600 truncate" title={item.buyer}>
                                                        {item.buyer}
                                                    </div>
                                                    <div>
                                                        <Input
                                                            list={`preview-fields-${idx}`}
                                                            value={item.internal}
                                                            onChange={(e) => updatePreviewMapping(idx, "internal", e.target.value)}
                                                            placeholder="Select Field"
                                                            className="h-8 text-sm bg-background"
                                                        />
                                                        <datalist id={`preview-fields-${idx}`}>
                                                            {availableFields.map(f => <option key={f} value={f} />)}
                                                        </datalist>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button variant="outline" className="flex-1" onClick={() => setPreviewMappings([])}>
                                            Back to Input
                                        </Button>
                                        <Button className="flex-1" onClick={applySmartMappings}>
                                            Apply {previewMappings.length} Mappings
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>

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
