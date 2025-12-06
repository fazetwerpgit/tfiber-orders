'use client';

import { useState, useEffect } from 'react';
import { Trophy, Users, Star, TrendingUp } from 'lucide-react';
import type { TeamLeaderboardEntry } from '@/lib/types';
import { getTeamLeaderboard } from '@/actions/teams';
import { TeamCard, TeamCardSkeleton } from './TeamCard';
import { cn } from '@/lib/utils';

// ============================================
// TEAM LEADERBOARD ENTRY
// ============================================

export interface TeamLeaderboardRowProps {
  entry: TeamLeaderboardEntry;
  isMyTeam?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TeamLeaderboardRow({
  entry,
  isMyTeam = false,
  onClick,
  className,
}: TeamLeaderboardRowProps) {
  const isTop3 = entry.rank <= 3;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-all',
        isMyTeam
          ? 'bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Rank */}
      <div className="flex-shrink-0 w-8 text-center">
        {isTop3 ? (
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
              entry.rank === 1 && 'bg-gradient-to-br from-amber-400 to-amber-600 text-white',
              entry.rank === 2 && 'bg-gradient-to-br from-gray-300 to-gray-400 text-white',
              entry.rank === 3 && 'bg-gradient-to-br from-amber-600 to-amber-800 text-white'
            )}
          >
            {entry.rank}
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 font-medium">
            {entry.rank}
          </span>
        )}
      </div>

      {/* Team icon */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
        style={{ backgroundColor: `${entry.color}20` }}
      >
        {entry.icon || (
          <Users className="w-5 h-5" style={{ color: entry.color }} />
        )}
      </div>

      {/* Team info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {entry.display_name}
          </p>
          {isMyTeam && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400">
              Your Team
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Users className="w-3 h-3" />
          {entry.member_count} member{entry.member_count !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Points */}
      <div className="flex-shrink-0 text-right">
        <p
          className="font-bold text-lg"
          style={{ color: entry.color }}
        >
          {entry.total_points.toLocaleString()}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          pts
        </p>
      </div>
    </div>
  );
}

// ============================================
// TEAM LEADERBOARD
// ============================================

export interface TeamLeaderboardProps {
  /** Pre-fetched entries (optional, will fetch if not provided) */
  initialEntries?: TeamLeaderboardEntry[];
  /** Current user's team ID */
  currentTeamId?: string;
  /** Callback when team is clicked */
  onTeamClick?: (teamId: string) => void;
  /** Whether to show loading skeleton */
  loading?: boolean;
  /** Additional class names */
  className?: string;
}

export function TeamLeaderboard({
  initialEntries,
  currentTeamId,
  onTeamClick,
  loading = false,
  className,
}: TeamLeaderboardProps) {
  const [entries, setEntries] = useState<TeamLeaderboardEntry[]>(
    initialEntries || []
  );
  const [isLoading, setIsLoading] = useState(!initialEntries && !loading);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialEntries) {
      fetchLeaderboard();
    }
  }, [initialEntries]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError(null);

    const result = await getTeamLeaderboard();

    if (result.success && result.data) {
      setEntries(result.data);
    } else {
      setError(result.error || 'Failed to fetch leaderboard');
    }

    setIsLoading(false);
  };

  if (loading || isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <TeamCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No teams yet
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {entries.map((entry) => (
        <TeamLeaderboardRow
          key={entry.team_id}
          entry={entry}
          isMyTeam={entry.team_id === currentTeamId}
          onClick={onTeamClick ? () => onTeamClick(entry.team_id) : undefined}
        />
      ))}
    </div>
  );
}

// ============================================
// TEAM LEADERBOARD WIDGET
// ============================================

export interface TeamLeaderboardWidgetProps {
  currentTeamId?: string;
  limit?: number;
  title?: string;
  viewAllHref?: string;
  className?: string;
}

export function TeamLeaderboardWidget({
  currentTeamId,
  limit = 3,
  title = 'Team Rankings',
  viewAllHref,
  className,
}: TeamLeaderboardWidgetProps) {
  const [entries, setEntries] = useState<TeamLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const result = await getTeamLeaderboard();
    if (result.success && result.data) {
      setEntries(result.data.slice(0, limit));
    }
    setIsLoading(false);
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-800',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          {title}
        </h3>
        {viewAllHref && (
          <a
            href={viewAllHref}
            className="text-sm text-pink-600 dark:text-pink-400 hover:underline"
          >
            View all
          </a>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: limit }).map((_, i) => (
            <div
              key={i}
              className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No teams yet
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <TeamLeaderboardRow
              key={entry.team_id}
              entry={entry}
              isMyTeam={entry.team_id === currentTeamId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
