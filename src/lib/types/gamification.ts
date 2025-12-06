/**
 * Gamification Types
 *
 * TypeScript types for the sales gamification platform including:
 * - Points system
 * - Achievements
 * - Streaks
 * - Teams & Battles
 * - Activity Feed
 * - Goals & Reports
 */

// ============================================
// SALE TYPES & POINTS
// ============================================

/** Type of sale for points calculation */
export type SaleType = 'standard' | 'upgrade' | 'multi_service';

/** Reason for point award/deduction */
export type PointReason = 'sale' | 'achievement' | 'streak_bonus' | 'adjustment';

/** Source type for point history tracking */
export type PointSourceType = 'order' | 'achievement' | 'streak' | 'admin';

/** Point configuration for a sale type */
export interface PointConfiguration {
  id: string;
  sale_type: SaleType | 'add_on';
  points: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/** User's current point totals */
export interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  lifetime_points: number;
  streak_days: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

/** Individual point transaction in history */
export interface PointHistory {
  id: string;
  user_id: string;
  points: number;
  reason: PointReason;
  source_type: PointSourceType | null;
  source_id: string | null;
  description: string | null;
  created_at: string;
}

/** Points calculation result from processing an order */
export interface PointsCalculationResult {
  totalPoints: number;
  breakdown: {
    saleType: SaleType;
    basePoints: number;
    addonPoints: number;
  };
}

// ============================================
// ACHIEVEMENTS
// ============================================

/** Achievement category */
export type AchievementCategory = 'milestone' | 'streak' | 'sales' | 'special' | 'team';

/** Achievement condition type */
export type AchievementConditionType =
  | 'sales_count'
  | 'sales_streak'
  | 'points_total'
  | 'team_rank'
  | 'custom';

/** Achievement definition */
export interface Achievement {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string | null;
  category: AchievementCategory;
  points_reward: number;
  condition_type: AchievementConditionType;
  condition_value: number | null;
  condition_json: Record<string, unknown> | null;
  is_secret: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** User's earned achievement */
export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  progress: number;
  notified: boolean;
  // Joined data
  achievement?: Achievement;
}

/** Achievement unlock result */
export interface AchievementUnlockResult {
  achievement_id: string;
  achievement_name: string;
  achievement_display_name: string;
  points_reward: number;
}

// ============================================
// STREAKS
// ============================================

/** Streak history record */
export interface StreakHistory {
  id: string;
  user_id: string;
  streak_type: 'daily' | 'weekly';
  streak_count: number;
  started_at: string;
  ended_at: string | null;
  is_current: boolean;
  created_at: string;
}

/** Streak milestone bonus configuration */
export interface StreakMilestone {
  id: string;
  days: number;
  bonus_points: number;
  description: string | null;
  created_at: string;
}

/** Streak update result */
export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  milestoneReached: number | null;
  bonusPoints: number;
  streakBroken: boolean;
}

// ============================================
// LEADERBOARD
// ============================================

/** Time range for leaderboard filtering */
export type TimeRange = 'today' | 'week' | 'month' | 'all-time';

/** Badge display info for leaderboard */
export interface LeaderboardBadge {
  id: string;
  icon: string | null;
  name: string;
}

/** Single leaderboard entry */
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  total_points: number;
  order_count: number;
  streak_days: number;
  is_current_user: boolean;
  rank_change: number | null;
  badges?: LeaderboardBadge[];
}

/** Leaderboard snapshot for tracking changes */
export interface LeaderboardSnapshot {
  id: string;
  user_id: string;
  rank: number;
  total_points: number;
  snapshot_date: string;
  period_type: 'daily' | 'weekly' | 'monthly';
}

/** Rank change detection result */
export interface RankChangeResult {
  user_id: string;
  old_rank: number | null;
  new_rank: number;
  change: number;
  is_significant: boolean;
}

// ============================================
// TEAMS & BATTLES
// ============================================

/** Team definition */
export interface Team {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  color: string;
  icon: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Team membership */
export interface TeamMembership {
  id: string;
  user_id: string;
  team_id: string;
  role: 'captain' | 'member';
  joined_at: string;
}

/** Team member with stats (from view) */
export interface TeamMemberStats {
  team_id: string;
  user_id: string;
  role: 'captain' | 'member';
  joined_at: string;
  user_name: string;
  user_email: string;
  total_points: number;
  streak_days: number;
  total_sales: number;
}

/** Team battle period type */
export type BattlePeriodType = 'daily' | 'weekly' | 'monthly' | 'custom';

/** Team battle status */
export type BattleStatus = 'upcoming' | 'active' | 'completed';

/** Team battle definition */
export interface TeamBattle {
  id: string;
  name: string;
  description: string | null;
  period_type: BattlePeriodType;
  start_date: string;
  end_date: string;
  status: BattleStatus;
  winner_team_id: string | null;
  prize_description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Team battle participant scores */
export interface TeamBattleParticipant {
  id: string;
  battle_id: string;
  team_id: string;
  total_points: number;
  total_sales: number;
  rank: number | null;
}

/** Team leaderboard entry (from view) */
export interface TeamLeaderboardEntry {
  team_id: string;
  name: string;
  display_name: string;
  color: string;
  icon: string | null;
  member_count: number;
  total_points: number;
  lifetime_points: number;
  rank: number;
}

// ============================================
// ACTIVITY FEED
// ============================================

/** Activity event types */
export type ActivityEventType =
  | 'new_sale'
  | 'achievement_unlocked'
  | 'streak_milestone'
  | 'leaderboard_change'
  | 'team_battle_update'
  | 'points_earned'
  | 'goal_completed';

/** Activity feed event */
export interface ActivityFeedEvent {
  id: string;
  user_id: string | null;
  event_type: ActivityEventType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  is_global: boolean;
  is_read: boolean;
  created_at: string;
  // Joined data
  user_name?: string;
}

/** Activity feed filter options */
export interface ActivityFeedFilters {
  user_id?: string;
  event_types?: ActivityEventType[];
  since?: string;
  limit?: number;
  global_only?: boolean;
}

// ============================================
// GOALS
// ============================================

/** Goal type (time period) */
export type GoalType = 'daily' | 'weekly' | 'monthly' | 'custom';

/** Goal metric to track */
export type GoalMetric = 'sales_count' | 'points' | 'commission';

/** Goal status */
export type GoalStatus = 'active' | 'completed' | 'failed' | 'cancelled';

/** User goal */
export interface UserGoal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  metric: GoalMetric;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  status: GoalStatus;
  is_suggested: boolean;
  created_at: string;
  updated_at: string;
}

/** Smart goal suggestion */
export interface SmartGoalSuggestion {
  suggested_target: number;
  metric: GoalMetric;
  reasoning: string;
  confidence: 'low' | 'medium' | 'high';
}

/** Goal progress calculation */
export interface GoalProgress {
  goal: UserGoal;
  percent_complete: number;
  days_remaining: number;
  projected_final: number;
  status: 'ahead' | 'on_track' | 'behind' | 'at_risk';
  pace_required: number;
}

// ============================================
// USER PREFERENCES
// ============================================

/** Theme presets */
export type ThemePreset = 'light' | 'dark' | 'system' | 'neon' | 'team';

/** User preferences */
export interface UserPreferences {
  id: string;
  user_id: string;
  theme: ThemePreset;
  notifications_enabled: boolean;
  notify_achievements: boolean;
  notify_leaderboard_changes: boolean;
  notify_team_updates: boolean;
  notify_streak_reminders: boolean;
  show_points_on_dashboard: boolean;
  show_streak_on_dashboard: boolean;
  show_achievements_on_profile: boolean;
  receive_weekly_report: boolean;
  receive_achievement_emails: boolean;
  gamification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// WEEKLY REPORTS
// ============================================

/** Weekly report data structure */
export interface WeeklyReportData {
  user_id: string;
  user_name: string;
  user_email: string;
  week_start: string;
  week_end: string;
  summary: {
    total_sales: number;
    total_points: number;
    total_commission: number;
    comparison_to_last_week: {
      sales_change: number;
      points_change: number;
      commission_change: number;
    };
  };
  achievements_unlocked: {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked_at: string;
  }[];
  streak: {
    current: number;
    longest: number;
    maintained: boolean;
  };
  rank: {
    current: number;
    change_from_last_week: number;
    percentile: number;
  };
  team_results: {
    team_name: string;
    team_rank: number;
    team_points: number;
    battle_won: boolean;
  } | null;
  goals: {
    completed: number;
    total: number;
    details: {
      type: GoalType;
      target: number;
      achieved: number;
      completed: boolean;
    }[];
  };
}

/** Stored weekly report */
export interface WeeklyReport {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  report_data: WeeklyReportData;
  email_sent: boolean;
  email_sent_at: string | null;
  created_at: string;
}

// ============================================
// ACTION RESULTS
// ============================================

/** Generic action result */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Order processing result (gamification side effects) */
export interface OrderGamificationResult {
  points: PointsCalculationResult;
  streak: StreakUpdateResult;
  achievements: AchievementUnlockResult[];
  rankChange: RankChangeResult | null;
}

// ============================================
// CONSTANTS
// ============================================

/** Default point values */
export const DEFAULT_POINTS = {
  standard: 10,
  upgrade: 20,
  multi_service: 30,
  add_on: 5,
} as const;

/** Streak milestone bonuses */
export const STREAK_MILESTONES = {
  3: 25,
  7: 75,
  14: 150,
  21: 250,
  30: 500,
  60: 1000,
  90: 2000,
} as const;

/** Sale type configuration for UI */
export const SALE_TYPE_CONFIG: Record<SaleType, { label: string; description: string; points: number }> = {
  standard: {
    label: 'Standard Sale',
    description: 'New customer installation',
    points: DEFAULT_POINTS.standard,
  },
  upgrade: {
    label: 'Upgrade',
    description: 'Existing customer plan upgrade',
    points: DEFAULT_POINTS.upgrade,
  },
  multi_service: {
    label: 'Multi-Service',
    description: 'Bundled services (internet + voice)',
    points: DEFAULT_POINTS.multi_service,
  },
};
