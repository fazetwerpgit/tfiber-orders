'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Award, Lock, CheckCircle, Flame, Trophy, Target, Zap, TrendingUp, Medal, Star, Shield, Wifi, Rocket, Crown, Bolt } from 'lucide-react';
import { getAllBadgesWithProgress, BadgeProgress, checkAndAwardBadges } from './actions';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  TrendingUp,
  Award,
  Trophy,
  Crown,
  Star,
  Flame,
  Shield,
  Wifi,
  Target,
  Bolt,
  Rocket,
  Medal,
};

export default function BadgesPage() {
  const [badges, setBadges] = useState<BadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  useEffect(() => {
    const loadBadges = async () => {
      // First check for new badges
      const { awarded } = await checkAndAwardBadges();
      if (awarded.length > 0) {
        setNewBadges(awarded);
      }

      // Then load all badges with progress
      const { badges: badgeData } = await getAllBadgesWithProgress();
      setBadges(badgeData);
      setLoading(false);
    };
    
    loadBadges();
  }, []);

  const earnedBadges = badges.filter(b => b.earned);
  const unearnedBadges = badges.filter(b => !b.earned);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'milestone': return 'Milestones';
      case 'streak': return 'Streaks';
      case 'plan': return 'Plan Specialist';
      case 'daily': return 'Daily Achievements';
      case 'goal': return 'Goal Crusher';
      default: return category;
    }
  };

  const groupedEarned = earnedBadges.reduce((acc, badge) => {
    const cat = badge.badge.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(badge);
    return acc;
  }, {} as Record<string, BadgeProgress[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500">Loading badges...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-6">
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="p-2 -ml-2 hover:bg-white/20 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6" />
            <h1 className="text-xl font-bold">Badges & Achievements</h1>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{earnedBadges.length}</div>
            <div className="text-purple-200 text-sm">Earned</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{unearnedBadges.length}</div>
            <div className="text-purple-200 text-sm">Remaining</div>
          </div>
        </div>
      </header>

      {/* New Badge Alert */}
      {newBadges.length > 0 && (
        <div className="mx-4 -mt-4 mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-white">New Badge{newBadges.length > 1 ? 's' : ''} Earned!</div>
              <div className="text-yellow-100 text-sm">{newBadges.join(', ')}</div>
            </div>
          </div>
        </div>
      )}

      <main className="p-4 space-y-6">
        {/* Earned Badges */}
        {earnedBadges.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Your Badges ({earnedBadges.length})
            </h2>
            
            {Object.entries(groupedEarned).map(([category, catBadges]) => (
              <div key={category} className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {getCategoryLabel(category)}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {catBadges.map((bp) => {
                    const IconComponent = ICON_MAP[bp.badge.icon] || Award;
                    return (
                      <div
                        key={bp.badge.id}
                        className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm flex flex-col items-center text-center"
                      >
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center mb-2 shadow-lg"
                          style={{ backgroundColor: bp.badge.color }}
                        >
                          <IconComponent className="w-7 h-7 text-white" />
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {bp.badge.display_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(bp.earned_at!).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unearned Badges */}
        {unearnedBadges.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-400" />
              Locked Badges ({unearnedBadges.length})
            </h2>
            <div className="space-y-3">
              {unearnedBadges.map((bp) => {
                const IconComponent = ICON_MAP[bp.badge.icon] || Award;
                const progress = Math.min((bp.current / bp.required) * 100, 100);
                
                return (
                  <div
                    key={bp.badge.id}
                    className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center opacity-40"
                        style={{ backgroundColor: bp.badge.color }}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {bp.badge.display_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {bp.badge.description}
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>{bp.current} / {bp.required}</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${progress}%`,
                                backgroundColor: bp.badge.color 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {badges.length === 0 && (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <div className="text-gray-500 dark:text-gray-400">No badges available</div>
          </div>
        )}
      </main>
    </div>
  );
}
