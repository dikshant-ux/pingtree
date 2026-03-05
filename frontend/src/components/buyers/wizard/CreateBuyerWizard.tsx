
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { INITIAL_WIZARD_STATE, WizardBuyerConfig } from "@/types/wizard";
import WizardStepLayout from "./WizardStepLayout";
import Step1_BasicInfo from "./steps/Step1_BasicInfo";
import Step2_IntegrationType from "./steps/Step2_IntegrationType";
import Step3_Endpoints from "./steps/Step3_Endpoints";
import Step4_Mapping from "./steps/Step4_Mapping";
import Step5_ResponseParser from "./steps/Step5_ResponseParser";
import Step6_FiltersCaps from "./steps/Step6_FiltersCaps";
import Step7_TestConsole from "./steps/Step7_TestConsole";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

const STEPS = [
    { title: "Buyer Identification", description: "Basic details about the buyer entity." },
    { title: "Integration Method", description: "Choose the integration pattern." }, // Merged into Step 1 visually but kept as logic flow
    { title: "Endpoint Configuration", description: "Configure API endpoints and authentication." },
    { title: "Field Mapping", description: "Map your internal fields to buyer parameters." },
    { title: "Response Parsing", description: "Define how to interpret buyer responses." },
    { title: "Filters & Caps", description: "Set targeting rules and volume limits." },
    { title: "Simulation & Test", description: "Verify configuration before activation." },
];

import { transformBackendToWizard } from "@/lib/wizard-utils";
import { Buyer } from "@/types";

// ...

interface CreateBuyerWizardProps {
    initialData?: Buyer;
    isEditing?: boolean;
}

export default function CreateBuyerWizard({ initialData, isEditing = false }: CreateBuyerWizardProps) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [data, setData] = useState<WizardBuyerConfig>(() => {
        if (initialData) {
            return transformBackendToWizard(initialData);
        }
        return INITIAL_WIZARD_STATE;
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateData = (updates: Partial<WizardBuyerConfig>) => {
        setData(prev => ({ ...prev, ...updates }));
    };

    const handleNext = () => {
        if (step < STEPS.length) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const transformToBackendModel = (config: WizardBuyerConfig) => {
        // Transform Wizard Config -> Backend Buyer Model
        const isFullPost = config.integration_type === 'full_post';
        const pingUrl = isFullPost ? null : (config.endpoints.ping?.url || config.endpoints.full?.url);
        const postUrl = isFullPost ? (config.endpoints.full?.url || config.endpoints.post?.url) : config.endpoints.post?.url;

        // Headers construction
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
        processAuth(config.endpoints.ping || config.endpoints.full);
        if (config.endpoints.post) processAuth(config.endpoints.post);

        // Mapping construction
        const mapField = (m: any) => ({
            internal_field: m.internal,
            buyer_field: m.buyer,
            static_value: m.static_value || null
        });

        return {
            name: config.buyer.name,
            type: config.integration_type,
            ping_url: pingUrl,
            post_url: postUrl,
            headers: headers,
            status: config.buyer.status,
            timeout_ms: config.buyer.timeout_ms || 1000,
            filters: {
                filter_root: config.filter_root
            },
            caps: {
                daily_cap: config.caps.daily || 0,
                hourly_cap: config.caps.hourly || 0,
                throttle_per_minute: config.caps.per_minute || 0
            },
            field_mapping: config.field_mapping.map(mapField), // Shared/Legacy
            ping_mapping: config.field_mapping.filter(m => m.send_in_ping).map(mapField),
            post_mapping: config.field_mapping.filter(m => m.send_in_post).map(mapField),
            response_parsing: {
                success_field: config.response_parser.success.path,
                success_value: config.response_parser.success.value,
                price_field: config.response_parser.price_path,
                redirect_url_field: config.response_parser.redirect_url_path,
                custom_fields: config.response_parser.custom_fields.reduce((acc, curr) => {
                    if (curr.key && curr.path) acc[curr.key] = curr.path;
                    return acc;
                }, {
                    ...(config.response_parser.lead_id_path ? { "lead_id": config.response_parser.lead_id_path } : {})
                } as Record<string, string>),
                reason_field: config.response_parser.reason_path
            },
            context_extraction: config.context_extraction.map(ce => ({
                response_field: ce.response_field,
                context_key: ce.context_key
            }))
        };
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload = transformToBackendModel(data);
            if (isEditing && initialData?._id) {
                await api.put(`/buyers/${initialData._id}`, payload);
                toast.success("Buyer Updated Successfully");
            } else {
                await api.post('/buyers/', payload);
                toast.success("Buyer Created Successfully");
            }
            router.push('/dashboard/buyers');
        } catch (error: any) {
            console.error(error);
            const detail = error.response?.data?.detail;
            const message = Array.isArray(detail)
                ? detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join(', ')
                : (typeof detail === 'string' ? detail : "Unknown Error");

            toast.error(`Error: ${message}`);
        } finally {
            setIsSubmitting(false);
        }
    };



    const activeStepComponent = () => {
        if (step === 1) return <Step1_BasicInfo data={data} updateData={updateData} />;
        if (step === 2) return <Step2_IntegrationType data={data} updateData={updateData} />;
        if (step === 3) return <Step3_Endpoints data={data} updateData={updateData} />;
        if (step === 4) return <Step4_Mapping data={data} updateData={updateData} />;
        if (step === 5) return <Step5_ResponseParser data={data} updateData={updateData} />;
        if (step === 6) return <Step6_FiltersCaps data={data} updateData={updateData} />;
        if (step === 7) return <Step7_TestConsole data={data} updateData={updateData} />;
    };

    return (
        <div className="p-6 h-full">
            <WizardStepLayout
                title={STEPS[step - 1]?.title}
                description={STEPS[step - 1]?.description}
                state={data}
                step={step}
                totalSteps={7}
            >
                {activeStepComponent()}

                <div className="flex justify-between pt-8 mt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={step === 1}
                    >
                        Previous
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className={step === 7 ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                        {step === 7 ? (isSubmitting ? "Saving..." : (isEditing ? "Update Order" : "Activate Order")) : "Next Step"}
                    </Button>
                </div>
            </WizardStepLayout>
        </div>
    );
}
