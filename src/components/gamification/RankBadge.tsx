'use client';

import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Trophy, Medal, Crown, Award } from 'lucide-react';

const rankBadgeVariants = cva(
  'inline-flex items-center justify-center rounded-full font-bold transition-all',
  {
    variants: {
      size: {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
      },
      rank: {
        first: 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-yellow-900 shadow-lg shadow-yellow-400/30',
        second: 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 text-gray-800 shadow-lg shadow-gray-400/30',
        third: 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-amber-100 shadow-lg shadow-amber-500/30',
        other: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
      },
    },
    defaultVariants: {
      size: 'md',
      rank: 'other',
    },
  }
);

export interface RankBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof rankBadgeVariants>, 'rank'> {
  rank: number;
  showIcon?: boolean;
  animate?: boolean;
}

function getRankVariant(rank: number): 'first' | 'second' | 'third' | 'other' {
  if (rank === 1) return 'first';
  if (rank === 2) return 'second';
  if (rank === 3) return 'third';
  return 'other';
}

function getRankIcon(rank: number, size: 'sm' | 'md' | 'lg' | 'xl' | null | undefined) {
  const iconSize = cn(
    size === 'sm' && 'w-4 h-4',
    size === 'md' && 'w-5 h-5',
    size === 'lg' && 'w-6 h-6',
    size === 'xl' && 'w-8 h-8',
    !size && 'w-5 h-5'
  );

  if (rank === 1) return <Crown className={iconSize} />;
  if (rank === 2) return <Trophy className={iconSize} />;
  if (rank === 3) return <Medal className={iconSize} />;
  return null;
}

export function RankBadge({
  rank,
  size,
  showIcon = true,
  animate = false,
  className,
  ...props
}: RankBadgeProps) {
  const rankVariant = getRankVariant(rank);
  const icon = showIcon ? getRankIcon(rank, size) : null;

  return (
    <div
      className={cn(
        rankBadgeVariants({ size, rank: rankVariant }),
        animate && rank <= 3 && 'animate-pulse',
        className
      )}
      {...props}
    >
      {icon || `#${rank}`}
    </div>
  );
}

// Extended rank display with rank number and label
export function RankDisplay({
  rank,
  label,
  size = 'md',
  showChange,
  change,
  className,
}: {
  rank: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showChange?: boolean;
  change?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <RankBadge rank={rank} size={size} />
      <div className="flex flex-col">
        <span className={cn(
          'font-bold text-gray-900 dark:text-white',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-lg',
          size === 'lg' && 'text-xl',
        )}>
          #{rank}
        </span>
        {label && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {label}
          </span>
        )}
        {showChange && change !== undefined && change !== 0 && (
          <span className={cn(
            'text-xs font-medium',
            change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}>
            {change > 0 ? `+${change}` : change}
          </span>
        )}
      </div>
    </div>
  );
}

// Podium display for top 3
export function Podium({
  first,
  second,
  third,
  className,
}: {
  first?: { name: string; points: number };
  second?: { name: string; points: number };
  third?: { name: string; points: number };
  className?: string;
}) {
  return (
    <div className={cn('flex items-end justify-center gap-2', className)}>
      {/* Second Place */}
      <div className="flex flex-col items-center">
        {second && (
          <>
            <RankBadge rank={2} size="lg" />
            <div className="mt-2 text-center">
              <div className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-20">
                {second.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {second.points.toLocaleString()} pts
              </div>
            </div>
          </>
        )}
        <div className="w-20 h-16 bg-gray-200 dark:bg-gray-700 rounded-t-lg mt-2" />
      </div>

      {/* First Place */}
      <div className="flex flex-col items-center">
        {first && (
          <>
            <RankBadge rank={1} size="xl" animate />
            <div className="mt-2 text-center">
              <div className="font-bold text-gray-900 dark:text-white truncate max-w-24">
                {first.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {first.points.toLocaleString()} pts
              </div>
            </div>
          </>
        )}
        <div className="w-24 h-24 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-lg mt-2 shadow-lg shadow-yellow-400/30" />
      </div>

      {/* Third Place */}
      <div className="flex flex-col items-center">
        {third && (
          <>
            <RankBadge rank={3} size="lg" />
            <div className="mt-2 text-center">
              <div className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-20">
                {third.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {third.points.toLocaleString()} pts
              </div>
            </div>
          </>
        )}
        <div className="w-20 h-12 bg-amber-500 dark:bg-amber-600 rounded-t-lg mt-2" />
      </div>
    </div>
  );
}
