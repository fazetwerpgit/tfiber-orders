'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type {
  ActionResult,
  UserPoints,
  PointHistory,
  LeaderboardEntry,
  LeaderboardBadge,
  TimeRange,
  OrderGamificationResult,
  PointsCalculationResult,
  StreakUpdateResult,
  AchievementUnlockResult,
  RankChangeResult,
  DEFAULT_POINTS,
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
// POINTS ACTIONS
// ============================================

/**
 * Get user's current points and stats
 */
export async function getUserPoints(userId?: string): Promise<ActionResult<UserPoints>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const targetUserId = userId || user.id;
    const adminClient = createAdminClient();

    // Get or create user points record
    let { data, error } = await adminClient
      .from('user_points')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Record doesn't exist, create it
      const { data: newData, error: insertError } = await adminClient
        .from('user_points')
        .insert({
          user_id: targetUserId,
          total_points: 0,
          lifetime_points: 0,
          streak_days: 0,
        })
        .select()
        .single();

      if (insertError) {
        return { success: false, error: insertError.message };
      }
      data = newData;
    } else if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as UserPoints };
  } catch (e) {
    console.error('getUserPoints error:', e);
    return { success: false, error: 'Failed to get user points' };
  }
}

/**
 * Get point history for a user
 */
export async function getPointHistory(
  userId?: string,
  limit: number = 20
): Promise<ActionResult<PointHistory[]>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const targetUserId = userId || user.id;
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('point_history')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PointHistory[] };
  } catch (e) {
    console.error('getPointHistory error:', e);
    return { success: false, error: 'Failed to get point history' };
  }
}

// ============================================
// LEADERBOARD ACTIONS
// ============================================

/**
 * Get leaderboard entries for a given time range
 */
export async function getLeaderboard(
  timeRange: TimeRange = 'week',
  limit: number = 50
): Promise<ActionResult<LeaderboardEntry[]>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all-time':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Get points earned in the time range with user info
    const { data: pointsData, error: pointsError } = await adminClient
      .from('point_history')
      .select(`
        user_id,
        points
      `)
      .gte('created_at', startDate.toISOString());

    if (pointsError) {
      return { success: false, error: pointsError.message };
    }

    // Aggregate points by user
    const userPoints: Record<string, number> = {};
    for (const row of pointsData || []) {
      userPoints[row.user_id] = (userPoints[row.user_id] || 0) + row.points;
    }

    // Get user details and order counts
    const userIds = Object.keys(userPoints);
    if (userIds.length === 0) {
      return { success: true, data: [] };
    }

    const { data: usersData, error: usersError } = await adminClient
      .from('users')
      .select('id, name')
      .in('id', userIds);

    if (usersError) {
      return { success: false, error: usersError.message };
    }

    // Get order counts for the period
    const { data: ordersData, error: ordersError } = await adminClient
      .from('orders')
      .select('salesperson_id')
      .in('salesperson_id', userIds)
      .gte('created_at', startDate.toISOString())
      .neq('status', 'cancelled');

    if (ordersError) {
      return { success: false, error: ordersError.message };
    }

    // Count orders per user
    const orderCounts: Record<string, number> = {};
    for (const row of ordersData || []) {
      orderCounts[row.salesperson_id] = (orderCounts[row.salesperson_id] || 0) + 1;
    }

    // Get current streak info
    const { data: streakData, error: streakError } = await adminClient
      .from('user_points')
      .select('user_id, streak_days')
      .in('user_id', userIds);

    const streaks: Record<string, number> = {};
    for (const row of streakData || []) {
      streaks[row.user_id] = row.streak_days;
    }

    // Get previous rank for rank change calculation
    const { data: snapshotData } = await adminClient
      .from('leaderboard_snapshots')
      .select('user_id, rank')
      .in('user_id', userIds)
      .eq('period_type', timeRange === 'today' ? 'daily' : timeRange === 'week' ? 'weekly' : 'monthly')
      .order('snapshot_date', { ascending: false })
      .limit(userIds.length);

    const previousRanks: Record<string, number> = {};
    for (const row of snapshotData || []) {
      if (!previousRanks[row.user_id]) {
        previousRanks[row.user_id] = row.rank;
      }
    }

    // Get user badges (up to 3 most recent per user)
    const userBadges: Record<string, LeaderboardBadge[]> = {};
    try {
      const { data: badgesData } = await adminClient
        .from('user_achievements')
        .select(`
          user_id,
          achievement:achievements(id, icon, name)
        `)
        .in('user_id', userIds)
        .order('earned_at', { ascending: false });

      for (const row of badgesData || []) {
        if (!userBadges[row.user_id]) {
          userBadges[row.user_id] = [];
        }
        // Only keep first 3 badges per user
        if (userBadges[row.user_id].length < 3 && row.achievement) {
          // Handle both single object and array (depending on join type)
          const achievementData = Array.isArray(row.achievement)
            ? row.achievement[0]
            : row.achievement;

          if (achievementData && typeof achievementData === 'object') {
            const achievement = achievementData as { id: string; icon: string | null; name: string };
            userBadges[row.user_id].push({
              id: achievement.id,
              icon: achievement.icon,
              name: achievement.name,
            });
          }
        }
      }
    } catch (e) {
      // Badges table may not exist yet, continue without badges
      console.log('Could not fetch badges:', e);
    }

    // Build user map
    const userMap: Record<string, string> = {};
    for (const u of usersData || []) {
      userMap[u.id] = u.name;
    }

    // Build and sort leaderboard entries
    const entries: LeaderboardEntry[] = userIds
      .map((uid) => ({
        rank: 0, // Will be set after sorting
        user_id: uid,
        user_name: userMap[uid] || 'Unknown',
        total_points: userPoints[uid] || 0,
        order_count: orderCounts[uid] || 0,
        streak_days: streaks[uid] || 0,
        is_current_user: uid === user.id,
        rank_change: null as number | null,
        badges: userBadges[uid] || [],
      }))
      .filter((e) => e.total_points > 0)
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, limit);

    // Assign ranks and calculate changes
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
      const prevRank = previousRanks[entry.user_id];
      if (prevRank !== undefined) {
        entry.rank_change = prevRank - entry.rank; // Positive = moved up
      }
    });

    return { success: true, data: entries };
  } catch (e) {
    console.error('getLeaderboard error:', e);
    return { success: false, error: 'Failed to get leaderboard' };
  }
}

/**
 * Get current user's rank in the leaderboard
 */
export async function getCurrentUserRank(
  timeRange: TimeRange = 'week'
): Promise<ActionResult<{ rank: number; total: number; points: number }>> {
  try {
    const result = await getLeaderboard(timeRange, 1000);
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    const currentUserEntry = result.data.find((e) => e.is_current_user);
    if (!currentUserEntry) {
      return {
        success: true,
        data: { rank: 0, total: result.data.length, points: 0 },
      };
    }

    return {
      success: true,
      data: {
        rank: currentUserEntry.rank,
        total: result.data.length,
        points: currentUserEntry.total_points,
      },
    };
  } catch (e) {
    console.error('getCurrentUserRank error:', e);
    return { success: false, error: 'Failed to get rank' };
  }
}

// ============================================
// ORDER GAMIFICATION PROCESSING
// ============================================

/**
 * Process gamification side effects after order creation
 * This is called after an order is successfully created
 */
export async function processOrderForGamification(
  orderId: string
): Promise<ActionResult<OrderGamificationResult>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    // Get the order details
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return { success: false, error: 'Order not found' };
    }

    // Ensure the user owns this order
    if (order.salesperson_id !== user.id) {
      return { success: false, error: 'Not authorized' };
    }

    // Get point configuration
    const { data: pointConfigs } = await adminClient
      .from('point_configurations')
      .select('*');

    const configMap: Record<string, number> = {};
    for (const config of pointConfigs || []) {
      configMap[config.sale_type] = config.points;
    }

    // Calculate points
    const saleType = order.sale_type || 'standard';
    const basePoints = configMap[saleType] || 10;
    const addonPoints = (order.add_ons_count || 0) * (configMap['add_on'] || 5);
    const totalPoints = basePoints + addonPoints;

    const pointsResult: PointsCalculationResult = {
      totalPoints,
      breakdown: {
        saleType,
        basePoints,
        addonPoints,
      },
    };

    // Award points (the trigger should handle this, but we record in history)
    const { error: historyError } = await adminClient.from('point_history').insert({
      user_id: user.id,
      points: totalPoints,
      reason: 'sale',
      source_type: 'order',
      source_id: orderId,
      description: `Points for ${saleType} sale${addonPoints > 0 ? ` + ${order.add_ons_count} add-ons` : ''}`,
    });

    if (historyError) {
      console.error('Failed to record point history:', historyError);
    }

    // Update user points total
    const { data: existingPoints } = await adminClient
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const today = new Date().toISOString().split('T')[0];
    let streakDays = existingPoints?.streak_days || 0;
    let streakBroken = false;
    let milestoneReached: number | null = null;
    let bonusPoints = 0;

    if (existingPoints) {
      const lastActivity = existingPoints.last_activity_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActivity === today) {
        // Same day, streak continues
      } else if (lastActivity === yesterdayStr) {
        // Consecutive day, increment streak
        streakDays += 1;
      } else if (lastActivity) {
        // Streak broken, reset
        streakBroken = true;
        streakDays = 1;
      } else {
        // First activity
        streakDays = 1;
      }

      // Check for streak milestones (3, 7, 14, 21, 30, 60, 90 days)
      const milestones = [3, 7, 14, 21, 30, 60, 90];
      if (milestones.includes(streakDays) && !streakBroken) {
        milestoneReached = streakDays;

        // Get milestone bonus
        const { data: milestone } = await adminClient
          .from('streak_milestones')
          .select('bonus_points')
          .eq('days', streakDays)
          .single();

        bonusPoints = milestone?.bonus_points || 0;

        if (bonusPoints > 0) {
          // Award bonus points
          await adminClient.from('point_history').insert({
            user_id: user.id,
            points: bonusPoints,
            reason: 'streak_bonus',
            source_type: 'streak',
            description: `${streakDays}-day streak milestone bonus`,
          });
        }
      }

      // Update user points
      await adminClient
        .from('user_points')
        .update({
          total_points: (existingPoints.total_points || 0) + totalPoints + bonusPoints,
          lifetime_points: (existingPoints.lifetime_points || 0) + totalPoints + bonusPoints,
          streak_days: streakDays,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } else {
      // Create new user points record
      await adminClient.from('user_points').insert({
        user_id: user.id,
        total_points: totalPoints,
        lifetime_points: totalPoints,
        streak_days: 1,
        last_activity_date: today,
      });
      streakDays = 1;
    }

    const streakResult: StreakUpdateResult = {
      currentStreak: streakDays,
      longestStreak: Math.max(streakDays, existingPoints?.streak_days || 0),
      milestoneReached,
      bonusPoints,
      streakBroken,
    };

    // Check for achievements
    const achievements = await checkAndUnlockAchievements(user.id, adminClient);

    // Create activity feed event
    await adminClient.from('activity_feed').insert({
      user_id: user.id,
      event_type: 'new_sale',
      title: 'New Sale!',
      description: `Earned ${totalPoints} points for a ${saleType} sale`,
      metadata: {
        order_id: orderId,
        points: totalPoints,
        sale_type: saleType,
      },
      is_global: true,
    });

    return {
      success: true,
      data: {
        points: pointsResult,
        streak: streakResult,
        achievements,
        rankChange: null, // Could calculate this if needed
      },
    };
  } catch (e) {
    console.error('processOrderForGamification error:', e);
    return { success: false, error: 'Failed to process gamification' };
  }
}

/**
 * Check and unlock achievements for a user
 */
async function checkAndUnlockAchievements(
  userId: string,
  adminClient: ReturnType<typeof createAdminClient>
): Promise<AchievementUnlockResult[]> {
  const unlocked: AchievementUnlockResult[] = [];

  try {
    // Get all active achievements not yet unlocked by user
    const { data: achievements } = await adminClient
      .from('achievements')
      .select('*')
      .eq('is_active', true);

    const { data: userAchievements } = await adminClient
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const unlockedIds = new Set((userAchievements || []).map((ua) => ua.achievement_id));

    // Get user stats for achievement checking
    const { data: userPoints } = await adminClient
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: orderCount } = await adminClient
      .from('orders')
      .select('id')
      .eq('salesperson_id', userId)
      .neq('status', 'cancelled');

    const salesCount = orderCount?.length || 0;
    const totalPoints = userPoints?.total_points || 0;
    const streakDays = userPoints?.streak_days || 0;

    for (const achievement of achievements || []) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.condition_type) {
        case 'sales_count':
          shouldUnlock = salesCount >= (achievement.condition_value || 0);
          break;
        case 'sales_streak':
          shouldUnlock = streakDays >= (achievement.condition_value || 0);
          break;
        case 'points_total':
          shouldUnlock = totalPoints >= (achievement.condition_value || 0);
          break;
        // Add more condition types as needed
      }

      if (shouldUnlock) {
        // Unlock the achievement
        const { error } = await adminClient.from('user_achievements').insert({
          user_id: userId,
          achievement_id: achievement.id,
          earned_at: new Date().toISOString(),
          progress: 100,
          notified: false,
        });

        if (!error) {
          unlocked.push({
            achievement_id: achievement.id,
            achievement_name: achievement.name,
            achievement_display_name: achievement.display_name,
            points_reward: achievement.points_reward,
          });

          // Award achievement points
          if (achievement.points_reward > 0) {
            await adminClient.from('point_history').insert({
              user_id: userId,
              points: achievement.points_reward,
              reason: 'achievement',
              source_type: 'achievement',
              source_id: achievement.id,
              description: `Unlocked "${achievement.display_name}" achievement`,
            });

            // Update user points total
            await adminClient
              .from('user_points')
              .update({
                total_points: totalPoints + achievement.points_reward,
                lifetime_points: (userPoints?.lifetime_points || 0) + achievement.points_reward,
              })
              .eq('user_id', userId);
          }

          // Create activity feed event
          await adminClient.from('activity_feed').insert({
            user_id: userId,
            event_type: 'achievement_unlocked',
            title: 'Achievement Unlocked!',
            description: `Earned "${achievement.display_name}"`,
            metadata: {
              achievement_id: achievement.id,
              achievement_name: achievement.name,
              points_reward: achievement.points_reward,
            },
            is_global: true,
          });
        }
      }
    }
  } catch (e) {
    console.error('checkAndUnlockAchievements error:', e);
  }

  return unlocked;
}
