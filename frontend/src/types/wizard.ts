
export type IntegrationType = 'ping_post' | 'full_post';
export type Environment = 'test' | 'live';
export type BuyerStatus = 'active' | 'paused' | 'inactive';
export type HttpMethod = 'GET' | 'POST';
export type AuthType = 'none' | 'basic' | 'header' | 'bearer';

export interface WizardBuyerBasic {
    name: string;
    company: string;
    vertical: string;
    environment: Environment;
    status: BuyerStatus;
}

export interface EndpointConfig {
    url: string;
    method: HttpMethod;
    auth_type: AuthType;
    // Auth Details
    username?: string;
    password?: string;
    header_name?: string;
    header_value?: string;
    token?: string;
}

export interface WizardEndpoints {
    ping?: EndpointConfig;
    post?: EndpointConfig;
    full?: EndpointConfig;
}

export interface WizardFieldMappingItem {
    internal: string;
    buyer: string;
    required: boolean;
    static_value?: string;
    send_in_ping: boolean;
    send_in_post: boolean;
}

export interface WizardResponseRule {
    path: string;
    operator: 'equals' | 'contains' | 'exists' | 'not_equals';
    value?: string;
}

export interface WizardResponseParser {
    success: WizardResponseRule;
    price_path?: string;
    lead_id_path?: string;
    redirect_url_path?: string;
    reason_path?: string;
    custom_fields: { key: string; path: string }[];
}

export interface WizardFilterRule {
    field: string;
    operator: '=' | '!=' | 'IN' | 'NOT IN' | 'STARTS_WITH';
    value: string;
}

export interface WizardCaps {
    daily?: number;
    hourly?: number;
    per_minute?: number;
}

export interface WizardFilterNode {
    type: 'rule' | 'group';
    // Rule fields
    field?: string;
    operator?: '=' | '!=' | 'IN' | 'NOT IN' | 'STARTS_WITH';
    value?: string;
    // Group fields
    conjunction?: 'AND' | 'OR';
    children?: WizardFilterNode[];
}

export interface WizardBuyerConfig {
    buyer: WizardBuyerBasic;
    integration_type: IntegrationType;
    endpoints: WizardEndpoints;
    field_mapping: WizardFieldMappingItem[]; // Array for easier UI handling, transform to object later
    response_parser: WizardResponseParser;
    context_extraction: { response_field: string; context_key: string }[];
    filters: WizardFilterRule[];
    filter_root?: WizardFilterNode;
    caps: WizardCaps;
}

export const INITIAL_WIZARD_STATE: WizardBuyerConfig = {
    buyer: {
        name: "",
        company: "",
        vertical: "Home Services",
        environment: "test",
        status: "active"
    },
    integration_type: "ping_post",
    endpoints: {
        ping: { url: "", method: "POST", auth_type: "none" },
        post: { url: "", method: "POST", auth_type: "none" }
    },
    field_mapping: [],
    response_parser: {
        success: { path: "status", operator: "equals", value: "success" },
        custom_fields: []
    },
    context_extraction: [],
    filters: [],
    filter_root: {
        type: 'group',
        conjunction: 'AND',
        children: []
    },
    caps: { daily: 0, hourly: 0 }
};
