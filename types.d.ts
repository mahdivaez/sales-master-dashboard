export interface WhopPayment {
  id: string;
  status: string;
  substatus: string;
  refundable: boolean;
  retryable: boolean;
  voidable: boolean;
  created_at: string;
  paid_at: string;
  last_payment_attempt: string;
  next_payment_attempt: string;
  dispute_alerted_at: string;
  refunded_at: string;
  plan: {
    id: string;
  };
  product: {
    id: string;
    title: string;
    route: string;
  };
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
  membership: {
    id: string;
    status: string;
  };
  member: {
    id: string;
    phone: string;
  };
  payment_method: {
    id: string;
    created_at: string;
    payment_method_type: string;
    card?: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    };
  };
  company: {
    id: string;
    title: string;
    route: string;
  };
  promo_code?: {
    id: string;
    code: string;
    amount_off: number;
    base_currency: string;
    promo_type: string;
    number_of_intervals: number;
  };
  currency: string;
  total: number;
  subtotal: number;
  usd_total: number;
  refunded_amount: number;
  auto_refunded: boolean;
  amount_after_fees: number;
  card_brand: string;
  card_last4: string;
  billing_address: {
    name: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  payment_method_type: string;
  billing_reason: string;
  payments_failed: number;
  failure_message: string;
  metadata: Record<string, any>;
}

export interface WhopMember {
  id: string;
  created_at: string;
  updated_at: string;
  joined_at: string;
  access_level: string;
  status: string;
  most_recent_action: string;
  most_recent_action_at: string;
  user: {
    id: string;
    email: string;
    name: string;
    username: string;
  };
  phone: string;
  usd_total_spent: number;
  company_token_balance: number;
}

export interface WhopMembersResponse {
  data: WhopMember[];
  page_info: {
    end_cursor: string;
    start_cursor: string;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

export interface WhopMembership {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  manage_url: string;
  member: {
    id: string;
  };
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
  };
  renewal_period_start: string;
  renewal_period_end: string;
  cancel_at_period_end: boolean;
  cancel_option?: string;
  cancellation_reason?: string;
  canceled_at?: string;
  currency: string;
  company: {
    id: string;
    title: string;
  };
  plan: {
    id: string;
  };
  promo_code?: {
    id: string;
  };
  product: {
    id: string;
    title: string;
  };
  license_key: string;
  metadata: Record<string, any>;
  payment_collection_paused: boolean;
}

export interface WhopMembershipsResponse {
  data: WhopMembership[];
  page_info: {
    end_cursor: string;
    start_cursor: string;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

export interface WhopPaymentsResponse {
  data: WhopPayment[];
  page_info: {
    end_cursor: string;
    start_cursor: string;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

export interface UnifiedUser {
  id: string;
  email: string;
  name: string;
  username: string;
  memberships: WhopMembership[];
  payments: WhopPayment[];
  totalSpent: number;
  totalSpentBeforeFees: number;
  pipelineData?: PipelineStageData[];
}

export interface PipelineStageData {
  date: string;
  name: string;
  email: string;
  stage: string;
  status: string;
  closer: string;
  pipelineName: string;
}

export interface DashboardData {
  users: UnifiedUser[];
  totalRevenue: number;
  totalRevenueBeforeFees: number;
  activeMemberships: number;
  totalUsers: number;
  arpu: number;
  revenueTrend: { date: string; amount: number; amountBeforeFees: number }[];
}
