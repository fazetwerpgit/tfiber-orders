'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, TrendingUp, Users, Plus, Minus } from 'lucide-react';
import type { SaleType } from '@/lib/types';
import { SALE_TYPE_CONFIG, DEFAULT_POINTS } from '@/lib/types';

export interface SaleTypeSelectorProps {
  value: SaleType;
  onChange: (type: SaleType) => void;
  addOnsCount?: number;
  onAddOnsChange?: (count: number) => void;
  showPoints?: boolean;
  className?: string;
}

const SALE_TYPE_OPTIONS: {
  type: SaleType;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    type: 'standard',
    icon: Sparkles,
    color: 'from-blue-500 to-blue-600',
  },
  {
    type: 'upgrade',
    icon: TrendingUp,
    color: 'from-green-500 to-green-600',
  },
  {
    type: 'multi_service',
    icon: Users,
    color: 'from-purple-500 to-purple-600',
  },
];

export function SaleTypeSelector({
  value,
  onChange,
  addOnsCount = 0,
  onAddOnsChange,
  showPoints = true,
  className,
}: SaleTypeSelectorProps) {
  const selectedConfig = SALE_TYPE_CONFIG[value];
  const totalPoints = selectedConfig.points + addOnsCount * DEFAULT_POINTS.add_on;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Sale Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Sale Type
        </label>
        <div className="grid grid-cols-3 gap-3">
          {SALE_TYPE_OPTIONS.map((option) => {
            const config = SALE_TYPE_CONFIG[option.type];
            const Icon = option.icon;
            const isSelected = value === option.type;

            return (
              <button
                key={option.type}
                type="button"
                onClick={() => onChange(option.type)}
                className={cn(
                  'relative p-4 rounded-xl border-2 transition-all text-left',
                  isSelected
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/30 shadow-lg shadow-pink-500/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
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

                {/* Icon */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center mb-2',
                    isSelected
                      ? `bg-gradient-to-br ${option.color} text-white`
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Label */}
                <div
                  className={cn(
                    'font-semibold text-sm',
                    isSelected
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  {config.label}
                </div>

                {/* Points */}
                {showPoints && (
                  <div
                    className={cn(
                      'text-xs mt-1',
                      isSelected
                        ? 'text-pink-600 dark:text-pink-400 font-medium'
                        : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    +{config.points} pts
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {selectedConfig.description}
        </p>
      </div>

      {/* Add-ons Counter */}
      {onAddOnsChange && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Add-ons Included
          </label>
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => onAddOnsChange(Math.max(0, addOnsCount - 1))}
                disabled={addOnsCount === 0}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <span className="w-12 text-center font-semibold text-gray-900 dark:text-white">
                {addOnsCount}
              </span>
              <button
                type="button"
                onClick={() => onAddOnsChange(addOnsCount + 1)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {addOnsCount > 0 && showPoints && (
              <span className="text-sm text-pink-600 dark:text-pink-400 font-medium">
                +{addOnsCount * DEFAULT_POINTS.add_on} pts
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Each add-on earns {DEFAULT_POINTS.add_on} bonus points
          </p>
        </div>
      )}

      {/* Total Points Preview */}
      {showPoints && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 rounded-xl p-4 border border-pink-200 dark:border-pink-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Points for this sale
              </span>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              +{totalPoints}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact inline version for forms
export function SaleTypeSelectCompact({
  value,
  onChange,
  className,
}: {
  value: SaleType;
  onChange: (type: SaleType) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-2', className)}>
      {SALE_TYPE_OPTIONS.map((option) => {
        const config = SALE_TYPE_CONFIG[option.type];
        const isSelected = value === option.type;

        return (
          <button
            key={option.type}
            type="button"
            onClick={() => onChange(option.type)}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
              isSelected
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
