'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ActivityFeedEvent, ActivityFeedFilters } from '@/lib/types';
import { getActivityFeed, getLatestActivity } from '@/actions/activity';

interface UseFeedPollingOptions {
  /** Polling interval in milliseconds (default: 15000) */
  pollingInterval?: number;
  /** Filters to apply to the feed */
  filters?: ActivityFeedFilters;
  /** Whether to start polling immediately (default: true) */
  enabled?: boolean;
  /** Maximum number of events to keep in state */
  maxEvents?: number;
}

interface UseFeedPollingResult {
  /** Current list of activity events */
  events: ActivityFeedEvent[];
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Number of new events since last view */
  newEventsCount: number;
  /** Manually refresh the feed */
  refresh: () => Promise<void>;
  /** Mark all events as seen (reset newEventsCount) */
  markAllSeen: () => void;
  /** Whether polling is currently active */
  isPolling: boolean;
  /** Pause/resume polling */
  togglePolling: () => void;
}

/**
 * Custom hook for polling the activity feed at regular intervals.
 *
 * This hook provides:
 * - Initial data fetch on mount
 * - Periodic polling for new events (configurable interval)
 * - New event count tracking
 * - Manual refresh capability
 * - Pause/resume polling
 */
export function useFeedPolling(options: UseFeedPollingOptions = {}): UseFeedPollingResult {
  const {
    pollingInterval = 15000, // 15 seconds default
    filters = {},
    enabled = true,
    maxEvents = 100,
  } = options;

  const [events, setEvents] = useState<ActivityFeedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEventsCount, setNewEventsCount] = useState(0);
  const [isPolling, setIsPolling] = useState(enabled);

  // Track the latest event timestamp for incremental fetching
  const latestTimestampRef = useRef<string | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initial fetch
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getActivityFeed({
      ...filters,
      limit: filters.limit || 50,
    });

    if (result.success && result.data) {
      setEvents(result.data);
      if (result.data.length > 0) {
        latestTimestampRef.current = result.data[0].created_at;
      }
    } else {
      setError(result.error || 'Failed to fetch activity feed');
    }

    setIsLoading(false);
  }, [filters]);

  // Poll for new events
  const pollForUpdates = useCallback(async () => {
    if (!latestTimestampRef.current) {
      return;
    }

    const result = await getLatestActivity(latestTimestampRef.current);

    if (result.success && result.data && result.data.length > 0) {
      setEvents((prev) => {
        // Prepend new events, avoiding duplicates
        const existingIds = new Set(prev.map((e) => e.id));
        const newEvents = result.data!.filter((e) => !existingIds.has(e.id));

        if (newEvents.length > 0) {
          // Update the latest timestamp
          latestTimestampRef.current = newEvents[0].created_at;
          // Increment new events count
          setNewEventsCount((count) => count + newEvents.length);
          // Prepend and trim to max
          return [...newEvents, ...prev].slice(0, maxEvents);
        }
        return prev;
      });
    }
  }, [maxEvents]);

  // Manual refresh
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchInitialData();
    setNewEventsCount(0);
  }, [fetchInitialData]);

  // Mark all as seen
  const markAllSeen = useCallback(() => {
    setNewEventsCount(0);
  }, []);

  // Toggle polling
  const togglePolling = useCallback(() => {
    setIsPolling((prev) => !prev);
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    if (enabled) {
      fetchInitialData();
    }
  }, [enabled, fetchInitialData]);

  // Polling effect
  useEffect(() => {
    if (!isPolling || isLoading) {
      return;
    }

    const poll = async () => {
      await pollForUpdates();
      pollingTimeoutRef.current = setTimeout(poll, pollingInterval);
    };

    // Start polling after initial interval
    pollingTimeoutRef.current = setTimeout(poll, pollingInterval);

    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, [isPolling, isLoading, pollingInterval, pollForUpdates]);

  return {
    events,
    isLoading,
    error,
    newEventsCount,
    refresh,
    markAllSeen,
    isPolling,
    togglePolling,
  };
}

/**
 * Hook for managing visibility-based polling.
 * Automatically pauses polling when the tab is hidden.
 */
export function useVisibilityPolling(
  isPolling: boolean,
  togglePolling: () => void
): void {
  const wasPollingRef = useRef(isPolling);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became hidden - remember state and pause
        wasPollingRef.current = isPolling;
        if (isPolling) {
          togglePolling();
        }
      } else {
        // Tab became visible - restore previous state
        if (wasPollingRef.current && !isPolling) {
          togglePolling();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPolling, togglePolling]);
}
