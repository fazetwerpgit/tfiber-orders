'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { PLAN_NAMES } from '@/lib/types';
import { Edit2, Check, X, DollarSign, Clock, CheckCircle } from 'lucide-react';

interface CommissionRate {
  id: string;
  plan_type: string;
  amount: number;
}

interface CommissionSummary {
  pending: number;
  paid: number;
  total: number;
}

export default function CommissionsPage() {
  const [rates, setRates] = useState<CommissionRate[]>([]);
  const [summary, setSummary] = useState<CommissionSummary>({ pending: 0, paid: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();

    // Fetch commission rates
    const { data: ratesData } = await supabase
      .from('commission_rates')
      .select('*')
      .order('amount', { ascending: true });

    if (ratesData) {
      setRates(ratesData);
    }

    // Fetch orders for commission summary
    const { data: orders } = await supabase
      .from('orders')
      .select('status, commission_amount');

    if (orders) {
      const pending = orders
        .filter(o => o.status === 'installed')
        .reduce((sum, o) => sum + Number(o.commission_amount || 0), 0);

      const paid = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + Number(o.commission_amount || 0), 0);

      setSummary({
        pending,
        paid,
        total: pending + paid,
      });
    }

    setLoading(false);
  };

  const handleSaveRate = async (id: string) => {
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('commission_rates')
      .update({ amount: editAmount })
      .eq('id', id);

    if (!error) {
      setRates(rates.map(r =>
        r.id === id ? { ...r, amount: editAmount } : r
      ));
      setEditingId(null);
    } else {
      alert('Failed to update rate. Make sure you have admin privileges.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading commissions...</div>
    );
  }

  return (
    <main className="p-4 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Pending</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            ${summary.pending.toFixed(0)}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Installed, awaiting completion
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Paid</span>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            ${summary.paid.toFixed(0)}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Completed orders
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
          </div>
          <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
            ${summary.total.toFixed(0)}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            All earned commissions
          </div>
        </div>
      </div>

      {/* Commission Rates */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Commission Rates</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Amount paid per completed installation
          </p>
        </div>

        {rates.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No commission rates configured
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {rates.map((rate) => (
              <div key={rate.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {PLAN_NAMES[rate.plan_type as keyof typeof PLAN_NAMES] || rate.plan_type}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {editingId === rate.id ? (
                    <>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(Number(e.target.value))}
                          className="w-24 pl-7 pr-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg text-right focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                          min="0"
                          step="5"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveRate(rate.id)}
                        disabled={saving}
                        className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-xl font-bold text-green-600 dark:text-green-400">
                        ${rate.amount}
                      </span>
                      <button
                        onClick={() => {
                          setEditingId(rate.id);
                          setEditAmount(rate.amount);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commission Status Legend */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Commission Status Guide</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-gray-600 dark:text-gray-400">New</span>
            <span className="text-gray-400 dark:text-gray-500">→ No commission yet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-gray-600 dark:text-gray-400">Scheduled</span>
            <span className="text-gray-400 dark:text-gray-500">→ No commission yet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600 dark:text-gray-400">Installed</span>
            <span className="text-gray-400 dark:text-gray-500">→ Commission pending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-500"></span>
            <span className="text-gray-600 dark:text-gray-400">Completed</span>
            <span className="text-gray-400 dark:text-gray-500">→ Commission paid</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-600 dark:text-gray-400">Cancelled</span>
            <span className="text-gray-400 dark:text-gray-500">→ No commission</span>
          </div>
        </div>
      </div>
    </main>
  );
}
