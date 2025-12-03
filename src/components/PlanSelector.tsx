'use client';

import { PlanType, PLAN_NAMES, PLAN_SPEEDS, calculatePrice } from '@/lib/types';
import { Check, Wifi, Zap, Rocket, Star } from 'lucide-react';

interface PlanSelectorProps {
  selectedPlan: PlanType | null;
  onSelect: (plan: PlanType) => void;
  hasVoiceLine: boolean;
  hasAutopay: boolean;
}

const plans: PlanType[] = ['fiber_500', 'fiber_1gig', 'fiber_2gig', 'founders_club'];

const planIcons: Record<PlanType, React.ReactNode> = {
  fiber_500: <Wifi className="w-5 h-5" />,
  fiber_1gig: <Zap className="w-5 h-5" />,
  fiber_2gig: <Rocket className="w-5 h-5" />,
  founders_club: <Star className="w-5 h-5" />,
};

export default function PlanSelector({ selectedPlan, onSelect, hasVoiceLine, hasAutopay }: PlanSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {plans.map((plan) => {
        const isSelected = selectedPlan === plan;
        const price = calculatePrice(plan, hasVoiceLine, hasAutopay);
        const isFounders = plan === 'founders_club';

        return (
          <button
            key={plan}
            type="button"
            onClick={() => onSelect(plan)}
            className={`relative p-5 rounded-2xl border-2 transition-all min-h-[120px] ${
              isSelected
                ? 'border-pink-600 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 shadow-lg shadow-pink-200/50 dark:shadow-pink-900/30 scale-[1.02]'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-pink-300 dark:hover:border-pink-600 hover:shadow-md'
            } ${isFounders ? 'col-span-full bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20' : ''}`}
          >
            {isSelected && (
              <div className="absolute top-3 right-3 w-7 h-7 bg-pink-600 rounded-full flex items-center justify-center shadow-md">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            )}

            {isFounders && (
              <div className="absolute top-3 left-3 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                BEST VALUE
              </div>
            )}

            <div className="text-left">
              <div className={`flex items-center gap-2 ${isSelected ? 'text-pink-600 dark:text-pink-400' : isFounders ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {planIcons[plan]}
              </div>
              <div className={`font-bold text-lg mt-2 ${isSelected ? 'text-pink-700 dark:text-pink-400' : 'text-gray-900 dark:text-white'}`}>
                {PLAN_NAMES[plan]}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">{PLAN_SPEEDS[plan]}</div>
              <div className={`text-3xl font-extrabold mt-3 ${isSelected ? 'text-pink-600 dark:text-pink-400' : isFounders ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                ${price}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/mo</span>
              </div>
              {isFounders && (
                <div className="text-xs text-amber-700 dark:text-amber-300 mt-2 font-semibold bg-amber-100 dark:bg-amber-900/40 inline-block px-2 py-1 rounded-full">
                  10-year price lock
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
