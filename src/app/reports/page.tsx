'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import type { SimpleWeeklyReport } from '@/actions/reports';
import { getWeeklyReport } from '@/actions/reports';
import {
  WeeklySummaryCard,
  WeeklySummaryCardSkeleton,
  GoalProgressCard,
  PersonalBestsCard,
} from '@/components/reports';
import { ActivityFeedWidget } from '@/components/feed';
import { cn } from '@/lib/utils';

// ============================================
// WEEK SELECTOR
// ============================================

interface WeekSelectorProps {
  currentWeekStart: Date;
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
  isCurrentWeek: boolean;
}

function WeekSelector({
  currentWeekStart,
  onPrevious,
  onNext,
  onReset,
  isCurrentWeek,
}: WeekSelectorProps) {
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2">
      <button
        onClick={onPrevious}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      <button
        onClick={onReset}
        className="flex-1 text-center"
        disabled={isCurrentWeek}
      >
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {formatDate(currentWeekStart)} - {formatDate(weekEnd)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isCurrentWeek ? 'Current Week' : 'Tap to go to current week'}
        </p>
      </button>

      <button
        onClick={onNext}
        disabled={isCurrentWeek}
        className={cn(
          'p-2 rounded-lg transition-colors',
          isCurrentWeek
            ? 'opacity-30 cursor-not-allowed'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        )}
      >
        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function ReportsPage() {
  const [report, setReport] = useState<SimpleWeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  // Check if viewing current week
  const isCurrentWeek = (() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - dayOfWeek);
    thisWeekStart.setHours(0, 0, 0, 0);
    return currentWeekStart.getTime() === thisWeekStart.getTime();
  })();

  useEffect(() => {
    fetchReport();
  }, [currentWeekStart]);

  const fetchReport = async () => {
    setIsLoading(true);
    const result = await getWeeklyReport(
      undefined,
      currentWeekStart.toISOString().split('T')[0]
    );
    if (result.success && result.data) {
      setReport(result.data);
    }
    setIsLoading(false);
  };

  const handlePreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const handleNextWeek = () => {
    if (!isCurrentWeek) {
      const newStart = new Date(currentWeekStart);
      newStart.setDate(newStart.getDate() + 7);
      setCurrentWeekStart(newStart);
    }
  };

  const handleResetToCurrentWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-pink-600" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reports
              </h1>
            </div>
          </div>
          <button
            onClick={fetchReport}
            disabled={isLoading}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Week Selector */}
        <WeekSelector
          currentWeekStart={currentWeekStart}
          onPrevious={handlePreviousWeek}
          onNext={handleNextWeek}
          onReset={handleResetToCurrentWeek}
          isCurrentWeek={isCurrentWeek}
        />

        {/* Weekly Summary */}
        {isLoading ? (
          <WeeklySummaryCardSkeleton />
        ) : report ? (
          <WeeklySummaryCard report={report} />
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-800">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              No Data Available
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No sales data found for this week.
            </p>
          </div>
        )}

        {/* Goals Section (only on current week) */}
        {isCurrentWeek && (
          <section>
            <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2 mb-3">
              <span className="w-1 h-6 bg-pink-600 rounded-full" />
              Your Goals
            </h2>
            <GoalProgressCard />
          </section>
        )}

        {/* Personal Bests */}
        <section>
          <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2 mb-3">
            <span className="w-1 h-6 bg-amber-500 rounded-full" />
            Performance
          </h2>
          <PersonalBestsCard />
        </section>

        {/* Activity Feed Widget */}
        <section>
          <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2 mb-3">
            <span className="w-1 h-6 bg-purple-600 rounded-full" />
            Recent Activity
          </h2>
          <ActivityFeedWidget limit={5} />
        </section>
      </main>
    </div>
  );
}
