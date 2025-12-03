'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Role, RoleCommissionRate, PlanType } from '@/lib/types';

// Helper to verify admin access
async function verifyAdmin() {
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
    return { authorized: false, error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();
  const { data: currentUser } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!currentUser || currentUser.role !== 'admin') {
    return { authorized: false, error: 'Admin access required' };
  }

  return { authorized: true, adminClient };
}

// Get all roles
export async function getAllRoles(): Promise<{ roles: Role[]; error?: string }> {
  try {
    const adminClient = createAdminClient();

    const { data: roles, error } = await adminClient
      .from('roles')
      .select('*')
      .order('is_system', { ascending: false })
      .order('display_name', { ascending: true });

    if (error) {
      return { roles: [], error: error.message };
    }

    return { roles: roles || [] };
  } catch (e) {
    console.error('Error getting roles:', e);
    return { roles: [], error: 'Server error' };
  }
}

// Create a new role
export async function createRole(data: {
  name: string;
  display_name: string;
  description?: string;
  color?: string;
}): Promise<{ success: boolean; role?: Role; error?: string }> {
  try {
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    // Sanitize name to be lowercase with underscores
    const sanitizedName = data.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    const { data: role, error } = await auth.adminClient!
      .from('roles')
      .insert({
        name: sanitizedName,
        display_name: data.display_name,
        description: data.description || null,
        color: data.color || 'gray',
        is_system: false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A role with this name already exists' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, role };
  } catch (e) {
    console.error('Error creating role:', e);
    return { success: false, error: 'Server error' };
  }
}

// Update a role
export async function updateRole(
  roleId: string,
  data: {
    display_name?: string;
    description?: string;
    color?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const { error } = await auth.adminClient!
      .from('roles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roleId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('Error updating role:', e);
    return { success: false, error: 'Server error' };
  }
}

// Delete a role (only non-system roles)
export async function deleteRole(roleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    // Check if role is a system role
    const { data: role } = await auth.adminClient!
      .from('roles')
      .select('is_system, name')
      .eq('id', roleId)
      .single();

    if (role?.is_system) {
      return { success: false, error: 'Cannot delete system roles' };
    }

    // Check if any users have this role
    const { data: usersWithRole } = await auth.adminClient!
      .from('users')
      .select('id')
      .eq('role', role?.name)
      .limit(1);

    if (usersWithRole && usersWithRole.length > 0) {
      return { success: false, error: 'Cannot delete role that is assigned to users. Reassign users first.' };
    }

    // Delete the role
    const { error } = await auth.adminClient!
      .from('roles')
      .delete()
      .eq('id', roleId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('Error deleting role:', e);
    return { success: false, error: 'Server error' };
  }
}

// Get commission rates for a role
export async function getRoleCommissionRates(roleName: string): Promise<{ rates: RoleCommissionRate[]; error?: string }> {
  try {
    const adminClient = createAdminClient();

    const { data: rates, error } = await adminClient
      .from('role_commission_rates')
      .select('*')
      .eq('role_name', roleName)
      .order('plan_type', { ascending: true });

    if (error) {
      return { rates: [], error: error.message };
    }

    return { rates: rates || [] };
  } catch (e) {
    console.error('Error getting role commission rates:', e);
    return { rates: [], error: 'Server error' };
  }
}

// Get all commission rates for all roles
export async function getAllRoleCommissionRates(): Promise<{ rates: RoleCommissionRate[]; error?: string }> {
  try {
    const adminClient = createAdminClient();

    const { data: rates, error } = await adminClient
      .from('role_commission_rates')
      .select('*')
      .order('role_name', { ascending: true })
      .order('plan_type', { ascending: true });

    if (error) {
      return { rates: [], error: error.message };
    }

    return { rates: rates || [] };
  } catch (e) {
    console.error('Error getting all role commission rates:', e);
    return { rates: [], error: 'Server error' };
  }
}

// Update or create commission rate for a role
export async function updateRoleCommissionRate(
  roleName: string,
  planType: PlanType,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    // Upsert the commission rate
    const { error } = await auth.adminClient!
      .from('role_commission_rates')
      .upsert({
        role_name: roleName,
        plan_type: planType,
        amount: amount,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'role_name,plan_type',
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('Error updating role commission rate:', e);
    return { success: false, error: 'Server error' };
  }
}

// Initialize commission rates for a new role (copy from default rates)
export async function initializeRoleCommissionRates(roleName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    // Get default commission rates
    const { data: defaultRates } = await auth.adminClient!
      .from('commission_rates')
      .select('plan_type, amount');

    if (!defaultRates || defaultRates.length === 0) {
      return { success: false, error: 'No default commission rates found' };
    }

    // Create rates for the new role
    const newRates = defaultRates.map(rate => ({
      role_name: roleName,
      plan_type: rate.plan_type,
      amount: rate.amount,
    }));

    const { error } = await auth.adminClient!
      .from('role_commission_rates')
      .upsert(newRates, { onConflict: 'role_name,plan_type' });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('Error initializing role commission rates:', e);
    return { success: false, error: 'Server error' };
  }
}
