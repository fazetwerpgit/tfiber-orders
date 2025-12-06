'use client';

import * as React from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AchievementBadge, AchievementCard } from './AchievementBadge';
import { Trophy, Flame, Target, Star, Sparkles } from 'lucide-react';
import type { Achievement, UserAchievement, AchievementCategory } from '@/lib/types';

const CATEGORY_CONFIG: Record<
  AchievementCategory | 'all',
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  all: { label: 'All', icon: Trophy },
  milestone: { label: 'Milestones', icon: Target },
  streak: { label: 'Streaks', icon: Flame },
  sales: { label: 'Points', icon: Sparkles },
  special: { label: 'Special', icon: Star },
  team: { label: 'Team', icon: Trophy },
};

export interface AchievementGalleryProps {
  achievements: Achievement[];
  userAchievements: (UserAchievement & { achievement?: Achievement })[];
  progress?: {
    salesCount: number;
    streakDays: number;
    totalPoints: number;
  };
  view?: 'grid' | 'list';
  showCategories?: boolean;
  className?: string;
}

export function AchievementGallery({
  achievements,
  userAchievements,
  progress,
  view = 'grid',
  showCategories = true,
  className,
}: AchievementGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Create a map of unlocked achievements
  const unlockedMap = new Map(
    userAchievements.map((ua) => [ua.achievement_id, ua])
  );

  // Filter achievements by category
  const filteredAchievements =
    selectedCategory === 'all'
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);

  // Sort: unlocked first, then by sort_order
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    const aUnlocked = unlockedMap.has(a.id);
    const bUnlocked = unlockedMap.has(b.id);
    if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;
    return (a.sort_order || 0) - (b.sort_order || 0);
  });

  // Calculate progress percentage for an achievement
  const getProgress = (achievement: Achievement): number => {
    if (!progress) return 0;
    if (unlockedMap.has(achievement.id)) return 100;

    const conditionValue = achievement.condition_value || 1;

    switch (achievement.condition_type) {
      case 'sales_count':
        return Math.min(100, (progress.salesCount / conditionValue) * 100);
      case 'sales_streak':
        return Math.min(100, (progress.streakDays / conditionValue) * 100);
      case 'points_total':
        return Math.min(100, (progress.totalPoints / conditionValue) * 100);
      default:
        return 0;
    }
  };

  // Get available categories from achievements
  const availableCategories = [
    'all' as const,
    ...Array.from(new Set(achievements.map((a) => a.category as AchievementCategory))),
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Category Tabs */}
      {showCategories && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {availableCategories.map((category) => {
            const config = CATEGORY_CONFIG[category];
            const Icon = config.icon;
            const count =
              category === 'all'
                ? achievements.length
                : achievements.filter((a) => a.category === category).length;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                  selectedCategory === category
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{config.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-xs',
                    selectedCategory === category
                      ? 'bg-white/20'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {userAchievements.length}
          </div>
          <div className="text-xs text-green-700 dark:text-green-500">Unlocked</div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {achievements.length - userAchievements.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">Remaining</div>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
            {userAchievements.reduce(
              (sum, ua) => sum + (ua.achievement?.points_reward || 0),
              0
            )}
          </div>
          <div className="text-xs text-pink-700 dark:text-pink-500">Points Earned</div>
        </div>
      </div>

      {/* Achievements Grid/List */}
      {sortedAchievements.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No achievements in this category</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
          {sortedAchievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              userAchievement={unlockedMap.get(achievement.id)}
              size="md"
              showProgress
              progress={getProgress(achievement)}
              onClick={() => setSelectedAchievement(achievement)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              userAchievement={unlockedMap.get(achievement.id)}
              progress={getProgress(achievement)}
              onClick={() => setSelectedAchievement(achievement)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAchievement && (
        <AchievementDetailModal
          achievement={selectedAchievement}
          userAchievement={unlockedMap.get(selectedAchievement.id)}
          progress={getProgress(selectedAchievement)}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </div>
  );
}

// Detail modal for viewing achievement info
function AchievementDetailModal({
  achievement,
  userAchievement,
  progress,
  onClose,
}: {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  progress: number;
  onClose: () => void;
}) {
  const isUnlocked = !!userAchievement;
  const isSecret = achievement.is_secret && !isUnlocked;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in zoom-in-95 duration-200">
        <AchievementCard
          achievement={achievement}
          userAchievement={userAchievement}
          progress={progress}
        />

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Compact widget version for dashboard
export function AchievementWidget({
  achievements,
  userAchievements,
  onViewAll,
  className,
}: {
  achievements: Achievement[];
  userAchievements: (UserAchievement & { achievement?: Achievement })[];
  onViewAll?: () => void;
  className?: string;
}) {
  // Get recent unlocked (last 3)
  const recentUnlocked = userAchievements.slice(0, 3);

  // Get next closest to unlock (not secret, not unlocked, sorted by progress)
  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievement_id));
  const nextToUnlock = achievements
    .filter((a) => !unlockedIds.has(a.id) && !a.is_secret)
    .slice(0, 1)[0];

  return (
    <div
      className={cn(
        'p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Achievements</h3>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {userAchievements.length}/{achievements.length}
        </span>
      </div>

      {/* Recent unlocked */}
      {recentUnlocked.length > 0 ? (
        <div className="flex gap-3 mb-4">
          {recentUnlocked.map((ua) => (
            <AchievementBadge
              key={ua.id}
              achievement={ua.achievement!}
              userAchievement={ua}
              size="sm"
            />
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          No achievements unlocked yet. Start selling!
        </div>
      )}

      {/* Next to unlock */}
      {nextToUnlock && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Next up:</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {nextToUnlock.display_name}
          </div>
        </div>
      )}

      {onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full py-2 text-sm font-medium text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 rounded-lg transition-colors"
        >
          View All Achievements
        </button>
      )}
    </div>
  );
}
