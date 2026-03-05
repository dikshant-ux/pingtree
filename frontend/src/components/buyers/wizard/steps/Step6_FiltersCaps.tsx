import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WizardBuyerConfig, WizardFilterNode } from "@/types/wizard";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GitPullRequest, ListFilter, Share2 } from "lucide-react";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface Step6Props {
    data: WizardBuyerConfig;
    updateData: (updates: Partial<WizardBuyerConfig>) => void;
}

export default function Step6_FiltersCaps({ data, updateData }: Step6Props) {
    const caps = data.caps || { daily: 0, hourly: 0, per_minute: 0 };
    const filterRoot = data.filter_root || { type: 'group', conjunction: 'AND', children: [] };

    const [availableFields, setAvailableFields] = useState<string[]>([
        "First_Name", "Last_Name", "Email", "Phone", "Address", "Zip",
        "Dob", "Gender", "Ip_Address", "User_Agent", "click_id",
        "city", "state", "fullState",
        "loanAmount", "loanPurpose", "source_url", "source_domain"
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

    const updateFilterRoot = (newRoot: WizardFilterNode) => {
        updateData({ filter_root: newRoot });
    };

    const updateCap = (field: keyof typeof caps, value: number) => {
        updateData({
            caps: {
                ...caps,
                [field]: value
            }
        });
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ListFilter className="w-5 h-5 text-blue-500" />
                        Targeting Logic (Query Builder)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                        <FilterNodeComponent
                            node={filterRoot}
                            onUpdate={updateFilterRoot}
                            availableFields={availableFields}
                            isRoot
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-green-500" />
                        Volume Caps & Throttling
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label>Daily Cap</Label>
                            <Input
                                type="number"
                                min="0"
                                value={caps.daily}
                                onChange={(e) => updateCap('daily', parseInt(e.target.value) || 0)}
                            />
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">0 = Unlimited</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Hourly Cap</Label>
                            <Input
                                type="number"
                                min="0"
                                value={caps.hourly}
                                onChange={(e) => updateCap('hourly', parseInt(e.target.value) || 0)}
                            />
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">0 = Unlimited</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Per Minute Throttle</Label>
                            <Input
                                type="number"
                                min="0"
                                value={caps.per_minute}
                                onChange={(e) => updateCap('per_minute', parseInt(e.target.value) || 0)}
                            />
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Rate limit protection</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function FilterNodeComponent({
    node,
    onUpdate,
    onDelete,
    availableFields,
    isRoot = false
}: {
    node: WizardFilterNode;
    onUpdate: (node: WizardFilterNode) => void;
    onDelete?: () => void;
    availableFields: string[];
    isRoot?: boolean;
}) {

    if (node.type === 'rule') {
        const selectClass = "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

        return (
            <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 shadow-sm animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="flex-1">
                    <Input
                        className="h-9 text-xs"
                        value={node.field || ''}
                        onChange={(e) => onUpdate({ ...node, field: e.target.value })}
                        placeholder="Field (e.g. state)"
                        list="fields-list-wizard"
                    />
                </div>
                <div className="w-32">
                    <select
                        className={selectClass}
                        value={node.operator || '='}
                        onChange={(e) => onUpdate({ ...node, operator: e.target.value as any })}
                    >
                        <option value="=">Equals (=)</option>
                        <option value="!=">Not Equals (!=)</option>
                        <option value="IN">In List (IN)</option>
                        <option value="NOT IN">Not In List</option>
                        <option value="STARTS_WITH">Starts With</option>
                    </select>
                </div>
                <div className="flex-1">
                    <Input
                        className="h-9 text-xs"
                        value={node.value || ''}
                        onChange={(e) => onUpdate({ ...node, value: e.target.value })}
                        placeholder="Value (e.g. CA, TX)"
                    />
                </div>
                {!isRoot && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDelete}
                        className="h-8 w-8 text-slate-400 hover:text-red-500"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}

                <datalist id="fields-list-wizard">
                    {availableFields.map(f => (
                        <option key={f} value={f} />
                    ))}
                </datalist>
            </div>
        );
    }

    // Group logic
    const addChildRule = () => {
        onUpdate({
            ...node,
            children: [...(node.children || []), { type: 'rule', field: '', operator: '=', value: '' }]
        });
    };

    const addChildGroup = () => {
        onUpdate({
            ...node,
            children: [...(node.children || []), { type: 'group', conjunction: 'AND', children: [] }]
        });
    };

    const updateChild = (index: number, childNode: WizardFilterNode) => {
        const newChildren = [...(node.children || [])];
        newChildren[index] = childNode;
        onUpdate({ ...node, children: newChildren });
    };

    const deleteChild = (index: number) => {
        const newChildren = (node.children || []).filter((_, i) => i !== index);
        onUpdate({ ...node, children: newChildren });
    };

    return (
        <div className={cn(
            "space-y-3 relative",
            !isRoot && "pl-6 border-l-2 border-slate-200 py-1"
        )}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "flex p-0.5 rounded-lg border border-slate-200 bg-white",
                        node.conjunction === 'OR' ? "bg-orange-50/30" : "bg-blue-50/30"
                    )}>
                        <Button
                            variant={node.conjunction === 'AND' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-7 px-3 text-[10px] uppercase font-bold"
                            onClick={() => onUpdate({ ...node, conjunction: 'AND' })}
                        >
                            AND
                        </Button>
                        <Button
                            variant={node.conjunction === 'OR' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-7 px-3 text-[10px] uppercase font-bold"
                            onClick={() => onUpdate({ ...node, conjunction: 'OR' })}
                        >
                            OR
                        </Button>
                    </div>
                    {isRoot && <span className="text-[10px] text-muted-foreground font-medium italic">Top-Level Group</span>}
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={addChildRule} variant="outline" size="sm" className="h-7 text-[10px] bg-white">
                        <Plus className="w-3 h-3 mr-1" /> Add Rule
                    </Button>
                    <Button onClick={addChildGroup} variant="outline" size="sm" className="h-7 text-[10px] bg-white">
                        <Plus className="w-3 h-3 mr-1" /> Add Group
                    </Button>
                    {!isRoot && (
                        <Button onClick={onDelete} variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500">
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {(!node.children || node.children.length === 0) ? (
                    <div className="text-[11px] text-slate-400 py-4 px-8 border border-dashed border-slate-200 rounded-lg text-center bg-white/50">
                        This group is empty. Add rules or sub-groups.
                    </div>
                ) : (
                    node.children.map((child, i) => (
                        <div key={i} className="relative">
                            <FilterNodeComponent
                                node={child}
                                onUpdate={(updated) => updateChild(i, updated)}
                                onDelete={() => deleteChild(i)}
                                availableFields={availableFields}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
