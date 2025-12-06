-- Migration: User Preferences & Goals
-- User settings, theme preferences, and goal tracking

-- ============================================
-- USER PREFERENCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- UI Theme
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system', 'neon', 'team')),

  -- Notification preferences
  notifications_enabled BOOLEAN DEFAULT TRUE,
  notify_achievements BOOLEAN DEFAULT TRUE,
  notify_leaderboard_changes BOOLEAN DEFAULT TRUE,
  notify_team_updates BOOLEAN DEFAULT TRUE,
  notify_streak_reminders BOOLEAN DEFAULT TRUE,

  -- Display preferences
  show_points_on_dashboard BOOLEAN DEFAULT TRUE,
  show_streak_on_dashboard BOOLEAN DEFAULT TRUE,
  show_achievements_on_profile BOOLEAN DEFAULT TRUE,

  -- Email preferences
  receive_weekly_report BOOLEAN DEFAULT TRUE,
  receive_achievement_emails BOOLEAN DEFAULT FALSE,

  -- Gamification opt-out (for those who don't want gamification)
  gamification_enabled BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- USER GOALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly', 'custom')),
  metric TEXT NOT NULL CHECK (metric IN ('sales_count', 'points', 'commission')),
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'cancelled')),
  is_suggested BOOLEAN DEFAULT FALSE, -- System-suggested smart goal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_goals_user ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_status ON user_goals(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_goals_dates ON user_goals(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_active ON user_goals(user_id, status) WHERE status = 'active';

-- Trigger for updated_at
CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- WEEKLY REPORTS TABLE
-- ============================================
-- Stores generated reports for history and email tracking

CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  report_data JSONB NOT NULL, -- Full report content
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user ON weekly_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week ON weekly_reports(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_not_sent ON weekly_reports(email_sent) WHERE email_sent = FALSE;

-- ============================================
-- LEADERBOARD SNAPSHOTS
-- ============================================
-- For tracking rank changes over time

CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  snapshot_date DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  UNIQUE(user_id, snapshot_date, period_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_date ON leaderboard_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_user ON leaderboard_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_period ON leaderboard_snapshots(period_type, snapshot_date DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

-- User preferences: only own
CREATE POLICY "user_preferences_read_own" ON user_preferences
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "user_preferences_insert_own" ON user_preferences
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "user_preferences_update_own" ON user_preferences
  FOR UPDATE USING (user_id::text = auth.uid()::text);

-- User goals: only own
CREATE POLICY "user_goals_read_own" ON user_goals
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "user_goals_insert_own" ON user_goals
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "user_goals_update_own" ON user_goals
  FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Weekly reports: only own
CREATE POLICY "weekly_reports_read_own" ON weekly_reports
  FOR SELECT USING (user_id::text = auth.uid()::text);

-- Leaderboard snapshots: all authenticated can view (for comparison features)
CREATE POLICY "leaderboard_snapshots_read_all" ON leaderboard_snapshots
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================
-- FUNCTION: Ensure preferences exist for user
-- ============================================

CREATE OR REPLACE FUNCTION ensure_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Also ensure user_points record exists
  INSERT INTO user_points (user_id, total_points, lifetime_points)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user creation
DROP TRIGGER IF EXISTS create_user_preferences_on_user_insert ON users;
CREATE TRIGGER create_user_preferences_on_user_insert
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_preferences();

-- ============================================
-- FUNCTION: Update Goal Progress
-- ============================================

CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update active sales_count goals for this user
  UPDATE user_goals g
  SET
    current_value = (
      SELECT COUNT(*)
      FROM orders o
      WHERE o.salesperson_id = NEW.salesperson_id
      AND o.status != 'cancelled'
      AND o.created_at::date >= g.start_date
      AND o.created_at::date <= g.end_date
    ),
    status = CASE
      WHEN current_value >= target_value THEN 'completed'
      WHEN end_date < CURRENT_DATE THEN 'failed'
      ELSE 'active'
    END,
    updated_at = NOW()
  WHERE g.user_id = NEW.salesperson_id
  AND g.metric = 'sales_count'
  AND g.status = 'active';

  -- Check if any goal was just completed
  IF EXISTS (
    SELECT 1 FROM user_goals
    WHERE user_id = NEW.salesperson_id
    AND status = 'completed'
    AND updated_at >= NOW() - INTERVAL '5 seconds'
  ) THEN
    -- Create activity for completed goal
    INSERT INTO activity_feed (user_id, event_type, title, description, metadata, is_global)
    SELECT
      NEW.salesperson_id,
      'goal_completed',
      '🎯 Goal Completed!',
      INITCAP(g.goal_type) || ' ' || g.metric || ' goal achieved',
      jsonb_build_object(
        'goal_id', g.id,
        'goal_type', g.goal_type,
        'target', g.target_value,
        'achieved', g.current_value
      ),
      TRUE
    FROM user_goals g
    WHERE g.user_id = NEW.salesperson_id
    AND g.status = 'completed'
    AND g.updated_at >= NOW() - INTERVAL '5 seconds';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS update_goals_after_order ON orders;
CREATE TRIGGER update_goals_after_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();

-- ============================================
-- FUNCTION: Suggest Smart Goal
-- ============================================

CREATE OR REPLACE FUNCTION suggest_goal(
  p_user_id UUID,
  p_goal_type TEXT DEFAULT 'weekly'
)
RETURNS TABLE(suggested_target INTEGER, metric TEXT, reasoning TEXT, confidence TEXT) AS $$
DECLARE
  avg_sales NUMERIC;
  data_days INTEGER;
BEGIN
  -- Calculate historical average based on goal type
  IF p_goal_type = 'daily' THEN
    SELECT
      COUNT(*) / GREATEST(1, EXTRACT(DAY FROM NOW() - MIN(created_at))::INTEGER),
      EXTRACT(DAY FROM NOW() - MIN(created_at))::INTEGER
    INTO avg_sales, data_days
    FROM orders
    WHERE salesperson_id = p_user_id
    AND status != 'cancelled'
    AND created_at >= NOW() - INTERVAL '30 days';
  ELSIF p_goal_type = 'weekly' THEN
    SELECT
      COUNT(*) / GREATEST(1, CEIL(EXTRACT(DAY FROM NOW() - MIN(created_at)) / 7.0)::INTEGER),
      EXTRACT(DAY FROM NOW() - MIN(created_at))::INTEGER
    INTO avg_sales, data_days
    FROM orders
    WHERE salesperson_id = p_user_id
    AND status != 'cancelled'
    AND created_at >= NOW() - INTERVAL '60 days';
  ELSE -- monthly
    SELECT
      COUNT(*) / GREATEST(1, CEIL(EXTRACT(DAY FROM NOW() - MIN(created_at)) / 30.0)::INTEGER),
      EXTRACT(DAY FROM NOW() - MIN(created_at))::INTEGER
    INTO avg_sales, data_days
    FROM orders
    WHERE salesperson_id = p_user_id
    AND status != 'cancelled'
    AND created_at >= NOW() - INTERVAL '90 days';
  END IF;

  -- Handle no data case
  IF avg_sales IS NULL OR avg_sales < 0.5 THEN
    suggested_target := CASE p_goal_type
      WHEN 'daily' THEN 1
      WHEN 'weekly' THEN 5
      ELSE 20
    END;
    metric := 'sales_count';
    reasoning := 'Start with a modest goal to build momentum';
    confidence := 'low';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Suggest 15% stretch goal
  suggested_target := CEIL(avg_sales * 1.15)::INTEGER;
  metric := 'sales_count';
  reasoning := 'Based on your average of ' || ROUND(avg_sales::NUMERIC, 1) || ' sales/' ||
    CASE p_goal_type WHEN 'daily' THEN 'day' WHEN 'weekly' THEN 'week' ELSE 'month' END ||
    ', aim for a 15% improvement';

  confidence := CASE
    WHEN data_days < 7 THEN 'low'
    WHEN data_days < 30 THEN 'medium'
    ELSE 'high'
  END;

  RETURN NEXT;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Take Daily Leaderboard Snapshot
-- ============================================
-- Should be called by cron daily

CREATE OR REPLACE FUNCTION take_leaderboard_snapshot()
RETURNS void AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_week_start DATE := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  v_month_start DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
BEGIN
  -- Weekly snapshot
  INSERT INTO leaderboard_snapshots (user_id, rank, total_points, snapshot_date, period_type)
  SELECT
    up.user_id,
    RANK() OVER (ORDER BY
      (SELECT COALESCE(SUM(ph.points), 0)
       FROM point_history ph
       WHERE ph.user_id = up.user_id
       AND ph.created_at >= v_week_start) DESC
    ) AS rank,
    (SELECT COALESCE(SUM(ph.points), 0)
     FROM point_history ph
     WHERE ph.user_id = up.user_id
     AND ph.created_at >= v_week_start) AS total_points,
    v_today,
    'weekly'
  FROM user_points up
  ON CONFLICT (user_id, snapshot_date, period_type) DO UPDATE SET
    rank = EXCLUDED.rank,
    total_points = EXCLUDED.total_points;

  -- Monthly snapshot
  INSERT INTO leaderboard_snapshots (user_id, rank, total_points, snapshot_date, period_type)
  SELECT
    up.user_id,
    RANK() OVER (ORDER BY
      (SELECT COALESCE(SUM(ph.points), 0)
       FROM point_history ph
       WHERE ph.user_id = up.user_id
       AND ph.created_at >= v_month_start) DESC
    ) AS rank,
    (SELECT COALESCE(SUM(ph.points), 0)
     FROM point_history ph
     WHERE ph.user_id = up.user_id
     AND ph.created_at >= v_month_start) AS total_points,
    v_today,
    'monthly'
  FROM user_points up
  ON CONFLICT (user_id, snapshot_date, period_type) DO UPDATE SET
    rank = EXCLUDED.rank,
    total_points = EXCLUDED.total_points;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE user_preferences IS 'User settings for UI theme, notifications, and gamification';
COMMENT ON TABLE user_goals IS 'Personal goals set by users or suggested by the system';
COMMENT ON TABLE weekly_reports IS 'Generated weekly performance reports';
COMMENT ON TABLE leaderboard_snapshots IS 'Daily snapshots of leaderboard rankings for tracking changes';
COMMENT ON COLUMN user_goals.is_suggested IS 'True if this was a smart goal suggestion from the system';
