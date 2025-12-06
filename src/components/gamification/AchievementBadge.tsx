'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Star,
  Flame,
  Target,
  Award,
  Zap,
  Lock,
  Sparkles,
  Medal,
  Crown,
} from 'lucide-react';
import type { Achievement, UserAchievement, AchievementCategory } from '@/lib/types';

// Icon mapping for achievements
const ACHIEVEMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  star: Star,
  flame: Flame,
  target: Target,
  award: Award,
  zap: Zap,
  sparkles: Sparkles,
  medal: Medal,
  crown: Crown,
};

// Category colors
const CATEGORY_COLORS: Record<AchievementCategory, { bg: string; text: string; border: string }> = {
  milestone: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  streak: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
  },
  sales: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-200 dark:border-pink-800',
  },
  special: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  team: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
};

export interface AchievementBadgeProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  progress?: number; // 0-100 for locked achievements
  onClick?: () => void;
  className?: string;
}

export function AchievementBadge({
  achievement,
  userAchievement,
  size = 'md',
  showProgress = false,
  progress = 0,
  onClick,
  className,
}: AchievementBadgeProps) {
  const isUnlocked = !!userAchievement;
  const isSecret = achievement.is_secret && !isUnlocked;
  const category = achievement.category as AchievementCategory;
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.milestone;

  const IconComponent = ACHIEVEMENT_ICONS[achievement.icon || 'trophy'] || Trophy;

  const sizeClasses = {
    sm: {
      container: 'w-16 h-16',
      icon: 'w-6 h-6',
      iconBg: 'w-10 h-10',
    },
    md: {
      container: 'w-20 h-20',
      icon: 'w-8 h-8',
      iconBg: 'w-12 h-12',
    },
    lg: {
      container: 'w-24 h-24',
      icon: 'w-10 h-10',
      iconBg: 'w-16 h-16',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 cursor-pointer transition-transform hover:scale-105',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Badge Circle */}
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center transition-all',
          sizes.container,
          isUnlocked
            ? cn(colors.bg, colors.border, 'border-2 shadow-lg')
            : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            'rounded-full flex items-center justify-center',
            sizes.iconBg,
            isUnlocked
              ? cn(colors.text)
              : 'text-gray-400 dark:text-gray-500'
          )}
        >
          {isSecret ? (
            <Lock className={sizes.icon} />
          ) : (
            <IconComponent className={sizes.icon} />
          )}
        </div>

        {/* Unlocked checkmark */}
        {isUnlocked && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}

        {/* Progress ring for locked achievements */}
        {!isUnlocked && showProgress && progress > 0 && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${progress * 2.89} 289`}
              className={colors.text}
            />
          </svg>
        )}
      </div>

      {/* Name */}
      <div className="text-center">
        <div
          className={cn(
            'font-semibold truncate max-w-20',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
            isUnlocked
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {isSecret ? '???' : achievement.display_name}
        </div>
        {isUnlocked && achievement.points_reward > 0 && (
          <div className="text-xs text-pink-600 dark:text-pink-400 font-medium">
            +{achievement.points_reward} pts
          </div>
        )}
      </div>
    </div>
  );
}

// Card variant for detailed display
export function AchievementCard({
  achievement,
  userAchievement,
  progress = 0,
  onClick,
  className,
}: {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  progress?: number;
  onClick?: () => void;
  className?: string;
}) {
  const isUnlocked = !!userAchievement;
  const isSecret = achievement.is_secret && !isUnlocked;
  const category = achievement.category as AchievementCategory;
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.milestone;

  const IconComponent = ACHIEVEMENT_ICONS[achievement.icon || 'trophy'] || Trophy;

  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-all',
        isUnlocked
          ? cn(colors.bg, colors.border, 'shadow-sm')
          : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800',
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
            isUnlocked
              ? cn(colors.text, 'bg-white/50 dark:bg-black/20')
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
          )}
        >
          {isSecret ? (
            <Lock className="w-6 h-6" />
          ) : (
            <IconComponent className="w-6 h-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={cn(
                'font-semibold truncate',
                isUnlocked
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              {isSecret ? 'Secret Achievement' : achievement.display_name}
            </h3>
            {isUnlocked && (
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                Unlocked
              </span>
            )}
          </div>

          <p
            className={cn(
              'text-sm mt-1',
              isUnlocked
                ? 'text-gray-600 dark:text-gray-400'
                : 'text-gray-500 dark:text-gray-500'
            )}
          >
            {isSecret ? 'Complete a hidden challenge to unlock' : achievement.description}
          </p>

          {/* Progress bar for locked achievements */}
          {!isUnlocked && !isSecret && progress > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500 dark:text-gray-400">Progress</span>
                <span className={colors.text}>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', colors.text.replace('text-', 'bg-'))}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Points reward */}
          {achievement.points_reward > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                {achievement.points_reward} points
              </span>
            </div>
          )}

          {/* Earned date */}
          {isUnlocked && userAchievement?.earned_at && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Earned {new Date(userAchievement.earned_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mini badge for inline display
export function AchievementMini({
  achievement,
  isUnlocked = false,
  className,
}: {
  achievement: Achievement;
  isUnlocked?: boolean;
  className?: string;
}) {
  const category = achievement.category as AchievementCategory;
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.milestone;
  const IconComponent = ACHIEVEMENT_ICONS[achievement.icon || 'trophy'] || Trophy;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        isUnlocked
          ? cn(colors.bg, colors.text)
          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
        className
      )}
    >
      <IconComponent className="w-3 h-3" />
      <span>{achievement.display_name}</span>
    </div>
  );
}
