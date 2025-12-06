'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type {
  ActionResult,
  Achievement,
  UserAchievement,
  AchievementCategory,
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
// ACHIEVEMENT QUERIES
// ============================================

/**
 * Get all achievements (definitions)
 */
export async function getAllAchievements(): Promise<ActionResult<Achievement[]>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Achievement[] };
  } catch (e) {
    console.error('getAllAchievements error:', e);
    return { success: false, error: 'Failed to get achievements' };
  }
}

/**
 * Get user's achievements (unlocked and available)
 */
export async function getUserAchievements(
  userId?: string
): Promise<ActionResult<{
  unlocked: (UserAchievement & { achievement: Achievement })[];
  available: Achievement[];
  stats: {
    totalUnlocked: number;
    totalAvailable: number;
    totalPoints: number;
    byCategory: Record<AchievementCategory, { unlocked: number; total: number }>;
  };
}>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const targetUserId = userId || user.id;
    const adminClient = createAdminClient();

    // Get all active achievements
    const { data: allAchievements, error: achievementsError } = await adminClient
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (achievementsError) {
      return { success: false, error: achievementsError.message };
    }

    // Get user's unlocked achievements
    const { data: userAchievements, error: userError } = await adminClient
      .from('user_achievements')
      .select('*, achievement:achievements(*)')
      .eq('user_id', targetUserId)
      .order('earned_at', { ascending: false });

    if (userError) {
      return { success: false, error: userError.message };
    }

    const unlockedIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || []);

    // Filter available (not yet unlocked, and not secret unless unlocked)
    const available = (allAchievements || []).filter(
      (a) => !unlockedIds.has(a.id) && !a.is_secret
    );

    // Calculate stats by category
    const categories: AchievementCategory[] = ['milestone', 'streak', 'sales', 'special', 'team'];
    const byCategory: Record<AchievementCategory, { unlocked: number; total: number }> = {
      milestone: { unlocked: 0, total: 0 },
      streak: { unlocked: 0, total: 0 },
      sales: { unlocked: 0, total: 0 },
      special: { unlocked: 0, total: 0 },
      team: { unlocked: 0, total: 0 },
    };

    for (const achievement of allAchievements || []) {
      const cat = achievement.category as AchievementCategory;
      if (byCategory[cat]) {
        byCategory[cat].total++;
        if (unlockedIds.has(achievement.id)) {
          byCategory[cat].unlocked++;
        }
      }
    }

    // Calculate total points earned from achievements
    const totalPoints = (userAchievements || []).reduce(
      (sum, ua) => sum + (ua.achievement?.points_reward || 0),
      0
    );

    return {
      success: true,
      data: {
        unlocked: userAchievements as (UserAchievement & { achievement: Achievement })[],
        available,
        stats: {
          totalUnlocked: userAchievements?.length || 0,
          totalAvailable: allAchievements?.length || 0,
          totalPoints,
          byCategory,
        },
      },
    };
  } catch (e) {
    console.error('getUserAchievements error:', e);
    return { success: false, error: 'Failed to get user achievements' };
  }
}

/**
 * Get pending achievement notifications (unlocked but not yet seen)
 */
export async function getPendingAchievementNotifications(): Promise<
  ActionResult<(UserAchievement & { achievement: Achievement })[]>
> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('user_achievements')
      .select('*, achievement:achievements(*)')
      .eq('user_id', user.id)
      .eq('notified', false)
      .order('earned_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data as (UserAchievement & { achievement: Achievement })[],
    };
  } catch (e) {
    console.error('getPendingAchievementNotifications error:', e);
    return { success: false, error: 'Failed to get notifications' };
  }
}

/**
 * Mark an achievement notification as seen
 */
export async function markAchievementSeen(
  userAchievementId: string
): Promise<ActionResult<void>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('user_achievements')
      .update({ notified: true })
      .eq('id', userAchievementId)
      .eq('user_id', user.id); // Ensure user owns this achievement

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('markAchievementSeen error:', e);
    return { success: false, error: 'Failed to mark achievement as seen' };
  }
}

/**
 * Mark all pending achievement notifications as seen
 */
export async function markAllAchievementsSeen(): Promise<ActionResult<void>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('user_achievements')
      .update({ notified: true })
      .eq('user_id', user.id)
      .eq('notified', false);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('markAllAchievementsSeen error:', e);
    return { success: false, error: 'Failed to mark achievements as seen' };
  }
}

/**
 * Get achievement progress for a user (for progress bars)
 */
export async function getAchievementProgress(
  userId?: string
): Promise<ActionResult<{
  salesCount: number;
  streakDays: number;
  totalPoints: number;
}>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const targetUserId = userId || user.id;
    const adminClient = createAdminClient();

    // Get sales count
    const { count: salesCount } = await adminClient
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('salesperson_id', targetUserId)
      .neq('status', 'cancelled');

    // Get user points (includes streak)
    const { data: userPoints } = await adminClient
      .from('user_points')
      .select('total_points, streak_days')
      .eq('user_id', targetUserId)
      .single();

    return {
      success: true,
      data: {
        salesCount: salesCount || 0,
        streakDays: userPoints?.streak_days || 0,
        totalPoints: userPoints?.total_points || 0,
      },
    };
  } catch (e) {
    console.error('getAchievementProgress error:', e);
    return { success: false, error: 'Failed to get progress' };
  }
}
