'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Users, Crown, Trophy, Star, Swords } from 'lucide-react';
import type { Team, TeamLeaderboardEntry, TeamMemberStats } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================
// VARIANTS
// ============================================

const teamCardVariants = cva(
  'relative rounded-2xl overflow-hidden transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm',
        featured: 'bg-gradient-to-br shadow-lg',
        compact: 'bg-gray-50 dark:bg-gray-800/50',
      },
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// ============================================
// HELPER FUNCTIONS
// ============================================

function getTeamGradient(color: string): string {
  // Convert hex to gradient endpoints
  const baseColor = color || '#E20074';
  return `from-${baseColor}/20 via-${baseColor}/10 to-transparent`;
}

function getRankIcon(rank: number) {
  if (rank === 1) return { icon: Trophy, color: 'text-amber-500' };
  if (rank === 2) return { icon: Trophy, color: 'text-gray-400' };
  if (rank === 3) return { icon: Trophy, color: 'text-amber-700' };
  return { icon: Star, color: 'text-gray-400' };
}

// ============================================
// TEAM BADGE
// ============================================

export interface TeamBadgeProps {
  team: Pick<Team, 'display_name' | 'color' | 'icon'>;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function TeamBadge({
  team,
  size = 'md',
  showIcon = true,
  className,
}: TeamBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${team.color}20`,
        color: team.color,
      }}
    >
      {showIcon && team.icon && (
        <span className="text-sm">{team.icon}</span>
      )}
      {team.display_name}
    </span>
  );
}

// ============================================
// TEAM CARD
// ============================================

export interface TeamCardProps extends VariantProps<typeof teamCardVariants> {
  team: Team | TeamLeaderboardEntry;
  rank?: number;
  showRank?: boolean;
  showMembers?: boolean;
  showPoints?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TeamCard({
  team,
  rank,
  variant = 'default',
  size = 'md',
  showRank = false,
  showMembers = true,
  showPoints = true,
  onClick,
  className,
}: TeamCardProps) {
  const displayRank = rank ?? ('rank' in team ? team.rank : undefined);
  const memberCount = 'member_count' in team ? team.member_count : undefined;
  const totalPoints = 'total_points' in team ? team.total_points : 0;
  const rankInfo = displayRank ? getRankIcon(displayRank) : null;

  const cardStyle = variant === 'featured'
    ? {
        background: `linear-gradient(135deg, ${team.color}15 0%, ${team.color}05 100%)`,
        borderColor: team.color,
      }
    : undefined;

  return (
    <div
      className={cn(
        teamCardVariants({ variant, size }),
        onClick && 'cursor-pointer hover:shadow-md hover:scale-[1.02]',
        variant === 'featured' && 'border-2',
        className
      )}
      style={cardStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Rank badge */}
      {showRank && displayRank !== undefined && (
        <div className="absolute top-2 right-2">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
              displayRank <= 3
                ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            )}
          >
            {displayRank}
          </div>
        </div>
      )}

      {/* Team icon and name */}
      <div className="flex items-start gap-3">
        {/* Team color indicator / icon */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${team.color}20` }}
        >
          {team.icon || (
            <Users className="w-6 h-6" style={{ color: team.color }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Team name */}
          <h3 className="font-bold text-gray-900 dark:text-white truncate">
            {team.display_name}
          </h3>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-1 text-sm">
            {showMembers && memberCount !== undefined && (
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Users className="w-4 h-4" />
                {memberCount}
              </span>
            )}
            {showPoints && (
              <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-medium">
                <Star className="w-4 h-4 fill-current" />
                {totalPoints.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description (if available and large size) */}
      {size === 'lg' && 'description' in team && team.description && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {team.description}
        </p>
      )}
    </div>
  );
}

// ============================================
// TEAM BATTLE CARD
// ============================================

export interface TeamBattleCardProps {
  teams: TeamLeaderboardEntry[];
  battleName?: string;
  timeRemaining?: string;
  isActive?: boolean;
  className?: string;
}

export function TeamBattleCard({
  teams,
  battleName = 'Team Battle',
  timeRemaining,
  isActive = true,
  className,
}: TeamBattleCardProps) {
  // Sort by rank
  const sortedTeams = [...teams].sort((a, b) => a.rank - b.rank);
  const topTeams = sortedTeams.slice(0, 3);
  const leader = topTeams[0];
  const runnerUp = topTeams[1];

  return (
    <div
      className={cn(
        'relative bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-2xl p-5 border border-purple-200 dark:border-purple-800',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-bold text-gray-900 dark:text-white">
            {battleName}
          </h3>
        </div>
        {isActive && timeRemaining && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {timeRemaining} left
          </span>
        )}
      </div>

      {/* VS Display */}
      {leader && runnerUp ? (
        <div className="flex items-center justify-between gap-4">
          {/* Team 1 (Leader) */}
          <div className="flex-1 text-center">
            <div
              className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center text-3xl mb-2"
              style={{ backgroundColor: `${leader.color}20` }}
            >
              {leader.icon || <Users className="w-8 h-8" style={{ color: leader.color }} />}
            </div>
            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
              {leader.display_name}
            </p>
            <p
              className="text-lg font-bold"
              style={{ color: leader.color }}
            >
              {leader.total_points.toLocaleString()}
            </p>
          </div>

          {/* VS */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                VS
              </span>
            </div>
          </div>

          {/* Team 2 (Runner-up) */}
          <div className="flex-1 text-center">
            <div
              className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center text-3xl mb-2"
              style={{ backgroundColor: `${runnerUp.color}20` }}
            >
              {runnerUp.icon || <Users className="w-8 h-8" style={{ color: runnerUp.color }} />}
            </div>
            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
              {runnerUp.display_name}
            </p>
            <p
              className="text-lg font-bold"
              style={{ color: runnerUp.color }}
            >
              {runnerUp.total_points.toLocaleString()}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
          Not enough teams for battle
        </p>
      )}

      {/* Point difference */}
      {leader && runnerUp && (
        <div className="mt-3 text-center">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {leader.display_name} leads by{' '}
            <span className="font-bold" style={{ color: leader.color }}>
              {(leader.total_points - runnerUp.total_points).toLocaleString()}
            </span>{' '}
            pts
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================
// SKELETON
// ============================================

export function TeamCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}
