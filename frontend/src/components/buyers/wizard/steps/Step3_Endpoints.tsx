
import { WizardBuyerConfig, EndpointConfig } from "@/types/wizard";
import EndpointForm from "../EndpointForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

interface Step3Props {
    data: WizardBuyerConfig;
    updateData: (updates: Partial<WizardBuyerConfig>) => void;
}

export default function Step3_Endpoints({ data, updateData }: Step3Props) {

    const updateEndpoint = (type: 'ping' | 'post' | 'full', config: EndpointConfig) => {
        updateData({
            endpoints: {
                ...data.endpoints,
                [type]: config
            }
        });
    };

    if (data.integration_type === 'full_post') {
        return (
            <Card>
                <CardContent className="pt-6">
                    <EndpointForm
                        config={data.endpoints.full || { url: '', method: 'POST', auth_type: 'none' }}
                        onChange={(cfg) => updateEndpoint('full', cfg)}
                    />
                </CardContent>
            </Card>
        );
    }

    return (
        <Tabs defaultValue="ping" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="ping">Step A: Ping Endpoint</TabsTrigger>
                <TabsTrigger value="post">Step B: Post Endpoint</TabsTrigger>
            </TabsList>

            <TabsContent value="ping">
                <Card>
                    <CardContent className="pt-6">
                        <div className="mb-4 text-sm text-muted-foreground">
                            Configure the endpoint for the <strong>Ping (Bid)</strong> request. This request contains partial lead data to get a price.
                        </div>
                        <EndpointForm
                            config={data.endpoints.ping || { url: '', method: 'POST', auth_type: 'none' }}
                            onChange={(cfg) => updateEndpoint('ping', cfg)}
                        />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="post">
                <Card>
                    <CardContent className="pt-6">
                        <div className="mb-4 text-sm text-muted-foreground">
                            Configure the endpoint for the <strong>Post (Delivery)</strong> request. This request is sent <strong>only if the bid is won</strong>.
                        </div>
                        <EndpointForm
                            config={data.endpoints.post || { url: '', method: 'POST', auth_type: 'none' }}
                            onChange={(cfg) => updateEndpoint('post', cfg)}
                        />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
