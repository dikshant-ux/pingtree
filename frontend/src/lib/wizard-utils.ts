
import { Buyer, FieldMapping } from "@/types";
import { WizardBuyerConfig, WizardFieldMappingItem, INITIAL_WIZARD_STATE } from "@/types/wizard";

export function transformBackendToWizard(buyer: Buyer): WizardBuyerConfig {

    const mapToWizardField = (fm: FieldMapping, flags: { ping?: boolean, post?: boolean } = {}): WizardFieldMappingItem => ({
        internal: fm.internal_field,
        buyer: fm.buyer_field,
        static_value: fm.static_value,
        required: true,
        send_in_ping: flags.ping || false,
        send_in_post: flags.post || false
    });

    const allMappings: WizardFieldMappingItem[] = [];

    const tempMap = new Map<string, { item: WizardFieldMappingItem }>();
    const generateKey = (internal: string, buyer: string) => `${internal}|${buyer}`;

    const hasSpecificMappings = (buyer.ping_mapping?.length || 0) > 0 || (buyer.post_mapping?.length || 0) > 0;

    if (hasSpecificMappings) {
        // Ping Mappings -> Sent in Ping
        buyer.ping_mapping?.forEach(m => {
            const key = generateKey(m.internal_field, m.buyer_field);
            tempMap.set(key, {
                item: mapToWizardField(m, { ping: true, post: false })
            });
        });

        // Post Mappings -> Sent in Post
        buyer.post_mapping?.forEach(m => {
            const key = generateKey(m.internal_field, m.buyer_field);
            const existing = tempMap.get(key);

            if (existing) {
                // Also in Post
                existing.item.send_in_post = true;
            } else {
                // Only in Post
                tempMap.set(key, {
                    item: mapToWizardField(m, { ping: false, post: true })
                });
            }
        });

        tempMap.forEach(entry => allMappings.push(entry.item));

    } else if (buyer.field_mapping) {
        // Fallback: If no specific mappings, everything goes to BOTH (legacy default)
        allMappings.push(...buyer.field_mapping.map(m => mapToWizardField(m, { ping: true, post: true })));
    }

    // Auth Detection
    const detectAuth = (url: string | null | undefined): any => {
        // Simple default, as we don't store auth type explicitly in backend yet (mostly headers)
        // If we saved auth details in headers, try to reverse-engineer
        if (buyer.headers?.['Authorization']?.startsWith('Basic ')) {
            return { auth_type: 'basic', username: 'HIDDEN', password: 'HIDDEN' }; // Can't fully reverse without storing separate
        }
        if (buyer.headers?.['Authorization']?.startsWith('Bearer ')) {
            return { auth_type: 'bearer', token: 'HIDDEN' };
        }
        return { auth_type: 'none' };
    };

    const pingAuth = detectAuth(buyer.ping_url);
    const postAuth = detectAuth(buyer.post_url);

    return {
        buyer: {
            name: buyer.name,
            company: "", // Not in backend yet
            vertical: "Home Services",
            environment: "live", // Default
            status: buyer.status as any
        },
        integration_type: (buyer.type === 'redirect' ? 'full_post' : buyer.type) as any,
        endpoints: {
            ping: {
                url: buyer.ping_url,
                method: "POST",
                ...pingAuth
            },
            post: {
                url: buyer.post_url || "",
                method: "POST",
                ...postAuth
            },
            full: {
                url: (buyer.type === 'full_post' || buyer.type === 'redirect') ? (buyer.post_url || "") : (buyer.ping_url || ""),
                method: "POST",
                ...((buyer.type === 'full_post' || buyer.type === 'redirect') ? postAuth : pingAuth)
            }
        },
        field_mapping: allMappings,
        response_parser: {
            success: {
                path: buyer.response_parsing?.success_field || "status",
                operator: "equals",
                value: buyer.response_parsing?.success_value || "success"
            },
            price_path: buyer.response_parsing?.price_field,
            lead_id_path: buyer.response_parsing?.custom_fields?.['lead_id'],
            redirect_url_path: buyer.response_parsing?.redirect_url_field,
            reason_path: buyer.response_parsing?.reason_field,
            custom_fields: buyer.response_parsing?.custom_fields
                ? Object.entries(buyer.response_parsing.custom_fields).map(([key, path]) => ({ key, path: path as string }))
                : []
        },
        context_extraction: buyer.context_extraction?.map(ce => ({
            response_field: ce.response_field,
            context_key: ce.context_key
        })) || [],
        filters: [], // No longer used as primary, but kept for interface compatibility
        filter_root: buyer.filters.filter_root || (buyer.filters.rules?.length ? {
            type: 'group',
            conjunction: 'AND',
            children: buyer.filters.rules.map(r => ({
                type: 'rule',
                field: r.field,
                operator: r.operator as any,
                value: r.value
            }))
        } : {
            type: 'group',
            conjunction: 'AND',
            children: [
                ...(buyer.filters.states?.map(s => ({ type: 'rule', field: 'state', operator: 'IN', value: s } as any)) || []),
                ...(buyer.filters.zip_codes?.map(z => ({ type: 'rule', field: 'zip', operator: 'IN', value: z } as any)) || [])
            ]
        }),
        caps: {
            daily: buyer.caps.daily_cap,
            hourly: buyer.caps.hourly_cap,
            per_minute: buyer.caps.throttle_per_minute || 0
        }
    };
}
