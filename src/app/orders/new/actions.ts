'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { OrderFormData, PricingTier } from '@/lib/types';

// Extended type that includes computed pricing fields
interface CreateOrderData extends OrderFormData {
  pricing_tier: PricingTier;
  monthly_price: number;
}

export async function createOrder(data: CreateOrderData): Promise<{ success: boolean; error?: string }> {
  try {
    // Authenticate user server-side
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
      return { error: `Authentication error: ${authError.message}`, success: false };
    }

    if (!user) {
      return { error: 'You must be logged in to create an order', success: false };
    }

    // Use admin client to bypass RLS
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (e) {
      console.error('Admin client creation error:', e);
      return { error: 'Server configuration error. Please contact support.', success: false };
    }

    // Get commission rate for this plan type
    const { data: commissionRate } = await adminClient
      .from('commission_rates')
      .select('amount')
      .eq('plan_type', data.plan_type)
      .single();

    const commissionAmount = commissionRate?.amount || 0;

    // Insert the order
    const { data: insertedOrder, error } = await adminClient.from('orders').insert({
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email || null,
      service_address: data.service_address,
      city: data.city,
      state: data.state || 'TX',
      zip: data.zip,
      plan_type: data.plan_type,
      pricing_tier: data.pricing_tier,
      monthly_price: data.monthly_price,
      install_date: data.install_date,
      install_time_slot: data.install_time_slot,
      access_notes: data.access_notes || null,
      promo_code: data.promo_code || null,
      salesperson_id: user.id,
      status: 'new',
      commission_amount: commissionAmount,
      commission_paid: false,
    }).select();

    if (error) {
      console.error('Order creation error:', error);
      return { error: `Failed to create order: ${error.message}`, success: false };
    }

    console.log('Order created successfully:', insertedOrder);
    return { success: true };
  } catch (e) {
    console.error('Unexpected error in createOrder:', e);
    return { error: 'An unexpected error occurred. Please try again.', success: false };
  }
}
