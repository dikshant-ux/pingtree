

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface WizardStepLayoutProps {
    title: string;
    description: string;
    children: React.ReactNode;
    state: any; // The full wizard state for preview
    step: number;
    totalSteps: number;
}

export default function WizardStepLayout({
    title,
    description,
    children,
    state,
    step,
    totalSteps
}: WizardStepLayoutProps) {
    return (
        <div className="min-h-full pb-10">
            {/* Main Content Area */}
            <div className="flex flex-col h-full max-w-5xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <span className="font-medium text-primary">Step {step}</span>
                        <span className="mx-2">/</span>
                        <span>{totalSteps}</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
                    <p className="text-muted-foreground mt-2 text-lg">{description}</p>
                </div>

                <div className="pb-10">
                    {children}
                </div>
            </div>
        </div>
    );
}
