'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { PointsBadge } from './PointsDisplay';
import { RankBadge } from './RankBadge';
import { StreakBadge } from './StreakIndicator';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/types';

export interface LeaderboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  entry: LeaderboardEntry;
  showRankChange?: boolean;
  showStreak?: boolean;
  showOrderCount?: boolean;
  highlighted?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LeaderboardCard({
  entry,
  showRankChange = true,
  showStreak = true,
  showOrderCount = false,
  highlighted = false,
  size = 'md',
  className,
  ...props
}: LeaderboardCardProps) {
  const isTopThree = entry.rank <= 3;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border transition-all',
        size === 'sm' && 'p-2',
        size === 'md' && 'p-3',
        size === 'lg' && 'p-4',
        highlighted
          ? 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800 ring-2 ring-pink-500/20'
          : isTopThree
          ? 'bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800',
        className
      )}
      {...props}
    >
      {/* Rank Badge */}
      <RankBadge
        rank={entry.rank}
        size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'}
        animate={isTopThree && highlighted}
      />

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-semibold truncate',
              size === 'sm' && 'text-sm',
              size === 'md' && 'text-base',
              size === 'lg' && 'text-lg',
              highlighted && 'text-pink-600 dark:text-pink-400',
              !highlighted && 'text-gray-900 dark:text-white'
            )}
          >
            {entry.user_name}
          </span>
          {entry.is_current_user && (
            <span className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded-full">
              You
            </span>
          )}
          {/* Badge icons */}
          {entry.badges && entry.badges.length > 0 && (
            <div className="flex items-center gap-0.5">
              {entry.badges.map((badge) => (
                <span
                  key={badge.id}
                  title={badge.name}
                  className="text-sm"
                >
                  {badge.icon || '🏆'}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 mt-0.5">
          {showOrderCount && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {entry.order_count} {entry.order_count === 1 ? 'sale' : 'sales'}
            </span>
          )}
          {showStreak && entry.streak_days > 0 && (
            <StreakBadge days={entry.streak_days} />
          )}
        </div>
      </div>

      {/* Points & Rank Change */}
      <div className="flex flex-col items-end gap-1">
        <PointsBadge points={entry.total_points} />

        {showRankChange && entry.rank_change !== null && entry.rank_change !== 0 && (
          <RankChangeIndicator change={entry.rank_change} size={size} />
        )}
      </div>
    </div>
  );
}

function RankChangeIndicator({
  change,
  size = 'md',
}: {
  change: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const isPositive = change > 0;
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 text-xs font-medium',
        isPositive
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400'
      )}
    >
      {isPositive ? (
        <TrendingUp className={iconSize} />
      ) : (
        <TrendingDown className={iconSize} />
      )}
      <span>{Math.abs(change)}</span>
    </div>
  );
}

// Compact version for sidebar/widget use
export function LeaderboardCardCompact({
  entry,
  className,
}: {
  entry: LeaderboardEntry;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 py-1.5',
        entry.is_current_user && 'bg-pink-50/50 dark:bg-pink-950/20 -mx-2 px-2 rounded-lg',
        className
      )}
    >
      <span
        className={cn(
          'w-6 text-center font-bold text-sm',
          entry.rank === 1 && 'text-yellow-500',
          entry.rank === 2 && 'text-gray-400',
          entry.rank === 3 && 'text-amber-600',
          entry.rank > 3 && 'text-gray-500 dark:text-gray-400'
        )}
      >
        {entry.rank}
      </span>
      <span
        className={cn(
          'flex-1 truncate text-sm flex items-center gap-1',
          entry.is_current_user
            ? 'font-semibold text-pink-600 dark:text-pink-400'
            : 'text-gray-700 dark:text-gray-300'
        )}
      >
        {entry.user_name}
        {/* Badge icons */}
        {entry.badges && entry.badges.length > 0 && (
          <span className="flex items-center gap-0.5 ml-1">
            {entry.badges.slice(0, 2).map((badge) => (
              <span key={badge.id} title={badge.name} className="text-xs">
                {badge.icon || '🏆'}
              </span>
            ))}
          </span>
        )}
      </span>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">
        {entry.total_points.toLocaleString()}
      </span>
    </div>
  );
}

// Skeleton loader for leaderboard cards
export function LeaderboardCardSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse',
        size === 'sm' && 'p-2',
        size === 'md' && 'p-3',
        size === 'lg' && 'p-4'
      )}
    >
      <div
        className={cn(
          'rounded-full bg-gray-200 dark:bg-gray-700',
          size === 'sm' && 'w-8 h-8',
          size === 'md' && 'w-10 h-10',
          size === 'lg' && 'w-12 h-12'
        )}
      />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
      </div>
      <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
    </div>
  );
}
