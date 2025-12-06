'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { Order } from '@/lib/types';

export async function getMyOrders(): Promise<{ data: Order[] | null; error: string | null }> {
  const supabase = await createServerSupabaseClient();

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: 'Not authenticated' };
  }

  // Fetch only orders belonging to this user
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('salesperson_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
