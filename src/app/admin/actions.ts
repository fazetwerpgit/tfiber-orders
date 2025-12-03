'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function checkAdminStatus(): Promise<{
  isAdmin: boolean;
  error?: string;
  userEmail?: string;
  userRole?: string;
}> {
  try {
    // Get authenticated user
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { isAdmin: false, error: 'Not authenticated' };
    }

    // Use admin client to bypass RLS and check role
    const adminClient = createAdminClient();

    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return {
        isAdmin: false,
        error: `Could not load profile: ${profileError.message}`,
        userEmail: user.email
      };
    }

    if (!profile) {
      return {
        isAdmin: false,
        error: 'User profile not found. Please sign out and sign in again.',
        userEmail: user.email
      };
    }

    return {
      isAdmin: profile.role === 'admin',
      userEmail: profile.email,
      userRole: profile.role,
      error: profile.role !== 'admin'
        ? `Access denied. Your role is "${profile.role}". Admin access required.`
        : undefined
    };
  } catch (e) {
    console.error('Admin check error:', e);
    return { isAdmin: false, error: 'Server error checking admin status' };
  }
}
