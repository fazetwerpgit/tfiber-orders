'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';

export interface Badge {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
}

export interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge: Badge;
}

export interface BadgeProgress {
  badge: Badge;
  current: number;
  required: number;
  earned: boolean;
  earned_at?: string;
}

export async function getUserBadges(): Promise<{ badges: UserBadge[]; error: string | null }> {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { badges: [], error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      id,
      badge_id,
      earned_at,
      badge:badges(*)
    `)
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false });

  if (error) {
    return { badges: [], error: error.message };
  }

  return { badges: data as unknown as UserBadge[], error: null };
}

export async function getAllBadgesWithProgress(): Promise<{ badges: BadgeProgress[]; error: string | null }> {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { badges: [], error: 'Not authenticated' };
  }

  // Get all badges
  const { data: allBadges } = await supabase
    .from('badges')
    .select('*')
    .order('requirement_value', { ascending: true });

  // Get user's earned badges
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('badge_id, earned_at')
    .eq('user_id', user.id);

  const earnedMap = new Map<string, string>();
  userBadges?.forEach(ub => earnedMap.set(ub.badge_id, ub.earned_at));

  // Get user stats for progress calculation
  const { data: orders } = await supabase
    .from('orders')
    .select('id, plan_type, created_at')
    .eq('salesperson_id', user.id)
    .neq('status', 'cancelled');

  const { data: streak } = await supabase
    .from('user_streaks')
    .select('current_streak, longest_streak')
    .eq('user_id', user.id)
    .single();

  // Calculate stats
  const totalSales = orders?.length || 0;
  const foundersClubSales = orders?.filter(o => o.plan_type === 'founders_club').length || 0;
  const highTierSales = orders?.filter(o => ['fiber_1gig', 'fiber_2gig', 'founders_club'].includes(o.plan_type)).length || 0;
  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;

  // Calculate max single day sales
  const salesByDay = new Map<string, number>();
  orders?.forEach(o => {
    const day = new Date(o.created_at).toDateString();
    salesByDay.set(day, (salesByDay.get(day) || 0) + 1);
  });
  const maxSingleDay = Math.max(0, ...Array.from(salesByDay.values()));

  // Map badges with progress
  const badgesWithProgress: BadgeProgress[] = (allBadges || []).map(badge => {
    let current = 0;
    
    switch (badge.requirement_type) {
      case 'total_sales':
        current = totalSales;
        break;
      case 'streak_days':
        current = Math.max(currentStreak, longestStreak);
        break;
      case 'founders_club_sales':
        current = foundersClubSales;
        break;
      case 'high_tier_sales':
        current = highTierSales;
        break;
      case 'single_day_sales':
        current = maxSingleDay;
        break;
      default:
        current = 0;
    }

    return {
      badge,
      current,
      required: badge.requirement_value,
      earned: earnedMap.has(badge.id),
      earned_at: earnedMap.get(badge.id),
    };
  });

  return { badges: badgesWithProgress, error: null };
}

export async function checkAndAwardBadges(): Promise<{ awarded: string[]; error: string | null }> {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { awarded: [], error: 'Not authenticated' };
  }

  const { badges } = await getAllBadgesWithProgress();
  const awarded: string[] = [];

  for (const bp of badges) {
    if (!bp.earned && bp.current >= bp.required) {
      // Award the badge
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: user.id,
          badge_id: bp.badge.id,
        });

      if (!error) {
        awarded.push(bp.badge.display_name);
      }
    }
  }

  return { awarded, error: null };
}
