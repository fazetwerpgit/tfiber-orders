'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type {
  ActionResult,
  WeeklyReportData,
  UserGoal,
  GoalType,
  GoalMetric,
} from '@/lib/types';

// Simplified report interface for the UI
export interface SimpleWeeklyReport {
  user_id: string;
  user_name: string;
  week_start: string;
  week_end: string;
  total_sales: number;
  sales_change: number;
  sales_change_percent: number;
  sale_breakdown: {
    standard: number;
    upgrade: number;
    multi_service: number;
  };
  total_points: number;
  points_change: number;
  achievements_unlocked: number;
  current_streak: number;
  best_streak: number;
  current_rank: number;
  rank_change: number;
}

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
// WEEKLY REPORT
// ============================================

/**
 * Get weekly report for a user
 */
export async function getWeeklyReport(
  userId?: string,
  weekStart?: string
): Promise<ActionResult<SimpleWeeklyReport>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const targetUserId = userId || user.id;
    const adminClient = createAdminClient();

    // Calculate week boundaries
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (weekStart) {
      startDate = new Date(weekStart);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
    } else {
      // Default to current week (Sunday to Saturday)
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    }

    // Get user info
    const { data: userData } = await adminClient
      .from('users')
      .select('id, name, email')
      .eq('id', targetUserId)
      .single();

    // Get orders for this week
    const { data: orders } = await adminClient
      .from('orders')
      .select('id, sale_type, add_ons_count, status, created_at')
      .eq('salesperson_id', targetUserId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .neq('status', 'cancelled');

    // Get points earned this week
    const { data: pointHistory } = await adminClient
      .from('point_history')
      .select('points')
      .eq('user_id', targetUserId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalPoints = pointHistory?.reduce((sum, p) => sum + p.points, 0) || 0;

    // Get achievements unlocked this week
    const { data: achievements } = await adminClient
      .from('user_achievements')
      .select('id, achievement_id')
      .eq('user_id', targetUserId)
      .gte('earned_at', startDate.toISOString())
      .lte('earned_at', endDate.toISOString());

    // Get user's current points data
    const { data: userPoints } = await adminClient
      .from('user_points')
      .select('streak_days, best_streak')
      .eq('user_id', targetUserId)
      .single();

    // Calculate sale breakdown
    const saleBreakdown = {
      standard: 0,
      upgrade: 0,
      multi_service: 0,
    };

    for (const order of orders || []) {
      const type = order.sale_type as keyof typeof saleBreakdown;
      if (type in saleBreakdown) {
        saleBreakdown[type]++;
      }
    }

    // Get previous week's stats for comparison
    const prevWeekStart = new Date(startDate);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(endDate);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);

    const { data: prevOrders } = await adminClient
      .from('orders')
      .select('id')
      .eq('salesperson_id', targetUserId)
      .gte('created_at', prevWeekStart.toISOString())
      .lte('created_at', prevWeekEnd.toISOString())
      .neq('status', 'cancelled');

    const { data: prevPoints } = await adminClient
      .from('point_history')
      .select('points')
      .eq('user_id', targetUserId)
      .gte('created_at', prevWeekStart.toISOString())
      .lte('created_at', prevWeekEnd.toISOString());

    const prevWeekSales = prevOrders?.length || 0;
    const prevWeekPoints = prevPoints?.reduce((sum, p) => sum + p.points, 0) || 0;

    // Calculate changes
    const totalSales = orders?.length || 0;
    const salesChange = totalSales - prevWeekSales;
    const salesChangePercent = prevWeekSales > 0
      ? Math.round(((totalSales - prevWeekSales) / prevWeekSales) * 100)
      : 0;
    const pointsChange = totalPoints - prevWeekPoints;

    // Get rank (simplified - just count users with more points)
    const { count: higherRanked } = await adminClient
      .from('user_points')
      .select('*', { count: 'exact', head: true })
      .gt('total_points', userPoints?.best_streak || 0);

    const currentRank = (higherRanked || 0) + 1;

    const report: SimpleWeeklyReport = {
      user_id: targetUserId,
      user_name: userData?.name || 'Unknown',
      week_start: startDate.toISOString().split('T')[0],
      week_end: endDate.toISOString().split('T')[0],
      total_sales: totalSales,
      sales_change: salesChange,
      sales_change_percent: salesChangePercent,
      sale_breakdown: saleBreakdown,
      total_points: totalPoints,
      points_change: pointsChange,
      achievements_unlocked: achievements?.length || 0,
      current_streak: userPoints?.streak_days || 0,
      best_streak: userPoints?.best_streak || 0,
      current_rank: currentRank,
      rank_change: 0, // Would need historical data
    };

    return { success: true, data: report };
  } catch (e) {
    console.error('getWeeklyReport error:', e);
    return { success: false, error: 'Failed to generate weekly report' };
  }
}

// ============================================
// GOALS
// ============================================

/**
 * Get smart goal suggestions based on user's history
 */
export async function getSmartGoalSuggestions(): Promise<
  ActionResult<{ daily: number; weekly: number; monthly: number }>
> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    // Get user's sales history for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: orders } = await adminClient
      .from('orders')
      .select('created_at')
      .eq('salesperson_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .neq('status', 'cancelled');

    const totalSales = orders?.length || 0;

    // Calculate averages
    const avgDaily = totalSales / 30;
    const avgWeekly = (totalSales / 30) * 7;

    // Suggest slightly above average (10-20% improvement)
    const suggestions = {
      daily: Math.max(1, Math.ceil(avgDaily * 1.15)),
      weekly: Math.max(3, Math.ceil(avgWeekly * 1.15)),
      monthly: Math.max(10, Math.ceil(totalSales * 1.15)),
    };

    return { success: true, data: suggestions };
  } catch (e) {
    console.error('getSmartGoalSuggestions error:', e);
    return { success: false, error: 'Failed to get goal suggestions' };
  }
}

/**
 * Set a new goal for the user
 */
export async function setGoal(
  goalType: GoalType,
  metric: GoalMetric,
  targetValue: number
): Promise<ActionResult<UserGoal>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    // Calculate start/end dates based on goal type
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (goalType) {
      case 'daily':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now);
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 7);
    }

    // Deactivate any existing goals of the same type
    await adminClient
      .from('user_goals')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('goal_type', goalType)
      .eq('status', 'active');

    // Create new goal
    const { data, error } = await adminClient
      .from('user_goals')
      .insert({
        user_id: user.id,
        goal_type: goalType,
        metric,
        target_value: targetValue,
        current_value: 0,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as UserGoal };
  } catch (e) {
    console.error('setGoal error:', e);
    return { success: false, error: 'Failed to set goal' };
  }
}

/**
 * Get user's current goal progress
 */
export async function getGoalProgress(): Promise<ActionResult<UserGoal[]>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('user_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as UserGoal[] };
  } catch (e) {
    console.error('getGoalProgress error:', e);
    return { success: false, error: 'Failed to get goal progress' };
  }
}

/**
 * Update goal progress (typically called after a sale)
 */
export async function updateGoalProgress(
  metric: GoalMetric,
  increment: number = 1
): Promise<ActionResult<void>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();
    const now = new Date();

    // Get active goals for this metric
    const { data: goals } = await adminClient
      .from('user_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('metric', metric)
      .eq('status', 'active')
      .lte('start_date', now.toISOString())
      .gte('end_date', now.toISOString());

    for (const goal of goals || []) {
      const newValue = goal.current_value + increment;
      const isCompleted = newValue >= goal.target_value;

      await adminClient
        .from('user_goals')
        .update({
          current_value: newValue,
          status: isCompleted ? 'completed' : 'active',
          completed_at: isCompleted ? now.toISOString() : null,
        })
        .eq('id', goal.id);
    }

    return { success: true };
  } catch (e) {
    console.error('updateGoalProgress error:', e);
    return { success: false, error: 'Failed to update goal progress' };
  }
}

// ============================================
// PERFORMANCE INSIGHTS
// ============================================

/**
 * Get performance insights for the user
 */
export async function getPerformanceInsights(): Promise<
  ActionResult<{
    bestDay: string;
    bestTime: string;
    avgSalesPerDay: number;
    topSaleType: string;
    personalBests: {
      dailySales: number;
      weeklySales: number;
      longestStreak: number;
    };
  }>
> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    // Get all user's orders
    const { data: orders } = await adminClient
      .from('orders')
      .select('created_at, sale_type')
      .eq('salesperson_id', user.id)
      .neq('status', 'cancelled');

    if (!orders || orders.length === 0) {
      return {
        success: true,
        data: {
          bestDay: 'Not enough data',
          bestTime: 'Not enough data',
          avgSalesPerDay: 0,
          topSaleType: 'standard',
          personalBests: {
            dailySales: 0,
            weeklySales: 0,
            longestStreak: 0,
          },
        },
      };
    }

    // Analyze by day of week
    const dayCount: Record<string, number> = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const order of orders) {
      const date = new Date(order.created_at);
      const dayName = days[date.getDay()];
      dayCount[dayName] = (dayCount[dayName] || 0) + 1;
    }

    const bestDay = Object.entries(dayCount).reduce(
      (best, [day, count]) => (count > best.count ? { day, count } : best),
      { day: 'Monday', count: 0 }
    ).day;

    // Analyze by hour
    const hourCount: Record<string, number> = {};
    for (const order of orders) {
      const date = new Date(order.created_at);
      const hour = date.getHours();
      const timeSlot = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
      hourCount[timeSlot] = (hourCount[timeSlot] || 0) + 1;
    }

    const bestTime = Object.entries(hourCount).reduce(
      (best, [time, count]) => (count > best.count ? { time, count } : best),
      { time: 'Afternoon', count: 0 }
    ).time;

    // Calculate average sales per day
    const firstOrder = new Date(orders[orders.length - 1].created_at);
    const daysSinceFirst = Math.max(1, Math.ceil(
      (Date.now() - firstOrder.getTime()) / (1000 * 60 * 60 * 24)
    ));
    const avgSalesPerDay = Math.round((orders.length / daysSinceFirst) * 10) / 10;

    // Find top sale type
    const saleTypeCount: Record<string, number> = {};
    for (const order of orders) {
      const type = order.sale_type || 'standard';
      saleTypeCount[type] = (saleTypeCount[type] || 0) + 1;
    }

    const topSaleType = Object.entries(saleTypeCount).reduce(
      (best, [type, count]) => (count > best.count ? { type, count } : best),
      { type: 'standard', count: 0 }
    ).type;

    // Get user points for streak data
    const { data: userPoints } = await adminClient
      .from('user_points')
      .select('best_streak')
      .eq('user_id', user.id)
      .single();

    // Calculate personal bests
    const salesByDate: Record<string, number> = {};
    for (const order of orders) {
      const dateKey = order.created_at.split('T')[0];
      salesByDate[dateKey] = (salesByDate[dateKey] || 0) + 1;
    }

    const dailySales = Math.max(...Object.values(salesByDate), 0);

    // Calculate weekly sales (simplified)
    const weeklySales = Math.min(orders.length, dailySales * 7);

    return {
      success: true,
      data: {
        bestDay,
        bestTime,
        avgSalesPerDay,
        topSaleType,
        personalBests: {
          dailySales,
          weeklySales,
          longestStreak: userPoints?.best_streak || 0,
        },
      },
    };
  } catch (e) {
    console.error('getPerformanceInsights error:', e);
    return { success: false, error: 'Failed to get performance insights' };
  }
}
