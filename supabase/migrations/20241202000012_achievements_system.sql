-- Migration: Achievements System
-- Creates achievement definitions and user achievement tracking

-- ============================================
-- ACHIEVEMENT DEFINITIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT, -- Emoji or icon name
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('milestone', 'streak', 'sales', 'special', 'team')),
  points_reward INTEGER NOT NULL DEFAULT 0, -- Bonus points for earning
  condition_type TEXT NOT NULL CHECK (condition_type IN ('sales_count', 'sales_streak', 'points_total', 'team_rank', 'custom')),
  condition_value INTEGER, -- The threshold (e.g., 10 for "10 sales")
  condition_json JSONB, -- Complex conditions stored as JSON
  is_secret BOOLEAN DEFAULT FALSE, -- Hidden until earned
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying active achievements
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_condition ON achievements(condition_type);

-- Trigger for updated_at
CREATE TRIGGER update_achievements_updated_at
  BEFORE UPDATE ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- USER ACHIEVEMENTS TABLE (Unlocked)
-- ============================================

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0, -- For tracking partial progress toward threshold
  notified BOOLEAN DEFAULT FALSE, -- Whether user has been shown popup
  UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON user_achievements(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_not_notified ON user_achievements(user_id, notified) WHERE notified = FALSE;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements: everyone can read non-secret, or secret if they've earned it
CREATE POLICY "achievements_read_public" ON achievements
  FOR SELECT USING (
    is_secret = FALSE
    OR EXISTS (
      SELECT 1 FROM user_achievements
      WHERE user_achievements.achievement_id = achievements.id
      AND user_achievements.user_id::text = auth.uid()::text
    )
  );

-- User achievements: all authenticated users can view (for profile displays)
CREATE POLICY "user_achievements_read_all" ON user_achievements
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can update their own notified status
CREATE POLICY "user_achievements_update_own" ON user_achievements
  FOR UPDATE USING (user_id::text = auth.uid()::text);

-- ============================================
-- SEED DATA: Default Achievements
-- ============================================

INSERT INTO achievements (name, display_name, description, icon, category, points_reward, condition_type, condition_value, is_secret, sort_order) VALUES
  -- Milestone achievements (sales count)
  ('first_sale', 'First Sale!', 'Complete your first sale', '🎯', 'milestone', 50, 'sales_count', 1, FALSE, 1),
  ('five_sales', 'Getting Started', 'Complete 5 sales', '⭐', 'milestone', 100, 'sales_count', 5, FALSE, 2),
  ('ten_sales', 'Rising Star', 'Complete 10 sales', '🌟', 'milestone', 200, 'sales_count', 10, FALSE, 3),
  ('twenty_five_sales', 'Sales Pro', 'Complete 25 sales', '💫', 'milestone', 500, 'sales_count', 25, FALSE, 4),
  ('fifty_sales', 'Sales Champion', 'Complete 50 sales', '🏆', 'milestone', 1000, 'sales_count', 50, FALSE, 5),
  ('hundred_sales', 'Legend', 'Complete 100 sales', '👑', 'milestone', 2500, 'sales_count', 100, FALSE, 6),
  ('two_fifty_sales', 'Sales Machine', 'Complete 250 sales', '🤖', 'milestone', 5000, 'sales_count', 250, FALSE, 7),

  -- Streak achievements
  ('three_day_streak', 'On Fire', 'Make sales 3 days in a row', '🔥', 'streak', 75, 'sales_streak', 3, FALSE, 10),
  ('week_streak', 'Week Warrior', 'Make sales 7 days in a row', '⚡', 'streak', 200, 'sales_streak', 7, FALSE, 11),
  ('two_week_streak', 'Unstoppable', 'Make sales 14 days in a row', '💪', 'streak', 500, 'sales_streak', 14, FALSE, 12),
  ('month_streak', 'Machine', 'Make sales 30 days in a row', '🎖️', 'streak', 1500, 'sales_streak', 30, FALSE, 13),

  -- Points achievements
  ('points_500', 'Point Collector', 'Earn 500 total points', '💎', 'sales', 50, 'points_total', 500, FALSE, 20),
  ('points_1000', 'Point Master', 'Earn 1,000 total points', '💰', 'sales', 100, 'points_total', 1000, FALSE, 21),
  ('points_2500', 'Point Expert', 'Earn 2,500 total points', '🏅', 'sales', 250, 'points_total', 2500, FALSE, 22),
  ('points_5000', 'Point Legend', 'Earn 5,000 total points', '🥇', 'sales', 500, 'points_total', 5000, FALSE, 23),
  ('points_10000', 'Point God', 'Earn 10,000 total points', '✨', 'sales', 1000, 'points_total', 10000, FALSE, 24),

  -- Secret achievements (hidden until earned)
  ('weekend_warrior', 'Weekend Warrior', 'Make a sale on Saturday or Sunday', '🌅', 'special', 150, 'custom', NULL, TRUE, 30),
  ('early_bird', 'Early Bird', 'Make a sale before 8 AM', '🌄', 'special', 100, 'custom', NULL, TRUE, 31),
  ('night_owl', 'Night Owl', 'Make a sale after 9 PM', '🦉', 'special', 100, 'custom', NULL, TRUE, 32),
  ('hat_trick', 'Hat Trick', 'Make 3 sales in a single day', '🎩', 'special', 200, 'custom', NULL, TRUE, 33),
  ('high_roller', 'High Roller', 'Make 5 sales in a single day', '🎰', 'special', 500, 'custom', NULL, TRUE, 34),
  ('founders_fan', 'Founders Fan', 'Sell 5 Founders Club plans', '🏛️', 'special', 300, 'custom', NULL, TRUE, 35),
  ('upgrade_master', 'Upgrade Master', 'Complete 10 upgrade sales', '📈', 'special', 400, 'custom', NULL, TRUE, 36)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- FUNCTION: Check and Award Achievements
-- ============================================
-- Called after order creation to check if user earned any achievements

CREATE OR REPLACE FUNCTION check_and_award_achievements(p_user_id UUID)
RETURNS TABLE(achievement_id UUID, achievement_name TEXT, achievement_display_name TEXT, points_reward INTEGER) AS $$
DECLARE
  user_sale_count INTEGER;
  user_lifetime_points INTEGER;
  user_streak INTEGER;
  ach RECORD;
BEGIN
  -- Get user stats
  SELECT COUNT(*) INTO user_sale_count
  FROM orders
  WHERE salesperson_id = p_user_id AND status != 'cancelled';

  SELECT COALESCE(lifetime_points, 0), COALESCE(streak_days, 0)
  INTO user_lifetime_points, user_streak
  FROM user_points
  WHERE user_id = p_user_id;

  -- Default values if no record
  user_lifetime_points := COALESCE(user_lifetime_points, 0);
  user_streak := COALESCE(user_streak, 0);

  -- Check each active achievement the user hasn't earned
  FOR ach IN
    SELECT a.* FROM achievements a
    WHERE a.is_active = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
    )
  LOOP
    -- Check if achievement is earned based on condition_type
    IF (
      (ach.condition_type = 'sales_count' AND user_sale_count >= ach.condition_value) OR
      (ach.condition_type = 'points_total' AND user_lifetime_points >= ach.condition_value) OR
      (ach.condition_type = 'sales_streak' AND user_streak >= ach.condition_value)
    ) THEN
      -- Award the achievement
      INSERT INTO user_achievements (user_id, achievement_id, progress)
      VALUES (p_user_id, ach.id, COALESCE(ach.condition_value, 0))
      ON CONFLICT (user_id, achievement_id) DO NOTHING;

      -- Award bonus points if any
      IF ach.points_reward > 0 THEN
        -- Update user points
        UPDATE user_points
        SET
          total_points = total_points + ach.points_reward,
          lifetime_points = lifetime_points + ach.points_reward
        WHERE user_id = p_user_id;

        -- Record in point history
        INSERT INTO point_history (user_id, points, reason, source_type, source_id, description)
        VALUES (
          p_user_id,
          ach.points_reward,
          'achievement',
          'achievement',
          ach.id,
          'Achievement unlocked: ' || ach.display_name || ' (+' || ach.points_reward || ' pts)'
        );
      END IF;

      -- Return the unlocked achievement
      achievement_id := ach.id;
      achievement_name := ach.name;
      achievement_display_name := ach.display_name;
      points_reward := ach.points_reward;
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Check Achievements After Order
-- ============================================

CREATE OR REPLACE FUNCTION check_achievements_after_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Check and award any earned achievements (non-custom types)
  PERFORM check_and_award_achievements(NEW.salesperson_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (runs after points are awarded)
DROP TRIGGER IF EXISTS check_achievements_trigger ON orders;
CREATE TRIGGER check_achievements_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION check_achievements_after_order();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE achievements IS 'Achievement definitions with unlock conditions';
COMMENT ON TABLE user_achievements IS 'Tracks which users have earned which achievements';
COMMENT ON COLUMN achievements.is_secret IS 'Secret achievements are hidden until earned';
COMMENT ON COLUMN achievements.condition_json IS 'Complex conditions for custom achievement types';
