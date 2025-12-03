// T-Mobile Fiber Plans
export type PlanType = 'fiber_500' | 'fiber_1gig' | 'fiber_2gig' | 'founders_club';

export type PricingTier = 'voice_autopay' | 'autopay_only' | 'no_discounts';

export type TimeSlot = '8-10' | '10-12' | '12-3' | '3-5';

export type OrderStatus = 'new' | 'scheduled' | 'installed' | 'completed' | 'cancelled';

export type UserRole = string; // Dynamic roles from database

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  color: string;
  permissions: Record<string, boolean>;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleCommissionRate {
  id: string;
  role_name: string;
  plan_type: PlanType;
  amount: number;
  created_at: string;
  updated_at: string;
}

// Plan pricing matrix
export const PLAN_PRICING: Record<PlanType, Record<PricingTier, number>> = {
  fiber_500: {
    voice_autopay: 60,
    autopay_only: 75,
    no_discounts: 80,
  },
  fiber_1gig: {
    voice_autopay: 75,
    autopay_only: 90,
    no_discounts: 95,
  },
  fiber_2gig: {
    voice_autopay: 90,
    autopay_only: 105,
    no_discounts: 110,
  },
  founders_club: {
    voice_autopay: 70,
    autopay_only: 70,
    no_discounts: 70,
  },
};

export const PLAN_NAMES: Record<PlanType, string> = {
  fiber_500: 'Fiber 500',
  fiber_1gig: 'Fiber 1 Gig',
  fiber_2gig: 'Fiber 2 Gig',
  founders_club: 'Founders Club',
};

export const PLAN_SPEEDS: Record<PlanType, string> = {
  fiber_500: '500 Mbps',
  fiber_1gig: '1 Gbps',
  fiber_2gig: '2 Gbps',
  founders_club: '2 Gbps',
};

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  '8-10': '8-10 AM',
  '10-12': '10-12 PM',
  '12-3': '12-3 PM',
  '3-5': '3-5 PM',
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  service_address: string;
  city: string;
  state: string;
  zip: string;
  plan_type: PlanType;
  pricing_tier: PricingTier;
  monthly_price: number;
  install_date: string;
  install_time_slot: TimeSlot;
  access_notes: string;
  promo_code: string | null;
  salesperson_id: string;
  salesperson_name?: string;
  sale_location: string | null;
  status: OrderStatus;
  commission_amount: number | null;
  commission_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommissionRate {
  plan_type: PlanType;
  amount: number;
}

export interface OrderFormData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  service_address: string;
  city: string;
  state: string;
  zip: string;
  plan_type: PlanType;
  has_voice_line: boolean;
  has_autopay: boolean;
  install_date: string;
  install_time_slot: TimeSlot;
  access_notes: string;
  promo_code?: string;
}

// Helper to calculate pricing tier
export function getPricingTier(hasVoiceLine: boolean, hasAutopay: boolean): PricingTier {
  if (hasVoiceLine && hasAutopay) return 'voice_autopay';
  if (hasAutopay) return 'autopay_only';
  return 'no_discounts';
}

// Helper to calculate monthly price
export function calculatePrice(planType: PlanType, hasVoiceLine: boolean, hasAutopay: boolean): number {
  const tier = getPricingTier(hasVoiceLine, hasAutopay);
  return PLAN_PRICING[planType][tier];
}
