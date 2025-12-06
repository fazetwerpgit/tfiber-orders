-- Migration: Points System Tables
-- Creates the foundation for the gamification points system

-- ============================================
-- POINT CONFIGURATIONS TABLE
-- ============================================
-- Configurable points for each sale type (admin-adjustable)

CREATE TABLE IF NOT EXISTS point_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_type TEXT NOT NULL UNIQUE CHECK (sale_type IN ('standard', 'upgrade', 'multi_service', 'add_on')),
  points INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default point values
INSERT INTO point_configurations (sale_type, points, description) VALUES
  ('standard', 10, 'Standard new customer sale'),
  ('upgrade', 20, 'Customer upgrade to higher plan'),
  ('multi_service', 30, 'Multi-service bundle sale (internet + voice)'),
  ('add_on', 5, 'Each add-on service')
ON CONFLICT (sale_type) DO NOTHING;

-- Trigger for updated_at
CREATE TRIGGER update_point_configurations_updated_at
  BEFORE UPDATE ON point_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- USER POINTS TABLE (Running Totals)
-- ============================================
-- Stores the current total points for each user
-- Updated via trigger when points are awarded

CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0, -- Never decreases, tracks all-time earnings
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for leaderboard queries (sorted by points descending)
CREATE INDEX IF NOT EXISTS idx_user_points_total ON user_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_lifetime ON user_points(lifetime_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_user ON user_points(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON user_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- POINT HISTORY TABLE (Audit Trail)
-- ============================================
-- Detailed log of all point transactions

CREATE TABLE IF NOT EXISTS point_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL, -- Can be negative for deductions
  reason TEXT NOT NULL, -- 'sale', 'achievement', 'streak_bonus', 'adjustment'
  source_type TEXT, -- 'order', 'achievement', 'streak', 'admin'
  source_id UUID, -- Reference to order_id, achievement_id, etc.
  description TEXT, -- Human-readable description
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_point_history_user ON point_history(user_id);
CREATE INDEX IF NOT EXISTS idx_point_history_created ON point_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_history_source ON point_history(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_point_history_user_created ON point_history(user_id, created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE point_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;

-- Point configurations: everyone can read (for UI display)
CREATE POLICY "point_configs_read_all" ON point_configurations
  FOR SELECT USING (true);

-- User points: all authenticated users can view (for leaderboard)
CREATE POLICY "user_points_read_all" ON user_points
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Point history: users can see their own, admins can see all via admin client
CREATE POLICY "point_history_read_own" ON point_history
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- ============================================
-- TRIGGER FUNCTION: Award Points on Order Insert
-- ============================================

CREATE OR REPLACE FUNCTION award_points_on_order()
RETURNS TRIGGER AS $$
DECLARE
  base_points INTEGER;
  addon_points INTEGER;
  total_pts INTEGER;
BEGIN
  -- Only award points for non-cancelled orders
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- Get base points for sale type (default to standard if not set)
  SELECT points INTO base_points
  FROM point_configurations
  WHERE sale_type = COALESCE(NEW.sale_type, 'standard');

  IF base_points IS NULL THEN
    base_points := 10; -- Fallback default
  END IF;

  -- Get add-on points
  SELECT points INTO addon_points
  FROM point_configurations
  WHERE sale_type = 'add_on';

  addon_points := COALESCE(addon_points, 5) * COALESCE(NEW.add_ons_count, 0);

  total_pts := base_points + addon_points;

  -- Ensure user_points record exists (upsert)
  INSERT INTO user_points (user_id, total_points, lifetime_points, last_activity_date)
  VALUES (NEW.salesperson_id, 0, 0, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update user points totals
  UPDATE user_points
  SET
    total_points = total_points + total_pts,
    lifetime_points = lifetime_points + total_pts,
    last_activity_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = NEW.salesperson_id;

  -- Record in point history for audit trail
  INSERT INTO point_history (user_id, points, reason, source_type, source_id, description)
  VALUES (
    NEW.salesperson_id,
    total_pts,
    'sale',
    'order',
    NEW.id,
    CASE NEW.sale_type
      WHEN 'upgrade' THEN 'Customer upgrade sale'
      WHEN 'multi_service' THEN 'Multi-service bundle sale'
      ELSE 'New customer sale'
    END || CASE WHEN COALESCE(NEW.add_ons_count, 0) > 0
      THEN ' + ' || NEW.add_ons_count || ' add-on(s)'
      ELSE ''
    END || ' (' || total_pts || ' pts)'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for order insert
DROP TRIGGER IF EXISTS award_points_after_order_insert ON orders;
CREATE TRIGGER award_points_after_order_insert
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION award_points_on_order();

-- ============================================
-- TRIGGER: Handle Order Cancellation (Deduct Points)
-- ============================================

CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  base_points INTEGER;
  addon_points INTEGER;
  total_pts INTEGER;
BEGIN
  -- If order is being cancelled, deduct points
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Calculate points to deduct (same logic as awarding)
    SELECT points INTO base_points
    FROM point_configurations
    WHERE sale_type = COALESCE(OLD.sale_type, 'standard');

    base_points := COALESCE(base_points, 10);

    SELECT points INTO addon_points
    FROM point_configurations
    WHERE sale_type = 'add_on';

    addon_points := COALESCE(addon_points, 5) * COALESCE(OLD.add_ons_count, 0);

    total_pts := base_points + addon_points;

    -- Deduct from user points (but not below 0 for total_points)
    UPDATE user_points
    SET
      total_points = GREATEST(0, total_points - total_pts),
      updated_at = NOW()
    WHERE user_id = OLD.salesperson_id;

    -- Record deduction in history
    INSERT INTO point_history (user_id, points, reason, source_type, source_id, description)
    VALUES (
      OLD.salesperson_id,
      -total_pts,
      'adjustment',
      'order',
      OLD.id,
      'Order cancelled - points deducted (' || (-total_pts) || ' pts)'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for order status changes
DROP TRIGGER IF EXISTS handle_order_status_change_trigger ON orders;
CREATE TRIGGER handle_order_status_change_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_order_status_change();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE point_configurations IS 'Configurable point values for different sale types';
COMMENT ON TABLE user_points IS 'Running totals of points for each user (for leaderboard)';
COMMENT ON TABLE point_history IS 'Audit trail of all point transactions';
COMMENT ON COLUMN user_points.total_points IS 'Current spendable/rankable points';
COMMENT ON COLUMN user_points.lifetime_points IS 'All-time earned points (never decreases)';
