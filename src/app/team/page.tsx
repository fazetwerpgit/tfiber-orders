'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Sparkles, TrendingUp, RefreshCw } from 'lucide-react';
import { getLeaderboard, getUserPoints } from '@/actions/gamification';
import {
  LeaderboardList,
  PointsDisplay,
  StreakCard,
} from '@/components/gamification';
import type { LeaderboardEntry, TimeRange, UserPoints } from '@/lib/types';

export default function TeamPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [leaderboardResult, pointsResult] = await Promise.all([
        getLeaderboard(timeRange),
        getUserPoints(),
      ]);

      if (leaderboardResult.success && leaderboardResult.data) {
        setLeaderboard(leaderboardResult.data);
      }

      if (pointsResult.success && pointsResult.data) {
        setUserPoints(pointsResult.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  const handleRefresh = () => {
    loadData(true);
  };

  const currentUserEntry = leaderboard.find((e) => e.is_current_user);
  const currentUserRank = currentUserEntry?.rank || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Leaderboard
              </h1>
              <p className="text-sm text-pink-100 opacity-80">Points-based rankings</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Current User Stats Card */}
      {userPoints && (
        <div className="mx-4 -mt-4 bg-white dark:bg-gray-900 rounded-xl p-4 shadow-lg border-2 border-pink-200 dark:border-pink-800 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Your Rank</div>
              <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                {currentUserRank > 0 ? `#${currentUserRank}` : '--'}
              </div>
            </div>
            <div className="text-right">
              <PointsDisplay
                points={userPoints.total_points}
                size="lg"
                variant="gradient"
                showLabel
                showIcon={false}
              />
            </div>
          </div>

          {/* Streak & Progress */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Streak</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-orange-500">
                  {userPoints.streak_days}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">days</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lifetime Points</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userPoints.lifetime_points.toLocaleString()}
              </div>
            </div>
          </div>

          {currentUserRank > 1 && currentUserEntry && leaderboard[currentUserRank - 2] && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {leaderboard[currentUserRank - 2].total_points - currentUserEntry.total_points + 1} more points to reach #{currentUserRank - 1}!
              </span>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      <main className="px-4">
        <LeaderboardList
          entries={leaderboard}
          isLoading={loading}
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          showPodium={leaderboard.length >= 3}
          emptyMessage="No sales recorded for this period yet. Be the first!"
        />
      </main>

      {/* Info Banner */}
      <div className="mx-4 mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              How Points Work
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Standard sales earn 10 pts, upgrades 20 pts, multi-service 30 pts.
              Add-ons earn 5 pts each. Keep your streak going for bonus points!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
