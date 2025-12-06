'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { LeaderboardCard, LeaderboardCardCompact, LeaderboardCardSkeleton } from './LeaderboardCard';
import { Podium } from './RankBadge';
import type { LeaderboardEntry, TimeRange } from '@/lib/types';
import { Trophy, Users, Clock } from 'lucide-react';

export interface LeaderboardListProps extends React.HTMLAttributes<HTMLDivElement> {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  currentUserId?: string;
  showPodium?: boolean;
  showTimeRangeSelector?: boolean;
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  emptyMessage?: string;
}

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all-time', label: 'All Time' },
];

export function LeaderboardList({
  entries,
  isLoading = false,
  currentUserId,
  showPodium = true,
  showTimeRangeSelector = true,
  timeRange = 'week',
  onTimeRangeChange,
  emptyMessage = 'No sales yet for this period',
  className,
  ...props
}: LeaderboardListProps) {
  // Separate top 3 for podium display
  const topThree = entries.slice(0, 3);
  const restOfList = showPodium ? entries.slice(3) : entries;

  // Find current user if not in visible list
  const currentUserEntry = entries.find((e) => e.is_current_user);
  const currentUserInView = restOfList.some((e) => e.is_current_user);

  return (
    <div className={cn('space-y-4', className)} {...props}>
      {/* Time Range Selector */}
      {showTimeRangeSelector && (
        <TimeRangeSelector
          value={timeRange}
          onChange={onTimeRangeChange}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <LeaderboardCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && entries.length === 0 && (
        <EmptyLeaderboard message={emptyMessage} />
      )}

      {/* Podium Display */}
      {!isLoading && showPodium && topThree.length >= 1 && (
        <Podium
          first={topThree[0] ? { name: topThree[0].user_name, points: topThree[0].total_points } : undefined}
          second={topThree[1] ? { name: topThree[1].user_name, points: topThree[1].total_points } : undefined}
          third={topThree[2] ? { name: topThree[2].user_name, points: topThree[2].total_points } : undefined}
          className="py-6"
        />
      )}

      {/* Full List */}
      {!isLoading && restOfList.length > 0 && (
        <div className="space-y-2">
          {showPodium && (
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1">
              Other Rankings
            </h3>
          )}
          {restOfList.map((entry) => (
            <LeaderboardCard
              key={entry.user_id}
              entry={entry}
              highlighted={entry.is_current_user}
              showStreak
              showOrderCount
            />
          ))}
        </div>
      )}

      {/* Current User Position (if not visible in list) */}
      {!isLoading && currentUserEntry && !currentUserInView && !showPodium && (
        <CurrentUserPosition entry={currentUserEntry} totalEntries={entries.length} />
      )}
    </div>
  );
}

function TimeRangeSelector({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange?: (range: TimeRange) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {TIME_RANGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange?.(option.value)}
          className={cn(
            'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all',
            value === option.value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function EmptyLeaderboard({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Trophy className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        No Rankings Yet
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        {message}
      </p>
    </div>
  );
}

function CurrentUserPosition({
  entry,
  totalEntries,
}: {
  entry: LeaderboardEntry;
  totalEntries: number;
}) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Your Position
      </div>
      <LeaderboardCard entry={entry} highlighted showStreak showOrderCount />
      <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
        Rank {entry.rank} of {totalEntries}
      </div>
    </div>
  );
}

// Compact widget version for dashboard sidebar
export function LeaderboardWidget({
  entries,
  isLoading = false,
  timeRange = 'week',
  onViewAll,
  className,
}: {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  timeRange?: TimeRange;
  onViewAll?: () => void;
  className?: string;
}) {
  const topFive = entries.slice(0, 5);
  const currentUserEntry = entries.find((e) => e.is_current_user);
  const currentUserInTopFive = topFive.some((e) => e.is_current_user);

  return (
    <div
      className={cn(
        'p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Leaderboard
          </h3>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
          {timeRange.replace('-', ' ')}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 animate-pulse">
              <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          No rankings yet
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {topFive.map((entry) => (
              <LeaderboardCardCompact key={entry.user_id} entry={entry} />
            ))}
          </div>

          {/* Show current user if not in top 5 */}
          {currentUserEntry && !currentUserInTopFive && (
            <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Your position
              </div>
              <LeaderboardCardCompact entry={currentUserEntry} />
            </div>
          )}
        </>
      )}

      {onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full mt-3 py-2 text-sm font-medium text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 rounded-lg transition-colors"
        >
          View Full Leaderboard
        </button>
      )}
    </div>
  );
}

// Team leaderboard variant
export function TeamLeaderboardList({
  teams,
  isLoading = false,
  className,
}: {
  teams: {
    team_id: string;
    name: string;
    display_name: string;
    color: string;
    member_count: number;
    total_points: number;
    rank: number;
  }[];
  isLoading?: boolean;
  className?: string;
}) {
  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <LeaderboardCardSkeleton key={i} size="lg" />
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          No Teams Yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Teams will appear here once created
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {teams.map((team) => (
        <div
          key={team.team_id}
          className={cn(
            'flex items-center gap-4 p-4 rounded-xl border transition-all',
            team.rank === 1
              ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-200 dark:border-yellow-800'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
          )}
        >
          {/* Rank */}
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg',
              team.rank === 1 && 'bg-yellow-400 text-yellow-900',
              team.rank === 2 && 'bg-gray-300 text-gray-800',
              team.rank === 3 && 'bg-amber-500 text-amber-100',
              team.rank > 3 && 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            )}
          >
            {team.rank}
          </div>

          {/* Team Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: team.color }}
              />
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {team.display_name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              <Users className="w-3.5 h-3.5" />
              <span>{team.member_count} members</span>
            </div>
          </div>

          {/* Points */}
          <div className="text-right">
            <div className="font-bold text-lg text-gray-900 dark:text-white">
              {team.total_points.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              points
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
