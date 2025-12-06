'use client';

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, Sparkles, Trophy, Star, Flame, Target, Award, Zap, Medal, Crown } from 'lucide-react';
import type { Achievement, UserAchievement } from '@/lib/types';

// Icon mapping
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

export interface AchievementPopupProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  isOpen: boolean;
  onClose: () => void;
  autoCloseDelay?: number; // ms, 0 to disable
}

export function AchievementPopup({
  achievement,
  isOpen,
  onClose,
  autoCloseDelay = 5000,
}: AchievementPopupProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<
    { id: number; x: number; delay: number; color: string }[]
  >([]);

  const IconComponent = ACHIEVEMENT_ICONS[achievement.icon || 'trophy'] || Trophy;

  // Generate confetti on open
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: ['#E20074', '#FFD700', '#00D4FF', '#FF6B6B', '#4ADE80'][
          Math.floor(Math.random() * 5)
        ],
      }));
      setConfettiPieces(pieces);
    } else {
      setConfettiPieces([]);
    }
  }, [isOpen]);

  // Auto-close timer
  useEffect(() => {
    if (isOpen && autoCloseDelay > 0) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiPieces.map((piece) => (
          <div
            key={piece.id}
            className="absolute w-3 h-3 animate-confetti"
            style={{
              left: `${piece.x}%`,
              top: '-20px',
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>

      {/* Modal */}
      <div
        className={cn(
          'relative bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl',
          'animate-in zoom-in-95 duration-300'
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          {/* Animated badge */}
          <div className="relative mb-6">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />

            {/* Badge */}
            <div
              className={cn(
                'relative w-24 h-24 rounded-full flex items-center justify-center',
                'bg-gradient-to-br from-pink-500 to-purple-600',
                'shadow-lg shadow-pink-500/30',
                isAnimating && 'animate-bounce-slow'
              )}
            >
              <IconComponent className="w-12 h-12 text-white" />
            </div>

            {/* Sparkle particles */}
            <div className="absolute -top-2 -right-2 animate-ping">
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="absolute -bottom-1 -left-3 animate-ping" style={{ animationDelay: '0.2s' }}>
              <Star className="w-5 h-5 text-pink-400" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Achievement Unlocked!
          </h2>

          {/* Achievement name */}
          <h3 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
            {achievement.display_name}
          </h3>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {achievement.description}
          </p>

          {/* Points reward */}
          {achievement.points_reward > 0 && (
            <div className="flex items-center gap-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-4 py-2 rounded-full font-bold">
              <Sparkles className="w-5 h-5" />
              <span>+{achievement.points_reward} Points!</span>
            </div>
          )}
        </div>

        {/* Progress bar for auto-close */}
        {autoCloseDelay > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 rounded-b-3xl overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
              style={{
                animation: `shrink ${autoCloseDelay}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Queue manager for multiple achievement unlocks
export function useAchievementPopupQueue() {
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [current, setCurrent] = useState<Achievement | null>(null);

  const addToQueue = useCallback((achievements: Achievement[]) => {
    setQueue((prev) => [...prev, ...achievements]);
  }, []);

  const showNext = useCallback(() => {
    if (queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
    } else {
      setCurrent(null);
    }
  }, [queue]);

  const dismiss = useCallback(() => {
    showNext();
  }, [showNext]);

  // Auto-show first item when queue gets items
  useEffect(() => {
    if (!current && queue.length > 0) {
      showNext();
    }
  }, [current, queue, showNext]);

  return {
    currentAchievement: current,
    hasMore: queue.length > 0,
    remaining: queue.length,
    addToQueue,
    dismiss,
  };
}

// Toast-style notification for less intrusive display
export function AchievementToast({
  achievement,
  isVisible,
  onClose,
  autoCloseDelay = 4000,
}: {
  achievement: Achievement;
  isVisible: boolean;
  onClose: () => void;
  autoCloseDelay?: number;
}) {
  const IconComponent = ACHIEVEMENT_ICONS[achievement.icon || 'trophy'] || Trophy;

  useEffect(() => {
    if (isVisible && autoCloseDelay > 0) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoCloseDelay, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm w-full',
        'animate-in slide-in-from-right duration-300'
      )}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <IconComponent className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-pink-600 dark:text-pink-400 mb-0.5">
            Achievement Unlocked!
          </div>
          <div className="font-bold text-gray-900 dark:text-white truncate">
            {achievement.display_name}
          </div>
          {achievement.points_reward > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              +{achievement.points_reward} points
            </div>
          )}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
