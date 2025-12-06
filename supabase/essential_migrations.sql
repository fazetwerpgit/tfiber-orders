-- Essential Gamification Tables Migration
-- This creates the core tables and seed data needed for gamification

-- =============================================
-- 1. POINT CONFIGURATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS point_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_type text NOT NULL UNIQUE,
  points integer NOT NULL DEFAULT 10,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed point configurations
INSERT INTO point_configurations (sale_type, points, description) VALUES
  ('standard', 10, 'Standard new customer sale'),
  ('upgrade', 20, 'Existing customer plan upgrade'),
  ('multi_service', 30, 'Bundled services sale'),
  ('add_on', 5, 'Add-on service')
ON CONFLICT (sale_type) DO NOTHING;

-- =============================================
-- 2. USER POINTS
-- =============================================
CREATE TABLE IF NOT EXISTS user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_points integer DEFAULT 0,
  lifetime_points integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  last_activity_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- =============================================
-- 3. POINT HISTORY
-- =============================================
CREATE TABLE IF NOT EXISTS point_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points integer NOT NULL,
  reason text NOT NULL,
  source_type text,
  source_id uuid,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_point_history_user_id ON point_history(user_id);
CREATE INDEX IF NOT EXISTS idx_point_history_created_at ON point_history(created_at);

-- =============================================
-- 4. ACHIEVEMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text NOT NULL,
  icon text,
  category text DEFAULT 'milestone',
  points_reward integer DEFAULT 0,
  condition_type text,
  condition_value integer,
  condition_json jsonb,
  is_secret boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed achievements
INSERT INTO achievements (name, display_name, description, icon, category, points_reward, condition_type, condition_value, sort_order) VALUES
  ('first_sale', 'First Sale', 'Complete your first sale', '🎯', 'milestone', 50, 'sales_count', 1, 1),
  ('five_sales', 'High Five', 'Complete 5 sales', '🖐️', 'milestone', 100, 'sales_count', 5, 2),
  ('ten_sales', 'Double Digits', 'Complete 10 sales', '🔟', 'milestone', 200, 'sales_count', 10, 3),
  ('twenty_five_sales', 'Quarter Century', 'Complete 25 sales', '🏅', 'milestone', 500, 'sales_count', 25, 4),
  ('fifty_sales', 'Half Century', 'Complete 50 sales', '🥇', 'milestone', 1000, 'sales_count', 50, 5),
  ('hundred_sales', 'Century Club', 'Complete 100 sales', '💯', 'milestone', 2500, 'sales_count', 100, 6),
  ('three_day_streak', 'On a Roll', '3-day sales streak', '🔥', 'streak', 25, 'sales_streak', 3, 10),
  ('seven_day_streak', 'Week Warrior', '7-day sales streak', '⚡', 'streak', 75, 'sales_streak', 7, 11),
  ('fourteen_day_streak', 'Fortnight Fighter', '14-day sales streak', '💪', 'streak', 150, 'sales_streak', 14, 12),
  ('thirty_day_streak', 'Monthly Master', '30-day sales streak', '👑', 'streak', 500, 'sales_streak', 30, 13),
  ('hundred_points', 'Point Collector', 'Earn 100 total points', '⭐', 'milestone', 25, 'points_total', 100, 20),
  ('five_hundred_points', 'Point Hoarder', 'Earn 500 total points', '🌟', 'milestone', 100, 'points_total', 500, 21),
  ('thousand_points', 'Point Master', 'Earn 1000 total points', '✨', 'milestone', 250, 'points_total', 1000, 22)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 5. USER ACHIEVEMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  progress integer DEFAULT 0,
  notified boolean DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- =============================================
-- 6. STREAK MILESTONES
-- =============================================
CREATE TABLE IF NOT EXISTS streak_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  days integer NOT NULL UNIQUE,
  bonus_points integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Seed streak milestones
INSERT INTO streak_milestones (days, bonus_points, description) VALUES
  (3, 25, '3-day streak bonus'),
  (7, 75, '7-day streak bonus'),
  (14, 150, '14-day streak bonus'),
  (21, 250, '21-day streak bonus'),
  (30, 500, '30-day streak bonus'),
  (60, 1000, '60-day streak bonus'),
  (90, 2000, '90-day streak bonus')
ON CONFLICT (days) DO NOTHING;

-- =============================================
-- 7. LEADERBOARD SNAPSHOTS
-- =============================================
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  total_points integer NOT NULL,
  snapshot_date date NOT NULL,
  period_type text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_user_date ON leaderboard_snapshots(user_id, snapshot_date);

-- =============================================
-- 8. TEAMS
-- =============================================
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  color text DEFAULT '#E20074',
  icon text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 9. TEAM MEMBERSHIPS
-- =============================================
CREATE TABLE IF NOT EXISTS team_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_memberships_team_id ON team_memberships(team_id);

-- =============================================
-- 10. TEAM BATTLES
-- =============================================
CREATE TABLE IF NOT EXISTS team_battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  period_type text DEFAULT 'weekly',
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text DEFAULT 'upcoming',
  winner_team_id uuid REFERENCES teams(id),
  prize_description text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 11. TEAM BATTLE PARTICIPANTS
-- =============================================
CREATE TABLE IF NOT EXISTS team_battle_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES team_battles(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  total_points integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  rank integer,
  UNIQUE(battle_id, team_id)
);

-- =============================================
-- 12. ACTIVITY FEED
-- =============================================
CREATE TABLE IF NOT EXISTS activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  is_global boolean DEFAULT false,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at);

-- =============================================
-- 13. USER GOALS
-- =============================================
CREATE TABLE IF NOT EXISTS user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_type text NOT NULL,
  metric text NOT NULL,
  target_value integer NOT NULL,
  current_value integer DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'active',
  is_suggested boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);

-- =============================================
-- 14. ADD MISSING COLUMNS TO ORDERS
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'orders' AND column_name = 'sale_type') THEN
    ALTER TABLE orders ADD COLUMN sale_type text DEFAULT 'standard';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'orders' AND column_name = 'add_ons_count') THEN
    ALTER TABLE orders ADD COLUMN add_ons_count integer DEFAULT 0;
  END IF;
END $$;

-- =============================================
-- 15. ENABLE RLS ON NEW TABLES
-- =============================================
ALTER TABLE point_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_battle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 16. RLS POLICIES (Allow authenticated users to read)
-- =============================================
DO $$
BEGIN
  -- Point configurations - everyone can read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'point_configurations_select_policy') THEN
    CREATE POLICY point_configurations_select_policy ON point_configurations FOR SELECT USING (true);
  END IF;

  -- Achievements - everyone can read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'achievements_select_policy') THEN
    CREATE POLICY achievements_select_policy ON achievements FOR SELECT USING (true);
  END IF;

  -- Streak milestones - everyone can read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'streak_milestones_select_policy') THEN
    CREATE POLICY streak_milestones_select_policy ON streak_milestones FOR SELECT USING (true);
  END IF;

  -- Teams - everyone can read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'teams_select_policy') THEN
    CREATE POLICY teams_select_policy ON teams FOR SELECT USING (true);
  END IF;

  -- User points - users can read all, update own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_points_select_policy') THEN
    CREATE POLICY user_points_select_policy ON user_points FOR SELECT USING (true);
  END IF;

  -- Point history - users can read all
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'point_history_select_policy') THEN
    CREATE POLICY point_history_select_policy ON point_history FOR SELECT USING (true);
  END IF;

  -- User achievements - users can read all
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_achievements_select_policy') THEN
    CREATE POLICY user_achievements_select_policy ON user_achievements FOR SELECT USING (true);
  END IF;

  -- Team memberships - everyone can read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_memberships_select_policy') THEN
    CREATE POLICY team_memberships_select_policy ON team_memberships FOR SELECT USING (true);
  END IF;

  -- Team battles - everyone can read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_battles_select_policy') THEN
    CREATE POLICY team_battles_select_policy ON team_battles FOR SELECT USING (true);
  END IF;

  -- Battle participants - everyone can read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_battle_participants_select_policy') THEN
    CREATE POLICY team_battle_participants_select_policy ON team_battle_participants FOR SELECT USING (true);
  END IF;

  -- Activity feed - users can read global or own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'activity_feed_select_policy') THEN
    CREATE POLICY activity_feed_select_policy ON activity_feed FOR SELECT USING (is_global = true OR user_id = auth.uid());
  END IF;

  -- User goals - users can read own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_goals_select_policy') THEN
    CREATE POLICY user_goals_select_policy ON user_goals FOR SELECT USING (user_id = auth.uid());
  END IF;

  -- Leaderboard snapshots - everyone can read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leaderboard_snapshots_select_policy') THEN
    CREATE POLICY leaderboard_snapshots_select_policy ON leaderboard_snapshots FOR SELECT USING (true);
  END IF;
END $$;

-- Done!
SELECT 'Gamification tables created successfully!' as result;
