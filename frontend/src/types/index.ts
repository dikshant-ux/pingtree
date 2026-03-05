export interface User {
  email: string;
  role: string;
  is_active: boolean;
}

export interface Buyer {
  _id: string;
  name: string;
  type: 'ping_post' | 'full_post' | 'redirect';
  ping_url?: string | null;
  post_url?: string;
  payout: number;
  priority: number;
  timeout_ms: number;
  status: 'active' | 'inactive' | 'paused';
  filters: {
    states: string[];
    zip_codes: string[];
    min_age?: number;
    max_age?: number;
    rules?: { field: string; operator: string; value: any }[];
    filter_root?: any; // Generic for now or import WizardFilterNode
    custom_conditions?: Record<string, any>;
  };
  caps: {
    daily_cap: number;
    hourly_cap: number;
    total_cap?: number;
    throttle_per_minute?: number;
  };
  headers?: Record<string, string>; // New: Custom Headers

  field_mapping: FieldMapping[]; // Legacy / Shared
  ping_mapping?: FieldMapping[]; // New: Partial Data
  post_mapping?: FieldMapping[]; // New: Full Data

  context_extraction?: {
    response_field: string;
    context_key: string;
  }[];

  response_parsing?: {
    success_field: string;
    success_value: string;
    price_field?: string;
    redirect_url_field?: string;
    reason_field?: string;
    custom_fields?: Record<string, string>;
  };
  tier?: number;
  scoring_weights?: {
    price: number;
    speed: number;
    accept_rate: number;
    priority: number;
  };
  capabilities?: {
    supports_fallback: boolean;
    supports_reping: boolean;
    max_ping_age_seconds: number;
    requires_exclusive: boolean;
  };
  performance_metrics?: Record<string, any>;
}

export interface FieldMapping {
  internal_field: string;
  buyer_field: string;
  static_value?: any; // New: Static Value support
}

export interface Lead {
  _id: string;
  lead_data: any;
  status: 'new' | 'processing' | 'sold' | 'rejected' | 'error';
  buyer_id?: string;
  sold_price: number;
  latency_ms: number;
  created_at: string;
}

export interface DashboardStats {
  total_leads: number;
  sold_leads: number;
  rejected_leads: number;
  total_revenue: number;
  conversion_rate: number;
}
