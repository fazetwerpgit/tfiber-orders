-- User Goals table for daily/weekly/monthly targets
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_goal INTEGER DEFAULT 3,
  weekly_goal INTEGER DEFAULT 15,
  monthly_goal INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User Streaks table for tracking consecutive sales days
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_sale_date DATE,
  streak_start_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Badges definition table
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(20) DEFAULT '#E20074',
  category VARCHAR(50) DEFAULT 'achievement',
  requirement_type VARCHAR(50) NOT NULL,
  requirement_value INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User earned badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, badge_id)
);

-- Insert default badges
INSERT INTO badges (name, display_name, description, icon, color, category, requirement_type, requirement_value) VALUES
  ('first_sale', 'First Blood', 'Made your first sale', 'Zap', '#10B981', 'milestone', 'total_sales', 1),
  ('five_sales', 'Getting Started', 'Reached 5 total sales', 'TrendingUp', '#3B82F6', 'milestone', 'total_sales', 5),
  ('ten_sales', 'Double Digits', 'Reached 10 total sales', 'Award', '#8B5CF6', 'milestone', 'total_sales', 10),
  ('twenty_five_sales', 'Quarter Century', 'Reached 25 total sales', 'Trophy', '#F59E0B', 'milestone', 'total_sales', 25),
  ('fifty_sales', 'Half Century', 'Reached 50 total sales', 'Crown', '#E20074', 'milestone', 'total_sales', 50),
  ('hundred_sales', 'Centurion', 'Reached 100 total sales', 'Star', '#EF4444', 'milestone', 'total_sales', 100),
  ('five_day_streak', 'On Fire', '5-day sales streak', 'Flame', '#F97316', 'streak', 'streak_days', 5),
  ('seven_day_streak', 'Week Warrior', '7-day sales streak', 'Flame', '#EF4444', 'streak', 'streak_days', 7),
  ('thirty_day_streak', 'Unstoppable', '30-day sales streak', 'Flame', '#DC2626', 'streak', 'streak_days', 30),
  ('founders_specialist', 'Founders Expert', 'Sold 5 Founders Club plans', 'Shield', '#6366F1', 'plan', 'founders_club_sales', 5),
  ('gig_master', 'Gig Master', 'Sold 10 Fiber 1 Gig or higher plans', 'Wifi', '#0EA5E9', 'plan', 'high_tier_sales', 10),
  ('daily_goal_7x', 'Goal Crusher', 'Hit daily goal 7 days in a row', 'Target', '#22C55E', 'goal', 'daily_goal_streak', 7),
  ('five_in_day', 'Power Day', '5 sales in a single day', 'Bolt', '#FBBF24', 'daily', 'single_day_sales', 5),
  ('ten_in_day', 'Legendary Day', '10 sales in a single day', 'Rocket', '#F43F5E', 'daily', 'single_day_sales', 10)
ON CONFLICT (name) DO NOTHING;

-- RLS Policies
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own goals
CREATE POLICY "Users can view own goals" ON user_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON user_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own streaks (system updates streaks)
CREATE POLICY "Users can view own streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage streaks" ON user_streaks FOR ALL USING (true);

-- Everyone can view badges
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);

-- Users can view all earned badges (for leaderboard), but system manages them
CREATE POLICY "Anyone can view user badges" ON user_badges FOR SELECT USING (true);
CREATE POLICY "System can manage user badges" ON user_badges FOR ALL USING (true);

-- Function to update streak on new order
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_last_sale_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get current streak data
  SELECT last_sale_date, current_streak, longest_streak
  INTO v_last_sale_date, v_current_streak, v_longest_streak
  FROM user_streaks
  WHERE user_id = NEW.salesperson_id;

  -- If no streak record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_sale_date, streak_start_date)
    VALUES (NEW.salesperson_id, 1, 1, v_today, v_today);
    RETURN NEW;
  END IF;

  -- If already sold today, do nothing
  IF v_last_sale_date = v_today THEN
    RETURN NEW;
  END IF;

  -- If sold yesterday, increment streak
  IF v_last_sale_date = v_today - 1 THEN
    v_current_streak := v_current_streak + 1;
    IF v_current_streak > v_longest_streak THEN
      v_longest_streak := v_current_streak;
    END IF;
    
    UPDATE user_streaks
    SET current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_sale_date = v_today,
        updated_at = NOW()
    WHERE user_id = NEW.salesperson_id;
  ELSE
    -- Streak broken, start new one
    UPDATE user_streaks
    SET current_streak = 1,
        last_sale_date = v_today,
        streak_start_date = v_today,
        updated_at = NOW()
    WHERE user_id = NEW.salesperson_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update streak on order insert
DROP TRIGGER IF EXISTS update_streak_on_order ON orders;
CREATE TRIGGER update_streak_on_order
  AFTER INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.status != 'cancelled')
  EXECUTE FUNCTION update_user_streak();

-- Initialize streaks for existing users
INSERT INTO user_streaks (user_id, current_streak, longest_streak)
SELECT id, 0, 0 FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Initialize goals for existing users
INSERT INTO user_goals (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;
