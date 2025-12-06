'use client';

import { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  DollarSign,
  Trophy,
  Flame,
  TrendingUp,
  Swords,
  Star,
  Target,
  User,
  Clock,
} from 'lucide-react';
import type { ActivityFeedEvent, ActivityEventType } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================
// EVENT TYPE CONFIGURATION
// ============================================

interface EventTypeConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}

const EVENT_TYPE_CONFIG: Record<ActivityEventType, EventTypeConfig> = {
  new_sale: {
    icon: DollarSign,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'New Sale',
  },
  achievement_unlocked: {
    icon: Trophy,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    label: 'Achievement',
  },
  streak_milestone: {
    icon: Flame,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'Streak',
  },
  leaderboard_change: {
    icon: TrendingUp,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Rank Change',
  },
  team_battle_update: {
    icon: Swords,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    label: 'Team Battle',
  },
  points_earned: {
    icon: Star,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    borderColor: 'border-pink-200 dark:border-pink-800',
    label: 'Points',
  },
  goal_completed: {
    icon: Target,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    label: 'Goal',
  },
};

// ============================================
// VARIANTS
// ============================================

const feedItemVariants = cva(
  'relative flex gap-3 p-3 rounded-xl transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800',
        compact: 'bg-gray-50 dark:bg-gray-800/50',
        highlight: 'bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-200 dark:border-pink-800',
      },
      isNew: {
        true: 'ring-2 ring-pink-500/50 shadow-lg',
        false: '',
      },
      isRead: {
        true: 'opacity-70',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      isNew: false,
      isRead: false,
    },
  }
);

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else if (diffDay < 7) {
    return `${diffDay}d ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function getPointsFromMetadata(metadata: Record<string, unknown>): number | null {
  if (typeof metadata.points === 'number') {
    return metadata.points;
  }
  if (typeof metadata.points_earned === 'number') {
    return metadata.points_earned;
  }
  return null;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface ActivityFeedItemProps
  extends VariantProps<typeof feedItemVariants> {
  event: ActivityFeedEvent;
  showUserName?: boolean;
  showTimestamp?: boolean;
  onMarkRead?: (eventId: string) => void;
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ActivityFeedItem({
  event,
  variant = 'default',
  isNew = false,
  showUserName = true,
  showTimestamp = true,
  onMarkRead,
  className,
}: ActivityFeedItemProps) {
  const config = EVENT_TYPE_CONFIG[event.event_type];
  const Icon = config.icon;
  const points = getPointsFromMetadata(event.metadata);

  const handleClick = () => {
    if (!event.is_read && onMarkRead) {
      onMarkRead(event.id);
    }
  };

  return (
    <div
      className={cn(
        feedItemVariants({ variant, isNew, isRead: event.is_read }),
        className
      )}
      onClick={handleClick}
      role="article"
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          config.bgColor
        )}
      >
        <Icon className={cn('w-5 h-5', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {/* Title */}
            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
              {event.title}
            </p>

            {/* Description */}
            {event.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                {event.description}
              </p>
            )}

            {/* User name + timestamp row */}
            <div className="flex items-center gap-2 mt-1">
              {showUserName && event.user_name && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                  <User className="w-3 h-3" />
                  {event.user_name}
                </span>
              )}
              {showTimestamp && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(event.created_at)}
                </span>
              )}
            </div>
          </div>

          {/* Points badge (if applicable) */}
          {points !== null && points > 0 && (
            <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
              +{points}
            </span>
          )}
        </div>
      </div>

      {/* New indicator dot */}
      {isNew && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
      )}
    </div>
  );
}

// ============================================
// COMPACT VARIANT
// ============================================

export interface ActivityFeedItemCompactProps {
  event: ActivityFeedEvent;
  className?: string;
}

export function ActivityFeedItemCompact({
  event,
  className,
}: ActivityFeedItemCompactProps) {
  const config = EVENT_TYPE_CONFIG[event.event_type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 py-2 text-sm',
        className
      )}
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0', config.color)} />
      <span className="flex-1 truncate text-gray-700 dark:text-gray-300">
        {event.title}
      </span>
      <span className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
        {formatRelativeTime(event.created_at)}
      </span>
    </div>
  );
}

// ============================================
// SKELETON
// ============================================

export function ActivityFeedItemSkeleton() {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

export function ActivityFeedEmpty() {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Flame className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
        No activity yet
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Make your first sale to see activity here!
      </p>
    </div>
  );
}
