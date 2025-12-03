'use client';

import { useState } from 'react';
import { MapPin, Check, Loader2 } from 'lucide-react';
import PlanSelector from './PlanSelector';
import DateSelector from './DateSelector';
import TimeSlotSelector from './TimeSlotSelector';
import {
  PlanType,
  TimeSlot,
  OrderFormData,
  calculatePrice,
  getPricingTier,
} from '@/lib/types';

interface OrderFormProps {
  onSubmit: (data: OrderFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export default function OrderForm({ onSubmit, isSubmitting = false }: OrderFormProps) {
  const [formData, setFormData] = useState<Partial<OrderFormData>>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    service_address: '',
    city: '',
    state: '',
    zip: '',
    plan_type: undefined,
    has_voice_line: true,
    has_autopay: true,
    install_date: undefined,
    install_time_slot: undefined,
    access_notes: '',
    promo_code: '',
  });

  const [gettingLocation, setGettingLocation] = useState(false);

  const updateField = <K extends keyof OrderFormData>(field: K, value: OrderFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // In a real app, you'd reverse geocode this to get an address
        // For now, we'll just note the coordinates
        console.log('Location:', position.coords.latitude, position.coords.longitude);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Location error:', error);
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.plan_type || !formData.install_date || !formData.install_time_slot) {
      alert('Please fill in all required fields');
      return;
    }

    await onSubmit(formData as OrderFormData);
  };

  const price = formData.plan_type
    ? calculatePrice(formData.plan_type, formData.has_voice_line ?? true, formData.has_autopay ?? true)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Customer Info Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
          <span className="w-1 h-6 bg-pink-600 rounded-full"></span>
          Customer Info
        </h2>

        <input
          type="text"
          placeholder="Customer Name *"
          value={formData.customer_name}
          onChange={(e) => updateField('customer_name', e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 outline-none text-lg placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="tel"
            placeholder="Phone *"
            value={formData.customer_phone}
            onChange={(e) => updateField('customer_phone', e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.customer_email}
            onChange={(e) => updateField('customer_email', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Address Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
            <span className="w-1 h-6 bg-pink-600 rounded-full"></span>
            Service Address
          </h2>
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={gettingLocation}
            className="flex items-center gap-1 text-sm text-pink-600 dark:text-pink-400 font-medium"
          >
            {gettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            GPS
          </button>
        </div>

        <input
          type="text"
          placeholder="Street Address *"
          value={formData.service_address}
          onChange={(e) => updateField('service_address', e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />

        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
          <input
            type="text"
            placeholder="City *"
            value={formData.city}
            onChange={(e) => updateField('city', e.target.value)}
            required
            className="sm:col-span-3 w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          <input
            type="text"
            placeholder="State *"
            maxLength={2}
            value={formData.state}
            onChange={(e) => updateField('state', e.target.value.toUpperCase())}
            required
            className="sm:col-span-1 w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 outline-none text-center placeholder:text-gray-400 dark:placeholder:text-gray-500 uppercase"
          />
          <input
            type="text"
            placeholder="ZIP Code *"
            maxLength={5}
            value={formData.zip}
            onChange={(e) => updateField('zip', e.target.value)}
            required
            className="sm:col-span-2 w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Plan Selection */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
          <span className="w-1 h-6 bg-pink-600 rounded-full"></span>
          Select Plan
        </h2>

        <PlanSelector
          selectedPlan={formData.plan_type ?? null}
          onSelect={(plan) => updateField('plan_type', plan)}
          hasVoiceLine={formData.has_voice_line ?? true}
          hasAutopay={formData.has_autopay ?? true}
        />

        <div className="flex gap-4 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.has_voice_line}
              onChange={(e) => updateField('has_voice_line', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-pink-600 focus:ring-pink-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">T-Mobile Voice Line</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.has_autopay}
              onChange={(e) => updateField('has_autopay', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-pink-600 focus:ring-pink-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">AutoPay</span>
          </label>
        </div>

        {price && (
          <div className="text-right text-lg text-gray-700 dark:text-gray-300">
            Monthly: <span className="font-bold text-pink-600 dark:text-pink-400">${price}/mo</span>
          </div>
        )}
      </div>

      {/* Install Date */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
          <span className="w-1 h-6 bg-pink-600 rounded-full"></span>
          Install Date
        </h2>
        <DateSelector
          selectedDate={formData.install_date ?? null}
          onSelect={(date) => updateField('install_date', date)}
        />
      </div>

      {/* Time Slot */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
          <span className="w-1 h-6 bg-pink-600 rounded-full"></span>
          Time Slot
        </h2>
        <TimeSlotSelector
          selectedSlot={formData.install_time_slot ?? null}
          onSelect={(slot) => updateField('install_time_slot', slot)}
        />
      </div>

      {/* Promo Code */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
          <span className="w-1 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
          Promo Code
          <span className="text-sm font-normal text-gray-400 dark:text-gray-500">(optional)</span>
        </h2>
        <input
          type="text"
          placeholder="Enter promo code"
          value={formData.promo_code || ''}
          onChange={(e) => updateField('promo_code', e.target.value.toUpperCase())}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 outline-none uppercase tracking-wider placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Notes */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
          <span className="w-1 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
          Notes
          <span className="text-sm font-normal text-gray-400 dark:text-gray-500">(optional)</span>
        </h2>
        <div className="flex gap-2 flex-wrap">
          {['Gate code needed', 'Dog in yard', 'Call before arrival', 'Side entrance'].map((note) => (
            <button
              key={note}
              type="button"
              onClick={() => {
                const current = formData.access_notes ?? '';
                const newNote = current ? `${current}, ${note}` : note;
                updateField('access_notes', newNote);
              }}
              className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-pink-900/30 hover:text-pink-700 dark:hover:text-pink-400"
            >
              {note}
            </button>
          ))}
        </div>
        <textarea
          placeholder="Additional notes..."
          value={formData.access_notes}
          onChange={(e) => updateField('access_notes', e.target.value)}
          rows={2}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 outline-none resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Submit Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <button
          type="submit"
          disabled={isSubmitting || !formData.plan_type || !formData.install_date || !formData.install_time_slot}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-pink-700 text-white font-bold text-lg flex items-center justify-center gap-2 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 disabled:cursor-not-allowed hover:from-pink-700 hover:to-pink-800 transition-all shadow-lg shadow-pink-500/30 disabled:shadow-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" strokeWidth={3} />
              Submit Order
            </>
          )}
        </button>
      </div>
    </form>
  );
}
