'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, RefreshCw, Grid, List } from 'lucide-react';
import { getUserAchievements, getAchievementProgress } from '@/actions/achievements';
import { AchievementGallery } from '@/components/gamification/AchievementGallery';
import type { Achievement, UserAchievement } from '@/lib/types';

export default function AchievementsPage() {
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<
    (UserAchievement & { achievement: Achievement })[]
  >([]);
  const [progress, setProgress] = useState<{
    salesCount: number;
    streakDays: number;
    totalPoints: number;
  } | null>(null);
  const [stats, setStats] = useState<{
    totalUnlocked: number;
    totalAvailable: number;
    totalPoints: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [achievementsResult, progressResult] = await Promise.all([
        getUserAchievements(),
        getAchievementProgress(),
      ]);

      if (achievementsResult.success && achievementsResult.data) {
        // Combine unlocked achievements with their full data
        const allAchievements = [
          ...achievementsResult.data.unlocked.map((ua) => ua.achievement),
          ...achievementsResult.data.available,
        ].filter(Boolean) as Achievement[];

        // Deduplicate by ID
        const uniqueAchievements = Array.from(
          new Map(allAchievements.map((a) => [a.id, a])).values()
        );

        setAchievements(uniqueAchievements);
        setUserAchievements(achievementsResult.data.unlocked);
        setStats({
          totalUnlocked: achievementsResult.data.stats.totalUnlocked,
          totalAvailable: achievementsResult.data.stats.totalAvailable,
          totalPoints: achievementsResult.data.stats.totalPoints,
        });
      }

      if (progressResult.success && progressResult.data) {
        setProgress(progressResult.data);
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData(true);
  };

  const completionPercent = stats
    ? Math.round((stats.totalUnlocked / stats.totalAvailable) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 text-white px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Achievements
              </h1>
              <p className="text-sm text-white/80">
                {stats?.totalUnlocked || 0} of {stats?.totalAvailable || 0} unlocked
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {view === 'grid' ? (
                <List className="w-5 h-5" />
              ) : (
                <Grid className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Completion Progress */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-lg font-bold">{completionPercent}%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          {stats && stats.totalPoints > 0 && (
            <div className="mt-2 text-sm text-white/80">
              {stats.totalPoints.toLocaleString()} points earned from achievements
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {loading ? (
          <div className="space-y-4">
            {/* Loading skeleton */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"
                />
              ))}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
                  <div className="w-12 h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <AchievementGallery
            achievements={achievements}
            userAchievements={userAchievements}
            progress={progress || undefined}
            view={view}
            showCategories
          />
        )}
      </main>
    </div>
  );
}
