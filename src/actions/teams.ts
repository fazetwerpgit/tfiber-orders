'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type {
  ActionResult,
  Team,
  TeamMembership,
  TeamMemberStats,
  TeamBattle,
  TeamBattleParticipant,
  TeamLeaderboardEntry,
  TimeRange,
} from '@/lib/types';

/**
 * Get authenticated user from cookies
 */
async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}

/**
 * Check if user has admin/manager role
 */
async function checkManagerAccess(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  if (!user) return false;

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return data?.role === 'admin' || data?.role === 'manager';
}

// ============================================
// TEAM QUERIES
// ============================================

/**
 * Get all active teams
 */
export async function getTeams(): Promise<ActionResult<Team[]>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('teams')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Team[] };
  } catch (e) {
    console.error('getTeams error:', e);
    return { success: false, error: 'Failed to get teams' };
  }
}

/**
 * Get a specific team with its members
 */
export async function getTeamById(
  teamId: string
): Promise<ActionResult<Team & { members: TeamMemberStats[] }>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    // Get team
    const { data: team, error: teamError } = await adminClient
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamError) {
      return { success: false, error: teamError.message };
    }

    // Get team members with their stats
    const { data: memberships, error: memberError } = await adminClient
      .from('team_memberships')
      .select('*')
      .eq('team_id', teamId);

    if (memberError) {
      return { success: false, error: memberError.message };
    }

    const memberIds = memberships?.map((m) => m.user_id) || [];

    // Get user details and points
    let members: TeamMemberStats[] = [];

    if (memberIds.length > 0) {
      const { data: users } = await adminClient
        .from('users')
        .select('id, name, email')
        .in('id', memberIds);

      const { data: points } = await adminClient
        .from('user_points')
        .select('user_id, total_points, streak_days')
        .in('user_id', memberIds);

      const { data: orderCounts } = await adminClient
        .from('orders')
        .select('salesperson_id')
        .in('salesperson_id', memberIds)
        .neq('status', 'cancelled');

      const orderCountMap: Record<string, number> = {};
      for (const o of orderCounts || []) {
        orderCountMap[o.salesperson_id] = (orderCountMap[o.salesperson_id] || 0) + 1;
      }

      const pointsMap: Record<string, { total_points: number; streak_days: number }> = {};
      for (const p of points || []) {
        pointsMap[p.user_id] = { total_points: p.total_points, streak_days: p.streak_days };
      }

      const membershipMap: Record<string, TeamMembership> = {};
      for (const m of memberships || []) {
        membershipMap[m.user_id] = m;
      }

      members = (users || []).map((u) => ({
        team_id: teamId,
        user_id: u.id,
        role: membershipMap[u.id]?.role || 'member',
        joined_at: membershipMap[u.id]?.joined_at || '',
        user_name: u.name,
        user_email: u.email,
        total_points: pointsMap[u.id]?.total_points || 0,
        streak_days: pointsMap[u.id]?.streak_days || 0,
        total_sales: orderCountMap[u.id] || 0,
      }));

      // Sort by points descending
      members.sort((a, b) => b.total_points - a.total_points);
    }

    return {
      success: true,
      data: { ...team, members } as Team & { members: TeamMemberStats[] },
    };
  } catch (e) {
    console.error('getTeamById error:', e);
    return { success: false, error: 'Failed to get team' };
  }
}

/**
 * Get current user's team
 */
export async function getCurrentUserTeam(): Promise<ActionResult<Team | null>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    const { data: membership } = await adminClient
      .from('team_memberships')
      .select('team_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return { success: true, data: null };
    }

    const { data: team, error } = await adminClient
      .from('teams')
      .select('*')
      .eq('id', membership.team_id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: team as Team };
  } catch (e) {
    console.error('getCurrentUserTeam error:', e);
    return { success: false, error: 'Failed to get user team' };
  }
}

/**
 * Get team leaderboard
 */
export async function getTeamLeaderboard(): Promise<ActionResult<TeamLeaderboardEntry[]>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    // Get all active teams
    const { data: teams, error: teamsError } = await adminClient
      .from('teams')
      .select('*')
      .eq('is_active', true);

    if (teamsError) {
      return { success: false, error: teamsError.message };
    }

    // Get all team memberships
    const { data: memberships } = await adminClient
      .from('team_memberships')
      .select('*');

    // Get all user points
    const { data: points } = await adminClient
      .from('user_points')
      .select('user_id, total_points, lifetime_points');

    // Calculate team totals
    const teamPoints: Record<string, { total: number; lifetime: number; members: number }> = {};

    for (const team of teams || []) {
      teamPoints[team.id] = { total: 0, lifetime: 0, members: 0 };
    }

    const pointsMap: Record<string, { total_points: number; lifetime_points: number }> = {};
    for (const p of points || []) {
      pointsMap[p.user_id] = { total_points: p.total_points, lifetime_points: p.lifetime_points };
    }

    for (const m of memberships || []) {
      if (teamPoints[m.team_id]) {
        const userPoints = pointsMap[m.user_id];
        if (userPoints) {
          teamPoints[m.team_id].total += userPoints.total_points;
          teamPoints[m.team_id].lifetime += userPoints.lifetime_points;
        }
        teamPoints[m.team_id].members++;
      }
    }

    // Build leaderboard entries
    const entries: TeamLeaderboardEntry[] = (teams || [])
      .map((team) => ({
        team_id: team.id,
        name: team.name,
        display_name: team.display_name,
        color: team.color,
        icon: team.icon,
        member_count: teamPoints[team.id]?.members || 0,
        total_points: teamPoints[team.id]?.total || 0,
        lifetime_points: teamPoints[team.id]?.lifetime || 0,
        rank: 0,
      }))
      .sort((a, b) => b.total_points - a.total_points);

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return { success: true, data: entries };
  } catch (e) {
    console.error('getTeamLeaderboard error:', e);
    return { success: false, error: 'Failed to get team leaderboard' };
  }
}

// ============================================
// TEAM BATTLES
// ============================================

/**
 * Get active team battle
 */
export async function getActiveBattle(): Promise<
  ActionResult<{ battle: TeamBattle; participants: (TeamBattleParticipant & { team: Team })[] } | null>
> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    // Get active battle
    const { data: battle, error: battleError } = await adminClient
      .from('team_battles')
      .select('*')
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    if (battleError && battleError.code !== 'PGRST116') {
      return { success: false, error: battleError.message };
    }

    if (!battle) {
      return { success: true, data: null };
    }

    // Get participants with team info
    const { data: participants, error: participantsError } = await adminClient
      .from('team_battle_participants')
      .select('*, team:teams(*)')
      .eq('battle_id', battle.id)
      .order('rank', { ascending: true });

    if (participantsError) {
      return { success: false, error: participantsError.message };
    }

    return {
      success: true,
      data: {
        battle: battle as TeamBattle,
        participants: participants as (TeamBattleParticipant & { team: Team })[],
      },
    };
  } catch (e) {
    console.error('getActiveBattle error:', e);
    return { success: false, error: 'Failed to get active battle' };
  }
}

/**
 * Get all battles (past and current)
 */
export async function getAllBattles(
  limit: number = 10
): Promise<ActionResult<TeamBattle[]>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('team_battles')
      .select('*')
      .order('start_date', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as TeamBattle[] };
  } catch (e) {
    console.error('getAllBattles error:', e);
    return { success: false, error: 'Failed to get battles' };
  }
}

// ============================================
// ADMIN/MANAGER TEAM MANAGEMENT
// ============================================

/**
 * Create a new team (admin/manager only)
 */
export async function createTeam(
  team: Omit<Team, 'id' | 'created_at' | 'updated_at'>
): Promise<ActionResult<Team>> {
  try {
    const hasAccess = await checkManagerAccess();
    if (!hasAccess) {
      return { success: false, error: 'Not authorized' };
    }

    const user = await getAuthenticatedUser();
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('teams')
      .insert({
        ...team,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Team };
  } catch (e) {
    console.error('createTeam error:', e);
    return { success: false, error: 'Failed to create team' };
  }
}

/**
 * Update a team (admin/manager only)
 */
export async function updateTeam(
  teamId: string,
  updates: Partial<Team>
): Promise<ActionResult<Team>> {
  try {
    const hasAccess = await checkManagerAccess();
    if (!hasAccess) {
      return { success: false, error: 'Not authorized' };
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('teams')
      .update(updates)
      .eq('id', teamId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Team };
  } catch (e) {
    console.error('updateTeam error:', e);
    return { success: false, error: 'Failed to update team' };
  }
}

/**
 * Delete a team (admin/manager only)
 */
export async function deleteTeam(teamId: string): Promise<ActionResult<void>> {
  try {
    const hasAccess = await checkManagerAccess();
    if (!hasAccess) {
      return { success: false, error: 'Not authorized' };
    }

    const adminClient = createAdminClient();

    // Remove all memberships first
    await adminClient.from('team_memberships').delete().eq('team_id', teamId);

    // Delete the team
    const { error } = await adminClient.from('teams').delete().eq('id', teamId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('deleteTeam error:', e);
    return { success: false, error: 'Failed to delete team' };
  }
}

/**
 * Add a member to a team (admin/manager only)
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: 'captain' | 'member' = 'member'
): Promise<ActionResult<void>> {
  try {
    const hasAccess = await checkManagerAccess();
    if (!hasAccess) {
      return { success: false, error: 'Not authorized' };
    }

    const adminClient = createAdminClient();

    // Check if user is already in a team
    const { data: existing } = await adminClient
      .from('team_memberships')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return { success: false, error: 'User is already in a team' };
    }

    const { error } = await adminClient.from('team_memberships').insert({
      team_id: teamId,
      user_id: userId,
      role,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('addTeamMember error:', e);
    return { success: false, error: 'Failed to add team member' };
  }
}

/**
 * Remove a member from a team (admin/manager only)
 */
export async function removeTeamMember(
  teamId: string,
  userId: string
): Promise<ActionResult<void>> {
  try {
    const hasAccess = await checkManagerAccess();
    if (!hasAccess) {
      return { success: false, error: 'Not authorized' };
    }

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('team_memberships')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('removeTeamMember error:', e);
    return { success: false, error: 'Failed to remove team member' };
  }
}

/**
 * Get all users with their team assignments (admin/manager only)
 */
export async function getAllUsersWithTeams(): Promise<
  ActionResult<{ id: string; name: string; email: string; team_id: string | null; team_name: string | null }[]>
> {
  try {
    const hasAccess = await checkManagerAccess();
    if (!hasAccess) {
      return { success: false, error: 'Not authorized' };
    }

    const adminClient = createAdminClient();

    // Get all users
    const { data: users, error: usersError } = await adminClient
      .from('users')
      .select('id, name, email')
      .order('name');

    if (usersError) {
      return { success: false, error: usersError.message };
    }

    // Get all team memberships
    const { data: memberships } = await adminClient
      .from('team_memberships')
      .select('user_id, team_id');

    // Get all teams
    const { data: teams } = await adminClient
      .from('teams')
      .select('id, display_name')
      .eq('is_active', true);

    // Build user -> team mapping
    const membershipMap: Record<string, string> = {};
    for (const m of memberships || []) {
      membershipMap[m.user_id] = m.team_id;
    }

    const teamNameMap: Record<string, string> = {};
    for (const t of teams || []) {
      teamNameMap[t.id] = t.display_name;
    }

    const result = (users || []).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      team_id: membershipMap[u.id] || null,
      team_name: membershipMap[u.id] ? teamNameMap[membershipMap[u.id]] || null : null,
    }));

    return { success: true, data: result };
  } catch (e) {
    console.error('getAllUsersWithTeams error:', e);
    return { success: false, error: 'Failed to get users with teams' };
  }
}

/**
 * Assign a user to a team (admin/manager only) - replaces existing team if any
 */
export async function assignUserToTeam(
  userId: string,
  teamId: string | null
): Promise<ActionResult<void>> {
  try {
    const hasAccess = await checkManagerAccess();
    if (!hasAccess) {
      return { success: false, error: 'Not authorized' };
    }

    const adminClient = createAdminClient();

    // Remove existing team membership if any
    await adminClient
      .from('team_memberships')
      .delete()
      .eq('user_id', userId);

    // If teamId is null, just remove from team (done above)
    if (!teamId) {
      return { success: true };
    }

    // Add to new team
    const { error } = await adminClient.from('team_memberships').insert({
      team_id: teamId,
      user_id: userId,
      role: 'member',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('assignUserToTeam error:', e);
    return { success: false, error: 'Failed to assign user to team' };
  }
}
