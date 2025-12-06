'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  X,
  Sparkles,
  Home,
  Plus,
  Trophy,
  Flame,
  TrendingUp,
  PartyPopper,
} from 'lucide-react';
import { PointsDisplay } from './PointsDisplay';
import { StreakIndicator } from './StreakIndicator';
import { AchievementMini } from './AchievementBadge';
import type { OrderGamificationResult, Achievement } from '@/lib/types';

export interface SaleSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  gamificationResult?: OrderGamificationResult | null;
  onSubmitAnother?: () => void;
  onGoHome?: () => void;
}

export function SaleSuccessModal({
  isOpen,
  onClose,
  customerName,
  gamificationResult,
  onSubmitAnother,
  onGoHome,
}: SaleSuccessModalProps) {
  const router = useRouter();
  const [confettiPieces, setConfettiPieces] = useState<
    { id: number; x: number; delay: number; color: string; size: number }[]
  >([]);

  // Generate confetti on open
  useEffect(() => {
    if (isOpen) {
      const pieces = Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.8,
        color: ['#E20074', '#FFD700', '#00D4FF', '#FF6B6B', '#4ADE80', '#A855F7'][
          Math.floor(Math.random() * 6)
        ],
        size: Math.random() * 8 + 4,
      }));
      setConfettiPieces(pieces);
    } else {
      setConfettiPieces([]);
    }
  }, [isOpen]);

  const handleSubmitAnother = () => {
    if (onSubmitAnother) {
      onSubmitAnother();
    }
    onClose();
  };

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      router.push('/');
    }
    onClose();
  };

  if (!isOpen) return null;

  const points = gamificationResult?.points;
  const streak = gamificationResult?.streak;
  const achievements = gamificationResult?.achievements || [];
  const hasAchievements = achievements.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiPieces.map((piece) => (
          <div
            key={piece.id}
            className="absolute animate-confetti"
            style={{
              left: `${piece.x}%`,
              top: '-20px',
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600 px-6 py-8 text-white text-center">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <PartyPopper className="w-10 h-10" />
            </div>
            <div className="absolute -top-1 -right-1 animate-bounce">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2">Sale Complete!</h2>
          <p className="text-pink-100">
            Order submitted for <span className="font-semibold">{customerName}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Points Earned */}
          {points && (
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 rounded-xl p-4 border border-pink-200 dark:border-pink-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Points Earned
                  </div>
                  <PointsDisplay
                    points={points.totalPoints}
                    size="lg"
                    variant="gradient"
                    animate
                    showIcon
                  />
                </div>
                <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                  <div>Base: +{points.breakdown.basePoints}</div>
                  {points.breakdown.addonPoints > 0 && (
                    <div>Add-ons: +{points.breakdown.addonPoints}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Streak Update */}
          {streak && (
            <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-950/30 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-3">
                <Flame className="w-6 h-6 text-orange-500" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {streak.currentStreak} Day Streak!
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {streak.streakBroken
                      ? 'New streak started!'
                      : streak.milestoneReached
                      ? `Milestone reached! +${streak.bonusPoints} bonus`
                      : 'Keep it going!'}
                  </div>
                </div>
              </div>
              {streak.milestoneReached && (
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  +{streak.bonusPoints}
                </div>
              )}
            </div>
          )}

          {/* Achievements Unlocked */}
          {hasAchievements && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Achievement{achievements.length > 1 ? 's' : ''} Unlocked!
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.achievement_id}
                    className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-sm"
                  >
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {achievement.achievement_display_name}
                    </span>
                    <span className="text-xs text-pink-600 dark:text-pink-400">
                      +{achievement.points_reward}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rank Change */}
          {gamificationResult?.rankChange &&
            gamificationResult.rankChange.is_significant && (
              <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/30 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Rank Up!
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    You moved from #{gamificationResult.rankChange.old_rank} to #
                    {gamificationResult.rankChange.new_rank}
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 grid grid-cols-2 gap-3">
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </button>
          <button
            onClick={handleSubmitAnother}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium hover:from-pink-700 hover:to-purple-700 transition-colors shadow-lg shadow-pink-500/30"
          >
            <Plus className="w-5 h-5" />
            <span>New Sale</span>
          </button>
        </div>
      </div>

      {/* CSS for confetti animation */}
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
          animation: confetti 3.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Simple success toast for less intrusive feedback
export function SaleSuccessToast({
  isVisible,
  points,
  onClose,
  autoCloseDelay = 4000,
}: {
  isVisible: boolean;
  points: number;
  onClose: () => void;
  autoCloseDelay?: number;
}) {
  useEffect(() => {
    if (isVisible && autoCloseDelay > 0) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoCloseDelay, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold">Sale Complete!</div>
            <div className="text-sm text-pink-100">+{points} points earned</div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
