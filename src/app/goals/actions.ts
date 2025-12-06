'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';

export interface UserGoals {
  id: string;
  user_id: string;
  daily_goal: number;
  weekly_goal: number;
  monthly_goal: number;
}

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_sale_date: string | null;
  streak_start_date: string | null;
}

export interface GoalProgress {
  goals: UserGoals;
  streak: UserStreak;
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
  todayCommission: number;
  weekCommission: number;
  monthCommission: number;
}

export async function getGoalProgress(): Promise<{ data: GoalProgress | null; error: string | null }> {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  // Get user goals
  let { data: goals } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Create default goals if not exists
  if (!goals) {
    const { data: newGoals, error: insertError } = await supabase
      .from('user_goals')
      .insert({ user_id: user.id })
      .select()
      .single();
    
    if (insertError) {
      return { data: null, error: 'Failed to create goals' };
    }
    goals = newGoals;
  }

  // Get user streak
  let { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Create default streak if not exists
  if (!streak) {
    const { data: newStreak, error: insertError } = await supabase
      .from('user_streaks')
      .insert({ user_id: user.id, current_streak: 0, longest_streak: 0 })
      .select()
      .single();
    
    if (insertError) {
      return { data: null, error: 'Failed to create streak' };
    }
    streak = newStreak;
  }

  // Calculate date ranges
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  
  const monthStart = new Date(now);
  monthStart.setMonth(monthStart.getMonth() - 1);

  // Get order counts and commissions
  const { data: orders } = await supabase
    .from('orders')
    .select('created_at, commission_amount, status')
    .eq('salesperson_id', user.id)
    .neq('status', 'cancelled')
    .gte('created_at', monthStart.toISOString());

  let todayOrders = 0;
  let weekOrders = 0;
  let monthOrders = 0;
  let todayCommission = 0;
  let weekCommission = 0;
  let monthCommission = 0;

  if (orders) {
    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const commission = order.commission_amount || 0;

      if (orderDate >= todayStart) {
        todayOrders++;
        todayCommission += commission;
      }
      if (orderDate >= weekStart) {
        weekOrders++;
        weekCommission += commission;
      }
      monthOrders++;
      monthCommission += commission;
    });
  }

  return {
    data: {
      goals,
      streak,
      todayOrders,
      weekOrders,
      monthOrders,
      todayCommission,
      weekCommission,
      monthCommission,
    },
    error: null,
  };
}

export async function updateGoals(
  dailyGoal: number,
  weeklyGoal: number,
  monthlyGoal: number
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('user_goals')
    .upsert({
      user_id: user.id,
      daily_goal: dailyGoal,
      weekly_goal: weeklyGoal,
      monthly_goal: monthlyGoal,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
