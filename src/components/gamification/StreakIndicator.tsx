'use client';

import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Flame, Zap, Calendar } from 'lucide-react';

const streakIndicatorVariants = cva(
  'inline-flex items-center gap-1.5 font-bold transition-all',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-xl',
        xl: 'text-2xl',
      },
      variant: {
        default: 'text-orange-500 dark:text-orange-400',
        hot: 'text-red-500 dark:text-red-400',
        fire: 'text-amber-500 dark:text-amber-400',
        cold: 'text-gray-400 dark:text-gray-500',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface StreakIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof streakIndicatorVariants> {
  days: number;
  showLabel?: boolean;
  showFlame?: boolean;
  longestStreak?: number;
  animate?: boolean;
}

function getStreakVariant(days: number): 'cold' | 'default' | 'hot' | 'fire' {
  if (days === 0) return 'cold';
  if (days < 3) return 'default';
  if (days < 7) return 'hot';
  return 'fire';
}

function getFlameCount(days: number): number {
  if (days === 0) return 0;
  if (days < 7) return 1;
  if (days < 14) return 2;
  return 3;
}

export function StreakIndicator({
  days,
  size,
  variant,
  showLabel = true,
  showFlame = true,
  longestStreak,
  animate = false,
  className,
  ...props
}: StreakIndicatorProps) {
  const effectiveVariant = variant || getStreakVariant(days);
  const flameCount = getFlameCount(days);

  return (
    <div className={cn('flex flex-col', className)} {...props}>
      <div className={cn(streakIndicatorVariants({ size, variant: effectiveVariant }))}>
        {showFlame && (
          <span className={cn('inline-flex', animate && days > 0 && 'animate-pulse')}>
            {Array.from({ length: Math.max(1, flameCount) }).map((_, i) => (
              <Flame
                key={i}
                className={cn(
                  size === 'sm' && 'w-4 h-4',
                  size === 'md' && 'w-5 h-5',
                  size === 'lg' && 'w-6 h-6',
                  size === 'xl' && 'w-7 h-7',
                  !size && 'w-5 h-5',
                  i > 0 && '-ml-1.5',
                  days === 0 && 'opacity-30'
                )}
              />
            ))}
          </span>
        )}
        <span>{days}</span>
        {showLabel && (
          <span className={cn(
            'font-medium text-gray-500 dark:text-gray-400',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
            size === 'xl' && 'text-lg',
          )}>
            {days === 1 ? 'day' : 'days'}
          </span>
        )}
      </div>

      {longestStreak !== undefined && longestStreak > days && (
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          Best: {longestStreak} days
        </div>
      )}
    </div>
  );
}

// Streak card for dashboard display
export function StreakCard({
  currentStreak,
  longestStreak,
  lastActivityDate,
  className,
}: {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string | null;
  className?: string;
}) {
  const isActive = currentStreak > 0;
  const streakAtRisk = lastActivityDate &&
    new Date().toDateString() !== new Date(lastActivityDate).toDateString();

  return (
    <div className={cn(
      'p-4 rounded-xl border',
      isActive
        ? 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800'
        : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800',
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Current Streak
        </span>
        {streakAtRisk && currentStreak > 0 && (
          <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
            At Risk!
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <StreakIndicator days={currentStreak} size="xl" animate={isActive} />
      </div>

      <div className="mt-3 pt-3 border-t border-orange-200/50 dark:border-orange-800/50 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span>Best: {longestStreak} days</span>
        </div>
        {lastActivityDate && (
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(lastActivityDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact streak badge for lists
export function StreakBadge({
  days,
  className,
}: {
  days: number;
  className?: string;
}) {
  if (days === 0) return null;

  const variant = getStreakVariant(days);

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
      variant === 'fire' && 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      variant === 'hot' && 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      variant === 'default' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      className
    )}>
      <Flame className="w-3 h-3" />
      {days}
    </div>
  );
}
