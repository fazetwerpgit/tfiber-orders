'use client';

import { Crown, Star, Flame, TrendingUp, User } from 'lucide-react';
import type { TeamMemberStats } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================
// TEAM MEMBER ROW
// ============================================

export interface TeamMemberRowProps {
  member: TeamMemberStats;
  rank?: number;
  isCurrentUser?: boolean;
  showStats?: boolean;
  className?: string;
}

export function TeamMemberRow({
  member,
  rank,
  isCurrentUser = false,
  showStats = true,
  className,
}: TeamMemberRowProps) {
  const isCaptain = member.role === 'captain';

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-colors',
        isCurrentUser
          ? 'bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        className
      )}
    >
      {/* Rank */}
      {rank !== undefined && (
        <div className="flex-shrink-0 w-6 text-center">
          {rank <= 3 ? (
            <span className={cn(
              'text-lg font-bold',
              rank === 1 && 'text-amber-500',
              rank === 2 && 'text-gray-400',
              rank === 3 && 'text-amber-700'
            )}>
              {rank}
            </span>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {rank}
            </span>
          )}
        </div>
      )}

      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            isCaptain
              ? 'bg-amber-100 dark:bg-amber-900/30'
              : 'bg-gray-100 dark:bg-gray-800'
          )}
        >
          {isCaptain ? (
            <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          ) : (
            <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </div>

      {/* Name and email */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {member.user_name}
          </p>
          {isCaptain && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              Captain
            </span>
          )}
          {isCurrentUser && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400">
              You
            </span>
          )}
        </div>
        {showStats && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {member.user_email}
          </p>
        )}
      </div>

      {/* Stats */}
      {showStats && (
        <div className="flex items-center gap-4 text-sm">
          {/* Points */}
          <div className="flex items-center gap-1 text-pink-600 dark:text-pink-400">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-medium">
              {member.total_points.toLocaleString()}
            </span>
          </div>

          {/* Streak */}
          {member.streak_days > 0 && (
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="w-4 h-4 fill-current" />
              <span className="font-medium">{member.streak_days}</span>
            </div>
          )}

          {/* Sales count */}
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>{member.total_sales}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// TEAM MEMBER LIST
// ============================================

export interface TeamMemberListProps {
  members: TeamMemberStats[];
  currentUserId?: string;
  showRanks?: boolean;
  showStats?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function TeamMemberList({
  members,
  currentUserId,
  showRanks = true,
  showStats = true,
  emptyMessage = 'No team members yet',
  className,
}: TeamMemberListProps) {
  // Sort by points descending
  const sortedMembers = [...members].sort(
    (a, b) => b.total_points - a.total_points
  );

  if (sortedMembers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {sortedMembers.map((member, index) => (
        <TeamMemberRow
          key={member.user_id}
          member={member}
          rank={showRanks ? index + 1 : undefined}
          isCurrentUser={member.user_id === currentUserId}
          showStats={showStats}
        />
      ))}
    </div>
  );
}

// ============================================
// COMPACT MEMBER LIST
// ============================================

export interface TeamMemberListCompactProps {
  members: TeamMemberStats[];
  limit?: number;
  className?: string;
}

export function TeamMemberListCompact({
  members,
  limit = 5,
  className,
}: TeamMemberListCompactProps) {
  // Sort by points and take top N
  const topMembers = [...members]
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, limit);

  return (
    <div className={cn('flex -space-x-2', className)}>
      {topMembers.map((member, index) => (
        <div
          key={member.user_id}
          className={cn(
            'relative w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-medium',
            member.role === 'captain'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          )}
          title={member.user_name}
          style={{ zIndex: topMembers.length - index }}
        >
          {member.user_name.charAt(0).toUpperCase()}
        </div>
      ))}
      {members.length > limit && (
        <div
          className="relative w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300"
          style={{ zIndex: 0 }}
        >
          +{members.length - limit}
        </div>
      )}
    </div>
  );
}

// ============================================
// SKELETON
// ============================================

export function TeamMemberRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
      <div className="flex gap-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8" />
      </div>
    </div>
  );
}
