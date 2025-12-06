'use client';

import { useState, useEffect } from 'react';
import { Target, Check, Clock, Plus, X } from 'lucide-react';
import type { UserGoal, GoalType, GoalMetric } from '@/lib/types';
import { getGoalProgress, setGoal, getSmartGoalSuggestions } from '@/actions/reports';
import { cn } from '@/lib/utils';

// ============================================
// GOAL PROGRESS BAR
// ============================================

interface GoalProgressBarProps {
  current: number;
  target: number;
  label?: string;
  color?: string;
  showValues?: boolean;
}

export function GoalProgressBar({
  current,
  target,
  label,
  color = 'bg-pink-600',
  showValues = true,
}: GoalProgressBarProps) {
  const percentage = Math.min(100, (current / target) * 100);
  const isComplete = current >= target;

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">{label}</span>
          {showValues && (
            <span className={cn(
              'font-medium',
              isComplete
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-900 dark:text-white'
            )}>
              {current} / {target}
            </span>
          )}
        </div>
      )}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isComplete ? 'bg-green-500' : color
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// GOAL ITEM
// ============================================

interface GoalItemProps {
  goal: UserGoal;
  onDelete?: (goalId: string) => void;
}

function GoalItem({ goal, onDelete }: GoalItemProps) {
  const isComplete = goal.current_value >= goal.target_value;
  const percentage = Math.min(100, (goal.current_value / goal.target_value) * 100);

  const getGoalLabel = (type: GoalType) => {
    switch (type) {
      case 'daily':
        return 'Today';
      case 'weekly':
        return 'This Week';
      case 'monthly':
        return 'This Month';
      default:
        return 'Custom';
    }
  };

  const getMetricLabel = (metric: GoalMetric) => {
    switch (metric) {
      case 'sales_count':
        return 'sales';
      case 'points':
        return 'points';
      case 'commission':
        return 'commission';
      default:
        return metric;
    }
  };

  return (
    <div
      className={cn(
        'p-3 rounded-xl border transition-colors',
        isComplete
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2">
            {isComplete ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Target className="w-4 h-4 text-pink-600" />
            )}
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              {goal.target_value} {getMetricLabel(goal.metric)}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {getGoalLabel(goal.goal_type)}
          </p>
        </div>
        {!isComplete && onDelete && (
          <button
            onClick={() => onDelete(goal.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <GoalProgressBar
        current={goal.current_value}
        target={goal.target_value}
        showValues={false}
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
        {Math.round(percentage)}% complete
      </p>
    </div>
  );
}

// ============================================
// ADD GOAL FORM
// ============================================

interface AddGoalFormProps {
  onSubmit: (type: GoalType, metric: GoalMetric, target: number) => Promise<void>;
  onCancel: () => void;
  suggestions?: { daily: number; weekly: number; monthly: number };
}

function AddGoalForm({ onSubmit, onCancel, suggestions }: AddGoalFormProps) {
  const [goalType, setGoalType] = useState<GoalType>('weekly');
  const [metric] = useState<GoalMetric>('sales_count');
  const [target, setTarget] = useState(suggestions?.weekly || 5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (suggestions) {
      setTarget(
        goalType === 'daily'
          ? suggestions.daily
          : goalType === 'weekly'
          ? suggestions.weekly
          : suggestions.monthly
      );
    }
  }, [goalType, suggestions]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit(goalType, metric, target);
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-4">
      <h4 className="font-medium text-gray-900 dark:text-white">Set a New Goal</h4>

      {/* Goal Type */}
      <div>
        <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">
          Time Period
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['daily', 'weekly', 'monthly'] as GoalType[]).map((type) => (
            <button
              key={type}
              onClick={() => setGoalType(type)}
              className={cn(
                'py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                goalType === type
                  ? 'bg-pink-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Target */}
      <div>
        <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">
          Sales Target
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTarget(Math.max(1, target - 1))}
            className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            -
          </button>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(Math.max(1, parseInt(e.target.value) || 1))}
            className="flex-1 text-center text-2xl font-bold bg-white dark:bg-gray-700 rounded-lg py-2 border-0 text-gray-900 dark:text-white"
          />
          <button
            onClick={() => setTarget(target + 1)}
            className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            +
          </button>
        </div>
        {suggestions && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
            Suggested based on your history
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 px-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 py-2 px-4 rounded-lg bg-pink-600 text-white font-medium hover:bg-pink-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Setting...' : 'Set Goal'}
        </button>
      </div>
    </div>
  );
}

// ============================================
// GOAL PROGRESS CARD
// ============================================

export interface GoalProgressCardProps {
  className?: string;
}

export function GoalProgressCard({ className }: GoalProgressCardProps) {
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    daily: number;
    weekly: number;
    monthly: number;
  } | null>(null);

  useEffect(() => {
    fetchGoals();
    fetchSuggestions();
  }, []);

  const fetchGoals = async () => {
    const result = await getGoalProgress();
    if (result.success && result.data) {
      setGoals(result.data);
    }
    setIsLoading(false);
  };

  const fetchSuggestions = async () => {
    const result = await getSmartGoalSuggestions();
    if (result.success && result.data) {
      setSuggestions(result.data);
    }
  };

  const handleAddGoal = async (type: GoalType, metric: GoalMetric, target: number) => {
    const result = await setGoal(type, metric, target);
    if (result.success && result.data) {
      setGoals((prev) => [result.data!, ...prev]);
      setShowAddForm(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 animate-pulse', className)}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

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
          <Target className="w-5 h-5 text-pink-600" />
          Goals
        </h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="p-2 rounded-lg text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      {showAddForm ? (
        <AddGoalForm
          onSubmit={handleAddGoal}
          onCancel={() => setShowAddForm(false)}
          suggestions={suggestions || undefined}
        />
      ) : goals.length === 0 ? (
        <div className="text-center py-6">
          <Target className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 mb-3">
            No active goals
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-sm text-pink-600 dark:text-pink-400 hover:underline"
          >
            Set your first goal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalItem key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
