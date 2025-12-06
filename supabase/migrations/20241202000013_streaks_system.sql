-- Migration: Streaks System
-- Tracks consecutive days of sales activity and awards milestone bonuses

-- ============================================
-- STREAK HISTORY TABLE
-- ============================================
-- Historical record of all streaks (for stats and personal bests)

CREATE TABLE IF NOT EXISTS streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL DEFAULT 'daily' CHECK (streak_type IN ('daily', 'weekly')),
  streak_count INTEGER NOT NULL,
  started_at DATE NOT NULL,
  ended_at DATE,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_streak_history_user ON streak_history(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_history_current ON streak_history(user_id, is_current) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_streak_history_best ON streak_history(user_id, streak_count DESC);

-- ============================================
-- STREAK MILESTONE BONUSES
-- ============================================
-- Configurable bonus points for streak milestones

CREATE TABLE IF NOT EXISTS streak_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  days INTEGER NOT NULL UNIQUE,
  bonus_points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default milestone bonuses
INSERT INTO streak_milestones (days, bonus_points, description) VALUES
  (3, 25, '3-day streak bonus'),
  (7, 75, 'Week streak bonus'),
  (14, 150, 'Two week streak bonus'),
  (21, 250, 'Three week streak bonus'),
  (30, 500, 'Month streak bonus'),
  (60, 1000, 'Two month streak bonus'),
  (90, 2000, 'Quarter streak bonus')
ON CONFLICT (days) DO NOTHING;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_milestones ENABLE ROW LEVEL SECURITY;

-- Streak history: all authenticated users can view (for profiles)
CREATE POLICY "streak_history_read_all" ON streak_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Streak milestones: everyone can read
CREATE POLICY "streak_milestones_read_all" ON streak_milestones
  FOR SELECT USING (true);

-- ============================================
-- FUNCTION: Update Daily Streak
-- ============================================

CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_sale_date DATE;
  current_streak INTEGER;
  today DATE := CURRENT_DATE;
  streak_bonus INTEGER;
  milestone_days INTEGER;
BEGIN
  -- Get user's last activity date and current streak
  SELECT up.last_activity_date, up.streak_days
  INTO last_sale_date, current_streak
  FROM user_points up
  WHERE up.user_id = NEW.salesperson_id;

  -- Initialize if no record exists (handled by points trigger, but be safe)
  IF last_sale_date IS NULL THEN
    -- New user starting their first streak
    UPDATE user_points
    SET streak_days = 1, last_activity_date = today
    WHERE user_id = NEW.salesperson_id;

    -- Start new streak history
    INSERT INTO streak_history (user_id, streak_count, started_at, is_current)
    VALUES (NEW.salesperson_id, 1, today, TRUE);

    RETURN NEW;
  END IF;

  -- Same day - no streak change needed
  IF last_sale_date = today THEN
    RETURN NEW;
  END IF;

  -- Consecutive day - increment streak
  IF last_sale_date = today - 1 THEN
    current_streak := COALESCE(current_streak, 0) + 1;

    UPDATE user_points
    SET
      streak_days = current_streak,
      last_activity_date = today
    WHERE user_id = NEW.salesperson_id;

    -- Update current streak history
    UPDATE streak_history
    SET streak_count = current_streak
    WHERE user_id = NEW.salesperson_id AND is_current = TRUE;

    -- Check for streak milestone bonus
    SELECT days, bonus_points INTO milestone_days, streak_bonus
    FROM streak_milestones
    WHERE days = current_streak;

    IF streak_bonus IS NOT NULL THEN
      -- Award milestone bonus points
      UPDATE user_points
      SET
        total_points = total_points + streak_bonus,
        lifetime_points = lifetime_points + streak_bonus
      WHERE user_id = NEW.salesperson_id;

      -- Record in point history
      INSERT INTO point_history (user_id, points, reason, source_type, source_id, description)
      VALUES (
        NEW.salesperson_id,
        streak_bonus,
        'streak_bonus',
        'streak',
        NULL,
        milestone_days || '-day streak bonus! (+' || streak_bonus || ' pts)'
      );
    END IF;

  -- Streak broken - reset
  ELSE
    -- End current streak in history
    UPDATE streak_history
    SET is_current = FALSE, ended_at = last_sale_date
    WHERE user_id = NEW.salesperson_id AND is_current = TRUE;

    -- Start new streak
    UPDATE user_points
    SET streak_days = 1, last_activity_date = today
    WHERE user_id = NEW.salesperson_id;

    INSERT INTO streak_history (user_id, streak_count, started_at, is_current)
    VALUES (NEW.salesperson_id, 1, today, TRUE);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (runs after points are awarded)
DROP TRIGGER IF EXISTS update_streak_after_order ON orders;
CREATE TRIGGER update_streak_after_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();

-- ============================================
-- VIEW: Best Streaks (for leaderboard/stats)
-- ============================================

CREATE OR REPLACE VIEW best_streaks AS
SELECT
  sh.user_id,
  u.name AS user_name,
  MAX(sh.streak_count) AS best_streak,
  (SELECT streak_days FROM user_points WHERE user_id = sh.user_id) AS current_streak
FROM streak_history sh
JOIN users u ON sh.user_id = u.id
GROUP BY sh.user_id, u.name
ORDER BY best_streak DESC;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE streak_history IS 'Historical record of all user streaks';
COMMENT ON TABLE streak_milestones IS 'Bonus points awarded at streak milestones';
COMMENT ON COLUMN streak_history.is_current IS 'Whether this is the user active streak';
