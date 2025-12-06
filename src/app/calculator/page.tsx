'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator, DollarSign, TrendingUp, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { PLAN_NAMES, PlanType } from '@/lib/types';

interface CommissionRates {
  [key: string]: number;
}

interface PlanMix {
  fiber_500: number;
  fiber_1gig: number;
  fiber_2gig: number;
  founders_club: number;
}

export default function CalculatorPage() {
  const [rates, setRates] = useState<CommissionRates>({
    fiber_500: 50,
    fiber_1gig: 75,
    fiber_2gig: 100,
    founders_club: 125,
  });
  const [planMix, setPlanMix] = useState<PlanMix>({
    fiber_500: 0,
    fiber_1gig: 0,
    fiber_2gig: 0,
    founders_club: 0,
  });
  const [currentStats, setCurrentStats] = useState({
    monthOrders: 0,
    monthCommission: 0,
    avgPerOrder: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      // Get commission rates
      const { data: commissionRates } = await supabase
        .from('commission_rates')
        .select('*');

      if (commissionRates) {
        const ratesMap: CommissionRates = {};
        commissionRates.forEach(r => {
          ratesMap[r.plan_type] = r.amount;
        });
        setRates(prev => ({ ...prev, ...ratesMap }));
      }

      // Get current month stats
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: orders } = await supabase
          .from('orders')
          .select('commission_amount, plan_type')
          .eq('salesperson_id', user.id)
          .neq('status', 'cancelled')
          .gte('created_at', monthStart.toISOString());

        if (orders) {
          const totalCommission = orders.reduce((sum, o) => sum + (o.commission_amount || 0), 0);
          setCurrentStats({
            monthOrders: orders.length,
            monthCommission: totalCommission,
            avgPerOrder: orders.length > 0 ? totalCommission / orders.length : 0,
          });
        }
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const calculateProjection = () => {
    let total = 0;
    (Object.keys(planMix) as PlanType[]).forEach(plan => {
      total += planMix[plan] * (rates[plan] || 0);
    });
    return total;
  };

  const totalOrders = Object.values(planMix).reduce((sum, count) => sum + count, 0);
  const projectedCommission = calculateProjection();
  const totalWithCurrent = currentStats.monthCommission + projectedCommission;

  // Calculate days remaining in month
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysRemaining = lastDay.getDate() - today.getDate();
  const daysPassed = today.getDate();

  // Projected month-end based on current pace
  const paceProjection = daysPassed > 0 
    ? (currentStats.monthCommission / daysPassed) * lastDay.getDate() 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-6">
      <header className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="p-2 -ml-2 hover:bg-white/20 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Calculator className="w-6 h-6" />
            <h1 className="text-xl font-bold">Commission Calculator</h1>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
            <div className="text-green-200 text-sm">This Month</div>
            <div className="text-2xl font-bold">${currentStats.monthCommission.toFixed(0)}</div>
            <div className="text-green-200 text-xs">{currentStats.monthOrders} orders</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
            <div className="text-green-200 text-sm">Pace Projection</div>
            <div className="text-2xl font-bold">${paceProjection.toFixed(0)}</div>
            <div className="text-green-200 text-xs">{daysRemaining} days left</div>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* What-If Calculator */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            What If I Sell...
          </h2>

          <div className="space-y-4">
            {(Object.keys(PLAN_NAMES) as PlanType[]).map(plan => (
              <div key={plan} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{PLAN_NAMES[plan]}</div>
                  <div className="text-sm text-gray-500">${rates[plan]} each</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPlanMix(prev => ({ ...prev, [plan]: Math.max(0, prev[plan] - 1) }))}
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-gray-900 dark:text-white text-lg">
                    {planMix[plan]}
                  </span>
                  <button
                    onClick={() => setPlanMix(prev => ({ ...prev, [plan]: prev[plan] + 1 }))}
                    className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 font-bold hover:bg-pink-200 dark:hover:bg-pink-900/50"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalOrders > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between text-lg">
                <span className="text-gray-600 dark:text-gray-400">Additional Orders:</span>
                <span className="font-bold text-gray-900 dark:text-white">{totalOrders}</span>
              </div>
              <div className="flex items-center justify-between text-xl mt-2">
                <span className="text-gray-600 dark:text-gray-400">Additional Commission:</span>
                <span className="font-bold text-green-600">${projectedCommission.toFixed(0)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Projection Summary */}
        {totalOrders > 0 && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5" />
              <h3 className="font-bold">If You Hit This Goal</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-green-200 text-sm">New Month Total</div>
                <div className="text-3xl font-bold">${totalWithCurrent.toFixed(0)}</div>
              </div>
              <div>
                <div className="text-green-200 text-sm">Total Orders</div>
                <div className="text-3xl font-bold">{currentStats.monthOrders + totalOrders}</div>
              </div>
            </div>
          </div>
        )}

        {/* Commission Rates Reference */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Commission Rates
          </h2>
          <div className="space-y-3">
            {(Object.keys(PLAN_NAMES) as PlanType[]).map(plan => (
              <div key={plan} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span className="text-gray-700 dark:text-gray-300">{PLAN_NAMES[plan]}</span>
                <span className="font-bold text-green-600 dark:text-green-400">${rates[plan]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Scenarios */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Quick Scenarios</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPlanMix({ fiber_500: 5, fiber_1gig: 0, fiber_2gig: 0, founders_club: 0 })}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="text-sm text-gray-500 dark:text-gray-400">5 Fiber 500</div>
              <div className="font-bold text-gray-900 dark:text-white">${5 * rates.fiber_500}</div>
            </button>
            <button
              onClick={() => setPlanMix({ fiber_500: 0, fiber_1gig: 5, fiber_2gig: 0, founders_club: 0 })}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="text-sm text-gray-500 dark:text-gray-400">5 Fiber 1 Gig</div>
              <div className="font-bold text-gray-900 dark:text-white">${5 * rates.fiber_1gig}</div>
            </button>
            <button
              onClick={() => setPlanMix({ fiber_500: 2, fiber_1gig: 2, fiber_2gig: 1, founders_club: 0 })}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="text-sm text-gray-500 dark:text-gray-400">Mixed (5 total)</div>
              <div className="font-bold text-gray-900 dark:text-white">
                ${2 * rates.fiber_500 + 2 * rates.fiber_1gig + rates.fiber_2gig}
              </div>
            </button>
            <button
              onClick={() => setPlanMix({ fiber_500: 0, fiber_1gig: 0, fiber_2gig: 0, founders_club: 5 })}
              className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl text-left hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-colors"
            >
              <div className="text-sm text-purple-600 dark:text-purple-400">5 Founders Club</div>
              <div className="font-bold text-purple-700 dark:text-purple-300">${5 * rates.founders_club}</div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
