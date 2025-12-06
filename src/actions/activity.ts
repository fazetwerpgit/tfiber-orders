'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type {
  ActionResult,
  ActivityFeedEvent,
  ActivityEventType,
  ActivityFeedFilters,
} from '@/lib/types';

/**
 * Get authenticated user from cookies
 */
async function getAuthenticatedUser() {
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

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}

// ============================================
// ACTIVITY FEED ACTIONS
// ============================================

/**
 * Get activity feed events
 */
export async function getActivityFeed(
  filters?: ActivityFeedFilters
): Promise<ActionResult<ActivityFeedEvent[]>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();
    const limit = filters?.limit || 50;

    let query = adminClient
      .from('activity_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by global or user-specific
    if (filters?.global_only) {
      query = query.eq('is_global', true);
    } else if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    // Filter by event types
    if (filters?.event_types && filters.event_types.length > 0) {
      query = query.in('event_type', filters.event_types);
    }

    // Filter by time
    if (filters?.since) {
      query = query.gt('created_at', filters.since);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    // Get user names for the events
    const userIds = [...new Set((data || []).map((e) => e.user_id).filter(Boolean))];

    let userMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: users } = await adminClient
        .from('users')
        .select('id, name')
        .in('id', userIds);

      for (const u of users || []) {
        userMap[u.id] = u.name;
      }
    }

    // Attach user names to events
    const eventsWithNames = (data || []).map((event) => ({
      ...event,
      user_name: event.user_id ? userMap[event.user_id] || 'Unknown' : undefined,
    }));

    return { success: true, data: eventsWithNames as ActivityFeedEvent[] };
  } catch (e) {
    console.error('getActivityFeed error:', e);
    return { success: false, error: 'Failed to get activity feed' };
  }
}

/**
 * Get latest activity since a given timestamp (for polling)
 */
export async function getLatestActivity(
  since: string
): Promise<ActionResult<ActivityFeedEvent[]>> {
  return getActivityFeed({ since, limit: 20, global_only: true });
}

/**
 * Get activity feed for a specific user
 */
export async function getUserActivity(
  userId?: string,
  limit: number = 20
): Promise<ActionResult<ActivityFeedEvent[]>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const targetUserId = userId || user.id;

    return getActivityFeed({ user_id: targetUserId, limit });
  } catch (e) {
    console.error('getUserActivity error:', e);
    return { success: false, error: 'Failed to get user activity' };
  }
}

/**
 * Mark activity events as read
 */
export async function markActivityRead(
  eventIds: string[]
): Promise<ActionResult<void>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('activity_feed')
      .update({ is_read: true })
      .in('id', eventIds)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('markActivityRead error:', e);
    return { success: false, error: 'Failed to mark activity as read' };
  }
}

/**
 * Get unread activity count for current user
 */
export async function getUnreadActivityCount(): Promise<ActionResult<number>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    const { count, error } = await adminClient
      .from('activity_feed')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: count || 0 };
  } catch (e) {
    console.error('getUnreadActivityCount error:', e);
    return { success: false, error: 'Failed to get unread count' };
  }
}
