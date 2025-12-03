'use client';

import { Check } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

function getNextDays(count: number): { date: string; label: string; dayName: string }[] {
  const days = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = date.getDate();

    let label = dayNum.toString();
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tmrw';

    days.push({ date: dateStr, label, dayName });
  }

  return days;
}

export default function DateSelector({ selectedDate, onSelect }: DateSelectorProps) {
  const days = getNextDays(14);

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-2 pb-2" style={{ width: 'max-content' }}>
        {days.map((day) => {
          const isSelected = selectedDate === day.date;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelect(day.date)}
              className={`relative flex flex-col items-center py-2 px-3 rounded-lg border-2 min-w-[60px] transition-all ${
                isSelected
                  ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/30'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-pink-300 dark:hover:border-pink-700'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-600 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className={`text-xs ${isSelected ? 'text-pink-600 dark:text-pink-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {day.dayName}
              </div>
              <div className={`text-lg font-bold ${isSelected ? 'text-pink-700 dark:text-pink-300' : 'text-gray-900 dark:text-white'}`}>
                {day.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
