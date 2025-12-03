'use client';

import { TimeSlot, TIME_SLOT_LABELS } from '@/lib/types';
import { Check } from 'lucide-react';

interface TimeSlotSelectorProps {
  selectedSlot: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
}

const slots: TimeSlot[] = ['8-10', '10-12', '12-3', '3-5'];

export default function TimeSlotSelector({ selectedSlot, onSelect }: TimeSlotSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {slots.map((slot) => {
        const isSelected = selectedSlot === slot;

        return (
          <button
            key={slot}
            type="button"
            onClick={() => onSelect(slot)}
            className={`relative py-3 px-2 rounded-xl border-2 text-center transition-all min-h-[48px] ${
              isSelected
                ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/20 shadow-md shadow-pink-200/50 dark:shadow-pink-900/30'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-pink-300 dark:hover:border-pink-600 hover:shadow-sm'
            }`}
          >
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-600 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            <div className={`text-sm font-semibold ${isSelected ? 'text-pink-700 dark:text-pink-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {TIME_SLOT_LABELS[slot]}
            </div>
          </button>
        );
      })}
    </div>
  );
}
