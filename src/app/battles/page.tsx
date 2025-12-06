'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Swords,
  Trophy,
  Users,
  Calendar,
  Clock,
  ChevronRight,
} from 'lucide-react';
import type { Team, TeamBattle, TeamBattleParticipant, TeamLeaderboardEntry } from '@/lib/types';
import { getTeamLeaderboard, getActiveBattle, getAllBattles, getCurrentUserTeam } from '@/actions/teams';
import { TeamLeaderboard, TeamBattleCard } from '@/components/teams';
import { cn } from '@/lib/utils';

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.getDate()}`;
  }

  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
}

function getTimeRemaining(endDate: string): string {
  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) return 'Ended';

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h`;
  }
  return `${diffHours}h`;
}

// ============================================
// BATTLE HISTORY CARD
// ============================================

interface BattleHistoryCardProps {
  battle: TeamBattle;
}

function BattleHistoryCard({ battle }: BattleHistoryCardProps) {
  const isCompleted = battle.status === 'completed';
  const isActive = battle.status === 'active';

  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-colors',
        isActive
          ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {battle.name}
            </h3>
            {isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                Active
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                Completed
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDateRange(battle.start_date, battle.end_date)}
            </span>
            {isActive && (
              <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400">
                <Clock className="w-4 h-4" />
                {getTimeRemaining(battle.end_date)} left
              </span>
            )}
          </div>

          {battle.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
              {battle.description}
            </p>
          )}
        </div>

        <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function BattlesPage() {
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamLeaderboardEntry[]>([]);
  const [activeBattle, setActiveBattle] = useState<{
    battle: TeamBattle;
    participants: (TeamBattleParticipant & { team: Team })[];
  } | null>(null);
  const [pastBattles, setPastBattles] = useState<TeamBattle[]>([]);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    const [leaderboardRes, battleRes, battlesRes, userTeamRes] = await Promise.all([
      getTeamLeaderboard(),
      getActiveBattle(),
      getAllBattles(10),
      getCurrentUserTeam(),
    ]);

    if (leaderboardRes.success && leaderboardRes.data) {
      setTeamLeaderboard(leaderboardRes.data);
    }

    if (battleRes.success && battleRes.data) {
      setActiveBattle(battleRes.data);
    }

    if (battlesRes.success && battlesRes.data) {
      // Filter to only completed battles for history
      setPastBattles(battlesRes.data.filter((b) => b.status === 'completed'));
    }

    if (userTeamRes.success && userTeamRes.data !== undefined) {
      setUserTeam(userTeamRes.data);
    }

    setIsLoading(false);
  };

  // Convert battle participants to leaderboard format for display
  const battleTeams: TeamLeaderboardEntry[] = activeBattle?.participants.map((p) => ({
    team_id: p.team_id,
    name: p.team.name,
    display_name: p.team.display_name,
    color: p.team.color,
    icon: p.team.icon,
    member_count: 0, // Not available in participant data
    total_points: p.total_points,
    lifetime_points: 0,
    rank: p.rank || 0,
  })) || teamLeaderboard;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-purple-600" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Team Battles
            </h1>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
          </div>
        ) : (
          <>
            {/* Active Battle Section */}
            <section>
              <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2 mb-3">
                <span className="w-1 h-6 bg-purple-600 rounded-full" />
                Current Battle
              </h2>

              {activeBattle ? (
                <div className="space-y-4">
                  {/* Battle header */}
                  <div className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {activeBattle.battle.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Live
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDateRange(activeBattle.battle.start_date, activeBattle.battle.end_date)}
                      <span className="text-pink-600 dark:text-pink-400 font-medium">
                        • {getTimeRemaining(activeBattle.battle.end_date)} remaining
                      </span>
                    </p>
                    {activeBattle.battle.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {activeBattle.battle.description}
                      </p>
                    )}
                    {activeBattle.battle.prize_description && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        Prize: {activeBattle.battle.prize_description}
                      </p>
                    )}
                  </div>

                  {/* Battle standings */}
                  <TeamBattleCard
                    teams={battleTeams}
                    battleName=""
                    isActive
                  />
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-800">
                  <Swords className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    No Active Battle
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Check back soon for the next team competition!
                  </p>
                </div>
              )}
            </section>

            {/* Team Leaderboard */}
            <section>
              <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2 mb-3">
                <span className="w-1 h-6 bg-pink-600 rounded-full" />
                Team Rankings
              </h2>

              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
                <TeamLeaderboard
                  initialEntries={teamLeaderboard}
                  currentTeamId={userTeam?.id}
                />
              </div>
            </section>

            {/* Your Team */}
            {userTeam && (
              <section>
                <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2 mb-3">
                  <span className="w-1 h-6 bg-green-600 rounded-full" />
                  Your Team
                </h2>

                <Link
                  href={`/battles/${userTeam.id}`}
                  className="block bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${userTeam.color}20` }}
                    >
                      {userTeam.icon || (
                        <Users className="w-6 h-6" style={{ color: userTeam.color }} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {userTeam.display_name}
                      </h3>
                      {userTeam.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {userTeam.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              </section>
            )}

            {/* Battle History */}
            {pastBattles.length > 0 && (
              <section>
                <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2 mb-3">
                  <span className="w-1 h-6 bg-gray-400 rounded-full" />
                  Past Battles
                </h2>

                <div className="space-y-2">
                  {pastBattles.map((battle) => (
                    <BattleHistoryCard key={battle.id} battle={battle} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
