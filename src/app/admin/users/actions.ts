'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { UserRole } from '@/lib/types';

// Get all users (bypasses RLS)
export async function getAllUsers() {
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
      return { error: 'Not authenticated', users: [] };
    }

    // Use admin client to get all users
    const adminClient = createAdminClient();

    // Check if current user is admin
    const { data: currentUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'Admin access required', users: [] };
    }

    const { data: users, error } = await adminClient
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { error: error.message, users: [] };
    }

    return { users: users || [] };
  } catch (e) {
    console.error('Error getting users:', e);
    return { error: 'Server error', users: [] };
  }
}

// Update user role (admin only)
export async function updateUserRole(userId: string, newRole: UserRole): Promise<{ success: boolean; error?: string }> {
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

    // Update the user's role
    const { error } = await adminClient
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('Error updating role:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('Error updating user role:', e);
    return { success: false, error: 'Server error' };
  }
}
