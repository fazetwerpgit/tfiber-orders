'use client';

import { useState, useEffect } from 'react';
import { Medal, Flame, TrendingUp, Calendar, Clock, Crown } from 'lucide-react';
import { getPerformanceInsights } from '@/actions/reports';
import { cn } from '@/lib/utils';

// ============================================
// BEST ITEM
// ============================================

interface BestItemProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  value: string | number;
  subtext?: string;
}

function BestItem({ icon: Icon, iconColor, label, value, subtext }: BestItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
      <div className={cn('p-2 rounded-lg', iconColor.replace('text-', 'bg-').replace('-600', '-100').replace('-500', '-100'), 'dark:bg-opacity-30')}>
        <Icon className={cn('w-5 h-5', iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-bold text-gray-900 dark:text-white truncate">
          {value}
        </p>
        {subtext && (
          <p className="text-xs text-gray-400 dark:text-gray-500">{subtext}</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// INSIGHTS SECTION
// ============================================

interface InsightBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

function InsightBadge({ icon: Icon, label, value }: InsightBadgeProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg">
      <Icon className="w-4 h-4 text-pink-600" />
      <span className="text-xs text-gray-600 dark:text-gray-400">{label}:</span>
      <span className="text-xs font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

// ============================================
// PERSONAL BESTS CARD
// ============================================

export interface PersonalBestsCardProps {
  className?: string;
}

export function PersonalBestsCard({ className }: PersonalBestsCardProps) {
  const [insights, setInsights] = useState<{
    bestDay: string;
    bestTime: string;
    avgSalesPerDay: number;
    topSaleType: string;
    personalBests: {
      dailySales: number;
      weeklySales: number;
      longestStreak: number;
    };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    const result = await getPerformanceInsights();
    if (result.success && result.data) {
      setInsights(result.data);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className={cn('bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 animate-pulse', className)}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const formatSaleType = (type: string) => {
    switch (type) {
      case 'standard':
        return 'Standard';
      case 'upgrade':
        return 'Upgrade';
      case 'multi_service':
        return 'Multi-Service';
      default:
        return type;
    }
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800',
        className
      )}
    >
      {/* Header */}
      <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2 mb-4">
        <Crown className="w-5 h-5 text-amber-500" />
        Personal Bests
      </h2>

      {/* Personal Bests */}
      <div className="space-y-2 mb-4">
        <BestItem
          icon={TrendingUp}
          iconColor="text-green-600"
          label="Best Day"
          value={`${insights.personalBests.dailySales} sales`}
        />
        <BestItem
          icon={Calendar}
          iconColor="text-blue-600"
          label="Best Week"
          value={`${insights.personalBests.weeklySales} sales`}
        />
        <BestItem
          icon={Flame}
          iconColor="text-orange-500"
          label="Longest Streak"
          value={`${insights.personalBests.longestStreak} days`}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

      {/* Insights */}
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Your Patterns
      </h3>
      <div className="flex flex-wrap gap-2">
        <InsightBadge
          icon={Calendar}
          label="Best Day"
          value={insights.bestDay}
        />
        <InsightBadge
          icon={Clock}
          label="Best Time"
          value={insights.bestTime}
        />
        <InsightBadge
          icon={Medal}
          label="Top Type"
          value={formatSaleType(insights.topSaleType)}
        />
      </div>

      {/* Average */}
      <div className="mt-4 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          You average <span className="font-bold text-pink-600">{insights.avgSalesPerDay}</span> sales per day
        </p>
      </div>
    </div>
  );
}
