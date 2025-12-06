-- Migration: Teams System
-- Creates team structure for team battles and competitions

-- ============================================
-- TEAMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#E20074', -- Team color for UI (hex)
  icon TEXT, -- Emoji or icon name
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(is_active) WHERE is_active = TRUE;

-- Trigger for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TEAM MEMBERSHIPS TABLE
-- ============================================
-- Users can only be on one team at a time (enforced by UNIQUE constraint)

CREATE TABLE IF NOT EXISTS team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('captain', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- A user can only be in one team at a time
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_memberships_team ON team_memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_user ON team_memberships(user_id);

-- ============================================
-- TEAM BATTLES TABLE
-- ============================================
-- Defines competition periods between teams

CREATE TABLE IF NOT EXISTS team_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'custom')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  winner_team_id UUID REFERENCES teams(id),
  prize_description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_battles_status ON team_battles(status);
CREATE INDEX IF NOT EXISTS idx_team_battles_dates ON team_battles(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_team_battles_active ON team_battles(status) WHERE status = 'active';

-- Trigger for updated_at
CREATE TRIGGER update_team_battles_updated_at
  BEFORE UPDATE ON team_battles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TEAM BATTLE PARTICIPANTS TABLE
-- ============================================
-- Tracks team scores within a battle

CREATE TABLE IF NOT EXISTS team_battle_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES team_battles(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  rank INTEGER,
  UNIQUE(battle_id, team_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_battle_participants_battle ON team_battle_participants(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_participants_team ON team_battle_participants(team_id);
CREATE INDEX IF NOT EXISTS idx_battle_participants_rank ON team_battle_participants(battle_id, rank);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_battle_participants ENABLE ROW LEVEL SECURITY;

-- Teams: all authenticated users can read
CREATE POLICY "teams_read_all" ON teams
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Team memberships: all authenticated users can read
CREATE POLICY "team_memberships_read_all" ON team_memberships
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Team battles: all authenticated users can read
CREATE POLICY "team_battles_read_all" ON team_battles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Team battle participants: all authenticated users can read
CREATE POLICY "team_battle_participants_read_all" ON team_battle_participants
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================
-- VIEW: Team Leaderboard
-- ============================================
-- Aggregated team stats for leaderboard display

CREATE OR REPLACE VIEW team_leaderboard AS
SELECT
  t.id AS team_id,
  t.name,
  t.display_name,
  t.color,
  t.icon,
  COUNT(DISTINCT tm.user_id) AS member_count,
  COALESCE(SUM(up.total_points), 0)::INTEGER AS total_points,
  COALESCE(SUM(up.lifetime_points), 0)::INTEGER AS lifetime_points,
  RANK() OVER (ORDER BY COALESCE(SUM(up.total_points), 0) DESC) AS rank
FROM teams t
LEFT JOIN team_memberships tm ON t.id = tm.team_id
LEFT JOIN user_points up ON tm.user_id = up.user_id
WHERE t.is_active = TRUE
GROUP BY t.id, t.name, t.display_name, t.color, t.icon
ORDER BY total_points DESC;

-- ============================================
-- VIEW: Team Members with Stats
-- ============================================

CREATE OR REPLACE VIEW team_members_stats AS
SELECT
  tm.team_id,
  tm.user_id,
  tm.role,
  tm.joined_at,
  u.name AS user_name,
  u.email AS user_email,
  COALESCE(up.total_points, 0) AS total_points,
  COALESCE(up.streak_days, 0) AS streak_days,
  (
    SELECT COUNT(*)
    FROM orders o
    WHERE o.salesperson_id = tm.user_id AND o.status != 'cancelled'
  )::INTEGER AS total_sales
FROM team_memberships tm
JOIN users u ON tm.user_id = u.id
LEFT JOIN user_points up ON tm.user_id = up.user_id;

-- ============================================
-- FUNCTION: Update Team Battle Points
-- ============================================
-- Called when points are earned to update team battle scores

CREATE OR REPLACE FUNCTION update_team_battle_points()
RETURNS TRIGGER AS $$
DECLARE
  user_team_id UUID;
  battle RECORD;
BEGIN
  -- Get user's team
  SELECT team_id INTO user_team_id
  FROM team_memberships
  WHERE user_id = NEW.salesperson_id;

  IF user_team_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Update all active battles this team is participating in
  FOR battle IN
    SELECT tb.id, tb.start_date, tb.end_date
    FROM team_battles tb
    JOIN team_battle_participants tbp ON tb.id = tbp.battle_id
    WHERE tbp.team_id = user_team_id
    AND tb.status = 'active'
  LOOP
    -- Recalculate team totals for this battle
    UPDATE team_battle_participants tbp
    SET
      total_points = (
        SELECT COALESCE(SUM(ph.points), 0)
        FROM point_history ph
        JOIN team_memberships tm ON ph.user_id = tm.user_id
        WHERE tm.team_id = user_team_id
        AND ph.created_at >= battle.start_date
        AND ph.created_at <= battle.end_date
        AND ph.points > 0
      ),
      total_sales = (
        SELECT COUNT(*)
        FROM orders o
        JOIN team_memberships tm ON o.salesperson_id = tm.user_id
        WHERE tm.team_id = user_team_id
        AND o.created_at >= battle.start_date
        AND o.created_at <= battle.end_date
        AND o.status != 'cancelled'
      )
    WHERE tbp.battle_id = battle.id
    AND tbp.team_id = user_team_id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on orders
DROP TRIGGER IF EXISTS update_team_battle_after_order ON orders;
CREATE TRIGGER update_team_battle_after_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_team_battle_points();

-- ============================================
-- FUNCTION: Auto-activate/complete battles
-- ============================================
-- Can be called by a cron job or on demand

CREATE OR REPLACE FUNCTION update_battle_statuses()
RETURNS void AS $$
BEGIN
  -- Activate upcoming battles that have started
  UPDATE team_battles
  SET status = 'active'
  WHERE status = 'upcoming'
  AND start_date <= NOW();

  -- Complete active battles that have ended
  UPDATE team_battles tb
  SET
    status = 'completed',
    winner_team_id = (
      SELECT team_id
      FROM team_battle_participants
      WHERE battle_id = tb.id
      ORDER BY total_points DESC
      LIMIT 1
    )
  WHERE tb.status = 'active'
  AND tb.end_date < NOW();

  -- Update ranks for active battles
  WITH ranked AS (
    SELECT
      tbp.id,
      RANK() OVER (PARTITION BY tbp.battle_id ORDER BY tbp.total_points DESC) AS new_rank
    FROM team_battle_participants tbp
    JOIN team_battles tb ON tbp.battle_id = tb.id
    WHERE tb.status = 'active'
  )
  UPDATE team_battle_participants tbp
  SET rank = r.new_rank
  FROM ranked r
  WHERE tbp.id = r.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE teams IS 'Sales teams for team battles and competitions';
COMMENT ON TABLE team_memberships IS 'User-to-team assignments (one team per user)';
COMMENT ON TABLE team_battles IS 'Competition periods between teams';
COMMENT ON TABLE team_battle_participants IS 'Team scores within a battle';
COMMENT ON COLUMN team_memberships.role IS 'captain has team management permissions, member is default';
