'use client';

import { useState, useEffect } from 'react';
import {
  RefreshCw,
  Bell,
  BellOff,
  ChevronDown,
  Filter,
  X,
} from 'lucide-react';
import type { ActivityFeedEvent, ActivityEventType } from '@/lib/types';
import {
  useFeedPolling,
  useVisibilityPolling,
} from '@/lib/hooks/useFeedPolling';
import { markActivityRead } from '@/actions/activity';
import {
  ActivityFeedItem,
  ActivityFeedItemCompact,
  ActivityFeedItemSkeleton,
  ActivityFeedEmpty,
} from './ActivityFeedItem';
import { cn } from '@/lib/utils';

// ============================================
// FILTER CONFIGURATION
// ============================================

interface FilterOption {
  value: ActivityEventType;
  label: string;
  emoji: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: 'new_sale', label: 'Sales', emoji: '💰' },
  { value: 'achievement_unlocked', label: 'Achievements', emoji: '🏆' },
  { value: 'streak_milestone', label: 'Streaks', emoji: '🔥' },
  { value: 'leaderboard_change', label: 'Rankings', emoji: '📈' },
  { value: 'team_battle_update', label: 'Battles', emoji: '⚔️' },
  { value: 'points_earned', label: 'Points', emoji: '⭐' },
  { value: 'goal_completed', label: 'Goals', emoji: '🎯' },
];

// ============================================
// COMPONENT PROPS
// ============================================

export interface ActivityFeedProps {
  /** Polling interval in ms (default: 15000) */
  pollingInterval?: number;
  /** Initial filters */
  initialFilters?: ActivityEventType[];
  /** Whether to show the header with controls */
  showHeader?: boolean;
  /** Whether to show filter options */
  showFilters?: boolean;
  /** Maximum height with scroll */
  maxHeight?: string;
  /** Compact mode for widget display */
  compact?: boolean;
  /** Number of items to show in compact mode */
  compactLimit?: number;
  /** Additional class names */
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ActivityFeed({
  pollingInterval = 15000,
  initialFilters = [],
  showHeader = true,
  showFilters = true,
  maxHeight,
  compact = false,
  compactLimit = 5,
  className,
}: ActivityFeedProps) {
  const [activeFilters, setActiveFilters] = useState<ActivityEventType[]>(initialFilters);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const {
    events,
    isLoading,
    error,
    newEventsCount,
    refresh,
    markAllSeen,
    isPolling,
    togglePolling,
  } = useFeedPolling({
    pollingInterval,
    filters: {
      event_types: activeFilters.length > 0 ? activeFilters : undefined,
      global_only: true,
    },
    enabled: true,
    maxEvents: compact ? compactLimit : 100,
  });

  // Pause polling when tab is hidden
  useVisibilityPolling(isPolling, togglePolling);

  // Filter toggle
  const toggleFilter = (eventType: ActivityEventType) => {
    setActiveFilters((prev) =>
      prev.includes(eventType)
        ? prev.filter((f) => f !== eventType)
        : [...prev, eventType]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters([]);
  };

  // Handle mark as read
  const handleMarkRead = async (eventId: string) => {
    await markActivityRead([eventId]);
  };

  // Handle "show new events" click
  const handleShowNew = () => {
    markAllSeen();
    // Scroll to top if there's a container
  };

  // Displayed events (apply compact limit if needed)
  const displayedEvents = compact ? events.slice(0, compactLimit) : events;

  // Render content
  const renderContent = () => {
    if (isLoading && events.length === 0) {
      return (
        <div className="space-y-2">
          {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
            <ActivityFeedItemSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8 px-4">
          <p className="text-red-500 dark:text-red-400 mb-2">{error}</p>
          <button
            onClick={refresh}
            className="text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
          >
            Try again
          </button>
        </div>
      );
    }

    if (displayedEvents.length === 0) {
      return <ActivityFeedEmpty />;
    }

    return (
      <div className="space-y-2">
        {displayedEvents.map((event, index) => {
          const isNew = index < newEventsCount;
          return compact ? (
            <ActivityFeedItemCompact key={event.id} event={event} />
          ) : (
            <ActivityFeedItem
              key={event.id}
              event={event}
              isNew={isNew}
              onMarkRead={handleMarkRead}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Activity
            </h3>
            {newEventsCount > 0 && (
              <button
                onClick={handleShowNew}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 animate-pulse"
              >
                {newEventsCount} new
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Filter button */}
            {showFilters && (
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  showFilterMenu || activeFilters.length > 0
                    ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <Filter className="w-4 h-4" />
                {activeFilters.length > 0 && (
                  <span className="sr-only">
                    {activeFilters.length} filters active
                  </span>
                )}
              </button>
            )}

            {/* Polling toggle */}
            <button
              onClick={togglePolling}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isPolling
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-500'
              )}
              title={isPolling ? 'Auto-refresh on' : 'Auto-refresh off'}
            >
              {isPolling ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </button>

            {/* Refresh button */}
            <button
              onClick={refresh}
              disabled={isLoading}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={cn('w-4 h-4', isLoading && 'animate-spin')}
              />
            </button>
          </div>
        </div>
      )}

      {/* Filter pills */}
      {showFilters && showFilterMenu && (
        <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleFilter(option.value)}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                activeFilters.includes(option.value)
                  ? 'bg-pink-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              )}
            >
              <span>{option.emoji}</span>
              {option.label}
            </button>
          ))}
          {activeFilters.length > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      )}

      {/* Feed content */}
      <div
        className={cn(
          'flex-1',
          maxHeight && 'overflow-y-auto'
        )}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {renderContent()}
      </div>
    </div>
  );
}

// ============================================
// WIDGET VARIANT
// ============================================

export interface ActivityFeedWidgetProps {
  /** Number of items to show */
  limit?: number;
  /** Title for the widget */
  title?: string;
  /** Link to full feed */
  viewAllHref?: string;
  /** Class name */
  className?: string;
}

export function ActivityFeedWidget({
  limit = 5,
  title = 'Recent Activity',
  viewAllHref,
  className,
}: ActivityFeedWidgetProps) {
  const { events, isLoading, newEventsCount } = useFeedPolling({
    pollingInterval: 30000, // 30 seconds for widget
    filters: { global_only: true },
    maxEvents: limit,
  });

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
          {title}
          {newEventsCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-pink-600 text-white">
              {newEventsCount > 9 ? '9+' : newEventsCount}
            </span>
          )}
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
      {isLoading && events.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No recent activity
        </p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {events.slice(0, limit).map((event) => (
            <ActivityFeedItemCompact key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
