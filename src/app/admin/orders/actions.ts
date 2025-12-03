'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Delete an order (admin only)
export async function deleteOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    // Check if current user is admin
    const { data: currentUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Admin access required' };
    }

    // Delete the order
    const { error } = await adminClient
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('Error deleting order:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('Error deleting order:', e);
    return { success: false, error: 'Server error' };
  }
}

// Get all orders with salesperson info (admin only)
export async function getAllOrders() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Not authenticated', orders: [] };
    }

    const adminClient = createAdminClient();

    // Check if current user is admin
    const { data: currentUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'Admin access required', orders: [] };
    }

    // Get orders
    const { data: orders, error } = await adminClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { error: error.message, orders: [] };
    }

    // Get users for salesperson names
    const { data: users } = await adminClient.from('users').select('id, name');
    const userMap = new Map(users?.map(u => [u.id, u.name]) || []);

    const ordersWithNames = (orders || []).map(o => ({
      ...o,
      salesperson_name: userMap.get(o.salesperson_id) || 'Unknown',
    }));

    return { orders: ordersWithNames };
  } catch (e) {
    console.error('Error getting orders:', e);
    return { error: 'Server error', orders: [] };
  }
}
