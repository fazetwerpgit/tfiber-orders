'use client';

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  ShoppingBag,
  Trophy,
  Flame,
  Award,
  Calendar,
} from 'lucide-react';
import type { SimpleWeeklyReport } from '@/actions/reports';
import { cn } from '@/lib/utils';

// ============================================
// CHANGE INDICATOR
// ============================================

interface ChangeIndicatorProps {
  value: number;
  suffix?: string;
  showZero?: boolean;
}

function ChangeIndicator({ value, suffix = '', showZero = false }: ChangeIndicatorProps) {
  if (value === 0 && !showZero) {
    return <span className="text-gray-400 text-sm">—</span>;
  }

  const isPositive = value > 0;
  const isNegative = value < 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-sm font-medium',
        isPositive && 'text-green-600 dark:text-green-400',
        isNegative && 'text-red-600 dark:text-red-400',
        !isPositive && !isNegative && 'text-gray-500'
      )}
    >
      {isPositive && <TrendingUp className="w-3 h-3" />}
      {isNegative && <TrendingDown className="w-3 h-3" />}
      {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
      {isPositive ? '+' : ''}{value}{suffix}
    </span>
  );
}

// ============================================
// STAT BLOCK
// ============================================

interface StatBlockProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  value: string | number;
  change?: number;
  changeSuffix?: string;
}

function StatBlock({
  icon: Icon,
  iconColor,
  label,
  value,
  change,
  changeSuffix = '',
}: StatBlockProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-4 h-4', iconColor)} />
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {change !== undefined && (
          <ChangeIndicator value={change} suffix={changeSuffix} />
        )}
      </div>
    </div>
  );
}

// ============================================
// SALE BREAKDOWN BAR
// ============================================

interface SaleBreakdownBarProps {
  breakdown: {
    standard: number;
    upgrade: number;
    multi_service: number;
  };
}

function SaleBreakdownBar({ breakdown }: SaleBreakdownBarProps) {
  const total = breakdown.standard + breakdown.upgrade + breakdown.multi_service;

  if (total === 0) {
    return (
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
    );
  }

  const standardPct = (breakdown.standard / total) * 100;
  const upgradePct = (breakdown.upgrade / total) * 100;
  const multiPct = (breakdown.multi_service / total) * 100;

  return (
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
        {standardPct > 0 && (
          <div
            className="bg-blue-500 h-full"
            style={{ width: `${standardPct}%` }}
          />
        )}
        {upgradePct > 0 && (
          <div
            className="bg-purple-500 h-full"
            style={{ width: `${upgradePct}%` }}
          />
        )}
        {multiPct > 0 && (
          <div
            className="bg-amber-500 h-full"
            style={{ width: `${multiPct}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">
            Standard ({breakdown.standard})
          </span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-gray-600 dark:text-gray-400">
            Upgrade ({breakdown.upgrade})
          </span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-gray-600 dark:text-gray-400">
            Multi ({breakdown.multi_service})
          </span>
        </span>
      </div>
    </div>
  );
}

// ============================================
// WEEKLY SUMMARY CARD
// ============================================

export interface WeeklySummaryCardProps {
  report: SimpleWeeklyReport;
  className?: string;
}

export function WeeklySummaryCard({ report, className }: WeeklySummaryCardProps) {
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-pink-600" />
          Weekly Summary
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatDateRange(report.week_start, report.week_end)}
        </span>
      </div>

      {/* Main stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatBlock
          icon={ShoppingBag}
          iconColor="text-green-600"
          label="Sales"
          value={report.total_sales}
          change={report.sales_change}
        />
        <StatBlock
          icon={Star}
          iconColor="text-pink-600"
          label="Points Earned"
          value={report.total_points}
          change={report.points_change}
        />
        <StatBlock
          icon={Flame}
          iconColor="text-orange-500"
          label="Current Streak"
          value={`${report.current_streak} days`}
        />
        <StatBlock
          icon={Trophy}
          iconColor="text-amber-500"
          label="Rank"
          value={`#${report.current_rank}`}
          change={report.rank_change}
        />
      </div>

      {/* Achievements */}
      {report.achievements_unlocked > 0 && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <span className="font-medium text-amber-900 dark:text-amber-100">
              {report.achievements_unlocked} Achievement{report.achievements_unlocked !== 1 ? 's' : ''} Unlocked!
            </span>
          </div>
        </div>
      )}

      {/* Sale breakdown */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Sale Breakdown
        </h3>
        <SaleBreakdownBar breakdown={report.sale_breakdown} />
      </div>
    </div>
  );
}

// ============================================
// COMPACT VERSION
// ============================================

export interface WeeklySummaryCompactProps {
  report: SimpleWeeklyReport;
  className?: string;
}

export function WeeklySummaryCompact({ report, className }: WeeklySummaryCompactProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">This Week</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {report.total_sales} sales
          </p>
        </div>
        <div className="text-right">
          <ChangeIndicator value={report.sales_change_percent} suffix="%" />
          <p className="text-sm text-pink-600 dark:text-pink-400 font-medium">
            +{report.total_points} pts
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SKELETON
// ============================================

export function WeeklySummaryCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          </div>
        ))}
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full" />
    </div>
  );
}
