'use client';

import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

const pointsDisplayVariants = cva(
  'inline-flex items-center gap-2 font-bold transition-all',
  {
    variants: {
      size: {
        sm: 'text-lg',
        md: 'text-2xl',
        lg: 'text-4xl',
        xl: 'text-5xl',
      },
      variant: {
        default: 'text-gray-900 dark:text-white',
        gradient: 'bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent',
        magenta: 'text-pink-600 dark:text-pink-400',
        gold: 'text-yellow-500 dark:text-yellow-400',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface PointsDisplayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pointsDisplayVariants> {
  points: number;
  showIcon?: boolean;
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
  change?: number;
  showChange?: boolean;
}

export function PointsDisplay({
  points,
  size,
  variant,
  showIcon = true,
  showLabel = false,
  label = 'points',
  animate = false,
  change,
  showChange = false,
  className,
  ...props
}: PointsDisplayProps) {
  const [displayPoints, setDisplayPoints] = React.useState(animate ? 0 : points);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (!animate) {
      setDisplayPoints(points);
      return;
    }

    setIsAnimating(true);
    const duration = 1000;
    const startTime = Date.now();
    const startValue = displayPoints;
    const endValue = points;

    const animateValue = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOut);

      setDisplayPoints(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animateValue);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animateValue);
  }, [points, animate]);

  const formattedPoints = displayPoints.toLocaleString();

  return (
    <div className={cn('flex flex-col', className)} {...props}>
      <div className="flex items-center gap-2">
        {showIcon && (
          <Sparkles
            className={cn(
              'text-pink-500',
              size === 'sm' && 'w-4 h-4',
              size === 'md' && 'w-5 h-5',
              size === 'lg' && 'w-7 h-7',
              size === 'xl' && 'w-9 h-9',
              isAnimating && 'animate-pulse'
            )}
          />
        )}
        <span className={cn(pointsDisplayVariants({ size, variant }), isAnimating && 'animate-pulse')}>
          {formattedPoints}
        </span>
        {showLabel && (
          <span className={cn(
            'text-gray-500 dark:text-gray-400 font-medium',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
            size === 'xl' && 'text-lg',
          )}>
            {label}
          </span>
        )}
      </div>

      {showChange && change !== undefined && change !== 0 && (
        <div className={cn(
          'flex items-center gap-1 text-sm font-medium',
          change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        )}>
          {change > 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{change > 0 ? '+' : ''}{change.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

// Compact points badge for use in cards/lists
export function PointsBadge({
  points,
  className,
}: {
  points: number;
  className?: string;
}) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-2.5 py-1 rounded-full text-sm font-semibold',
      className
    )}>
      <Sparkles className="w-3.5 h-3.5" />
      {points.toLocaleString()}
    </div>
  );
}
