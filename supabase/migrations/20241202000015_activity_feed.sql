-- Migration: Activity Feed
-- Real-time activity tracking for sales events, achievements, and more

-- ============================================
-- ACTIVITY FEED TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for system/global events
  event_type TEXT NOT NULL CHECK (event_type IN (
    'new_sale',
    'achievement_unlocked',
    'streak_milestone',
    'leaderboard_change',
    'team_battle_update',
    'points_earned',
    'goal_completed'
  )),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}', -- Flexible data storage for event-specific info
  is_global BOOLEAN DEFAULT FALSE, -- Show in global feed (vs user-specific)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_global ON activity_feed(is_global, created_at DESC) WHERE is_global = TRUE;
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_created ON activity_feed(user_id, created_at DESC);

-- Composite index for user's unread items
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_unread
  ON activity_feed(user_id, is_read)
  WHERE is_read = FALSE;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Users can read global items and their own items
CREATE POLICY "activity_feed_read" ON activity_feed
  FOR SELECT USING (
    is_global = TRUE
    OR user_id::text = auth.uid()::text
    OR auth.uid() IS NOT NULL -- Allow reading all for social features
  );

-- Users can update their own read status
CREATE POLICY "activity_feed_update_own" ON activity_feed
  FOR UPDATE USING (user_id::text = auth.uid()::text);

-- ============================================
-- TRIGGER: Create Activity on Order
-- ============================================

CREATE OR REPLACE FUNCTION create_activity_on_order()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  points_earned INTEGER;
  base_points INTEGER;
  addon_points INTEGER;
BEGIN
  -- Get user name
  SELECT name INTO user_name FROM users WHERE id = NEW.salesperson_id;

  -- Calculate points (match points trigger logic)
  SELECT points INTO base_points
  FROM point_configurations
  WHERE sale_type = COALESCE(NEW.sale_type, 'standard');
  base_points := COALESCE(base_points, 10);

  SELECT points INTO addon_points
  FROM point_configurations
  WHERE sale_type = 'add_on';
  addon_points := COALESCE(addon_points, 5) * COALESCE(NEW.add_ons_count, 0);

  points_earned := base_points + addon_points;

  -- Create user-specific activity (private)
  INSERT INTO activity_feed (user_id, event_type, title, description, metadata, is_global)
  VALUES (
    NEW.salesperson_id,
    'new_sale',
    'New Sale!',
    'You completed a ' || COALESCE(NEW.sale_type, 'standard') || ' sale',
    jsonb_build_object(
      'order_id', NEW.id,
      'plan_type', NEW.plan_type,
      'sale_type', COALESCE(NEW.sale_type, 'standard'),
      'points_earned', points_earned,
      'customer_name', NEW.customer_name
    ),
    FALSE
  );

  -- Create global activity (public feed)
  INSERT INTO activity_feed (user_id, event_type, title, description, metadata, is_global)
  VALUES (
    NEW.salesperson_id,
    'new_sale',
    COALESCE(user_name, 'Someone') || ' made a sale!',
    INITCAP(COALESCE(NEW.sale_type, 'standard')) || ' - ' || NEW.plan_type || ' plan',
    jsonb_build_object(
      'order_id', NEW.id,
      'user_id', NEW.salesperson_id,
      'user_name', user_name,
      'plan_type', NEW.plan_type,
      'points_earned', points_earned
    ),
    TRUE
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS create_activity_after_order ON orders;
CREATE TRIGGER create_activity_after_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_on_order();

-- ============================================
-- TRIGGER: Create Activity on Achievement
-- ============================================

CREATE OR REPLACE FUNCTION create_activity_on_achievement()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  ach_display TEXT;
  ach_icon TEXT;
  ach_points INTEGER;
  ach_secret BOOLEAN;
BEGIN
  -- Get user and achievement info
  SELECT name INTO user_name FROM users WHERE id = NEW.user_id;
  SELECT display_name, icon, points_reward, is_secret
  INTO ach_display, ach_icon, ach_points, ach_secret
  FROM achievements WHERE id = NEW.achievement_id;

  -- Create user-specific activity
  INSERT INTO activity_feed (user_id, event_type, title, description, metadata, is_global)
  VALUES (
    NEW.user_id,
    'achievement_unlocked',
    'Achievement Unlocked! ' || COALESCE(ach_icon, '🏆'),
    ach_display,
    jsonb_build_object(
      'achievement_id', NEW.achievement_id,
      'achievement_name', ach_display,
      'icon', ach_icon,
      'points_reward', ach_points
    ),
    FALSE
  );

  -- Create global activity (only for non-secret achievements)
  IF NOT COALESCE(ach_secret, FALSE) THEN
    INSERT INTO activity_feed (user_id, event_type, title, description, metadata, is_global)
    VALUES (
      NEW.user_id,
      'achievement_unlocked',
      COALESCE(user_name, 'Someone') || ' unlocked ' || COALESCE(ach_icon, '🏆') || ' ' || ach_display || '!',
      CASE WHEN ach_points > 0 THEN '+' || ach_points || ' points' ELSE NULL END,
      jsonb_build_object(
        'achievement_id', NEW.achievement_id,
        'user_id', NEW.user_id,
        'user_name', user_name,
        'achievement_name', ach_display,
        'icon', ach_icon
      ),
      TRUE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS create_activity_after_achievement ON user_achievements;
CREATE TRIGGER create_activity_after_achievement
  AFTER INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_on_achievement();

-- ============================================
-- FUNCTION: Create Streak Milestone Activity
-- ============================================
-- Called from streak trigger when milestone is hit

CREATE OR REPLACE FUNCTION create_streak_activity(
  p_user_id UUID,
  p_streak_days INTEGER,
  p_bonus_points INTEGER
)
RETURNS void AS $$
DECLARE
  user_name TEXT;
BEGIN
  SELECT name INTO user_name FROM users WHERE id = p_user_id;

  -- User activity
  INSERT INTO activity_feed (user_id, event_type, title, description, metadata, is_global)
  VALUES (
    p_user_id,
    'streak_milestone',
    '🔥 ' || p_streak_days || '-Day Streak!',
    'You earned ' || p_bonus_points || ' bonus points!',
    jsonb_build_object(
      'streak_days', p_streak_days,
      'bonus_points', p_bonus_points
    ),
    FALSE
  );

  -- Global activity
  INSERT INTO activity_feed (user_id, event_type, title, description, metadata, is_global)
  VALUES (
    p_user_id,
    'streak_milestone',
    COALESCE(user_name, 'Someone') || ' hit a ' || p_streak_days || '-day streak! 🔥',
    '+' || p_bonus_points || ' bonus points',
    jsonb_build_object(
      'user_id', p_user_id,
      'user_name', user_name,
      'streak_days', p_streak_days,
      'bonus_points', p_bonus_points
    ),
    TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Cleanup Old Activity (for maintenance)
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_activity()
RETURNS void AS $$
BEGIN
  -- Delete non-global activity older than 30 days
  DELETE FROM activity_feed
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND is_global = FALSE;

  -- Delete global activity older than 90 days
  DELETE FROM activity_feed
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND is_global = TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE activity_feed IS 'Real-time activity feed for sales events and achievements';
COMMENT ON COLUMN activity_feed.is_global IS 'Global activities shown in public feed; user-specific shown in personal feed';
COMMENT ON COLUMN activity_feed.metadata IS 'JSON blob for event-specific data (order_id, achievement_id, etc.)';
