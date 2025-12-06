'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Star,
  Trophy,
  Flame,
  TrendingUp,
  Crown,
} from 'lucide-react';
import type { Team, TeamMemberStats } from '@/lib/types';
import { getTeamById } from '@/actions/teams';
import { TeamMemberList, TeamBadge } from '@/components/teams';
import { cn } from '@/lib/utils';

// ============================================
// STAT CARD
// ============================================

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('w-4 h-4', color)} />
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900 dark:text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

interface TeamDetailPageProps {
  params: Promise<{ teamId: string }>;
}

export default function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamId } = use(params);
  const [team, setTeam] = useState<(Team & { members: TeamMemberStats[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  const fetchTeam = async () => {
    setIsLoading(true);
    setError(null);

    const result = await getTeamById(teamId);

    if (result.success && result.data) {
      setTeam(result.data);
    } else {
      setError(result.error || 'Failed to load team');
    }

    setIsLoading(false);
  };

  // Calculate team stats
  const totalPoints = team?.members.reduce((sum, m) => sum + m.total_points, 0) || 0;
  const totalSales = team?.members.reduce((sum, m) => sum + m.total_sales, 0) || 0;
  const avgPoints = team?.members.length
    ? Math.round(totalPoints / team.members.length)
    : 0;
  const topStreak = team?.members.reduce(
    (max, m) => Math.max(max, m.streak_days),
    0
  ) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/battles"
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </header>
        <main className="p-4 space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
        </main>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-red-500 dark:text-red-400 mb-4">
            {error || 'Team not found'}
          </p>
          <Link
            href="/battles"
            className="text-pink-600 dark:text-pink-400 hover:underline"
          >
            Back to Battles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/battles"
            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <TeamBadge team={team} size="md" />
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Team Hero */}
        <section
          className="rounded-2xl p-6 text-center"
          style={{
            background: `linear-gradient(135deg, ${team.color}20 0%, ${team.color}05 100%)`,
          }}
        >
          {/* Team icon */}
          <div
            className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl mb-4"
            style={{ backgroundColor: `${team.color}30` }}
          >
            {team.icon || (
              <Users className="w-10 h-10" style={{ color: team.color }} />
            )}
          </div>

          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: team.color }}
          >
            {team.display_name}
          </h1>

          {team.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto">
              {team.description}
            </p>
          )}
        </section>

        {/* Team Stats */}
        <section>
          <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2 mb-3">
            <span
              className="w-1 h-6 rounded-full"
              style={{ backgroundColor: team.color }}
            />
            Team Stats
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Star}
              label="Total Points"
              value={totalPoints}
              color="text-pink-600"
            />
            <StatCard
              icon={TrendingUp}
              label="Total Sales"
              value={totalSales}
              color="text-green-600"
            />
            <StatCard
              icon={Users}
              label="Members"
              value={team.members.length}
              color="text-blue-600"
            />
            <StatCard
              icon={Flame}
              label="Top Streak"
              value={`${topStreak} days`}
              color="text-orange-500"
            />
          </div>
        </section>

        {/* Team Members */}
        <section>
          <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2 mb-3">
            <span
              className="w-1 h-6 rounded-full"
              style={{ backgroundColor: team.color }}
            />
            Members ({team.members.length})
          </h2>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <TeamMemberList
              members={team.members}
              showRanks
              showStats
            />
          </div>
        </section>

        {/* Top Performers */}
        {team.members.length >= 3 && (
          <section>
            <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2 mb-3">
              <span
                className="w-1 h-6 rounded-full"
                style={{ backgroundColor: team.color }}
              />
              Top Performers
            </h2>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-end justify-center gap-4">
                {/* 2nd place */}
                {team.members[1] && (
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-600 dark:text-gray-300">
                        {team.members[1].user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {team.members[1].user_name}
                    </p>
                    <p className="text-xs text-pink-600 dark:text-pink-400">
                      {team.members[1].total_points.toLocaleString()} pts
                    </p>
                  </div>
                )}

                {/* 1st place */}
                {team.members[0] && (
                  <div className="flex-1 text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center border-4 border-amber-400">
                      <Crown className="w-8 h-8 text-amber-600" />
                    </div>
                    <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold shadow-lg">
                      1
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {team.members[0].user_name}
                    </p>
                    <p className="text-sm text-pink-600 dark:text-pink-400 font-medium">
                      {team.members[0].total_points.toLocaleString()} pts
                    </p>
                  </div>
                )}

                {/* 3rd place */}
                {team.members[2] && (
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-600 dark:text-gray-300">
                        {team.members[2].user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white font-bold text-sm">
                      3
                    </div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {team.members[2].user_name}
                    </p>
                    <p className="text-xs text-pink-600 dark:text-pink-400">
                      {team.members[2].total_points.toLocaleString()} pts
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
