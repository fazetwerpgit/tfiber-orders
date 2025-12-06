'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Users, Settings, TrendingUp, DollarSign, LogOut, Flame, Target, Trophy, Calculator, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Order, PLAN_NAMES } from '@/lib/types';
import { TFiberLogo } from '@/components/branding/t-fiber-logo';

interface Stats {
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
  pendingCommission: number;
}

interface GoalData {
  dailyGoal: number;
  weeklyGoal: number;
  monthlyGoal: number;
  currentStreak: number;
  longestStreak: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [stats, setStats] = useState<Stats>({
    todayOrders: 0,
    weekOrders: 0,
    monthOrders: 0,
    pendingCommission: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [goalData, setGoalData] = useState<GoalData>({
    dailyGoal: 3,
    weeklyGoal: 15,
    monthlyGoal: 50,
    currentStreak: 0,
    longestStreak: 0,
  });

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    setUser({ email: user.email || '', name: user.user_metadata?.full_name });
    await loadDashboardData();
    setLoading(false);
  };

  const loadDashboardData = async () => {
    const supabase = createClient();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (orders) {
      const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
      const weekOrders = orders.filter(o => new Date(o.created_at) >= weekAgo);
      const pending = orders
        .filter(o => o.status !== 'cancelled' && !o.commission_paid)
        .reduce((sum, o) => sum + (o.commission_amount || 0), 0);

      setStats({
        todayOrders: todayOrders.length,
        weekOrders: weekOrders.length,
        monthOrders: orders.length,
        pendingCommission: pending,
      });

      setRecentOrders(orders.slice(0, 5));
    }

    // Load goals and streaks
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: goals } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: streak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (goals || streak) {
        setGoalData({
          dailyGoal: goals?.daily_goal || 3,
          weeklyGoal: goals?.weekly_goal || 15,
          monthlyGoal: goals?.monthly_goal || 50,
          currentStreak: streak?.current_streak || 0,
          longestStreak: streak?.longest_streak || 0,
        });
      }
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const commissionDisplay = `$${stats.pendingCommission.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <header className="bg-gradient-to-br from-pink-600 via-pink-600 to-pink-700 text-white px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <TFiberLogo variant="full" size="sm" theme="dark" />
          <div className="flex items-center gap-2">
            <span className="text-pink-200 text-sm font-medium">{user?.name || user?.email}</span>
            <button onClick={handleSignOut} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="text-3xl font-extrabold">{stats.todayOrders}</div>
            <div className="text-xs text-pink-200 font-medium mt-1">Today</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="text-3xl font-extrabold">{stats.weekOrders}</div>
            <div className="text-xs text-pink-200 font-medium mt-1">This Week</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="text-3xl font-extrabold">{stats.monthOrders}</div>
            <div className="text-xs text-pink-200 font-medium mt-1">Total</div>
          </div>
        </div>

        {/* Streak Badge */}
        {goalData.currentStreak > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500/30 to-red-500/30 rounded-xl py-2 px-4">
            <Flame className="w-5 h-5 text-orange-300" />
            <span className="font-bold text-white">{goalData.currentStreak} Day Streak!</span>
            {goalData.currentStreak >= goalData.longestStreak && goalData.currentStreak > 1 && (
              <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">BEST</span>
            )}
          </div>
        )}
      </header>

      <main className="p-4 space-y-4">
        {/* Daily Goal Progress */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-5 shadow-sm border border-blue-100 dark:border-blue-900/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-blue-700 dark:text-blue-400 font-medium">Daily Goal</div>
                <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                  {stats.todayOrders} / {goalData.dailyGoal}
                </div>
              </div>
            </div>
            {stats.todayOrders >= goalData.dailyGoal ? (
              <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-bold">Done!</span>
              </div>
            ) : (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {goalData.dailyGoal - stats.todayOrders}
                </div>
                <div className="text-xs text-blue-500 dark:text-blue-500">to go</div>
              </div>
            )}
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((stats.todayOrders / goalData.dailyGoal) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-5 shadow-sm border border-green-100 dark:border-green-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-green-700 dark:text-green-400 font-medium">Pending Commission</div>
                <div className="text-3xl font-extrabold text-green-600 dark:text-green-400">{commissionDisplay}</div>
              </div>
            </div>
            <Link href="/calculator" className="p-2 bg-green-100 dark:bg-green-900/50 rounded-xl hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors">
              <Calculator className="w-6 h-6 text-green-600 dark:text-green-400" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/orders/new" className="bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-2xl p-5 flex items-center gap-3 hover:from-pink-700 hover:to-pink-800 transition-all shadow-lg shadow-pink-500/30">
            <Plus className="w-7 h-7" strokeWidth={2.5} />
            <span className="font-bold text-lg">New Order</span>
          </Link>
          <Link href="/orders" className="bg-white dark:bg-gray-900 rounded-2xl p-5 flex items-center gap-3 shadow-sm hover:shadow-lg transition-all border border-gray-100 dark:border-gray-800">
            <FileText className="w-7 h-7 text-gray-500 dark:text-gray-400" />
            <span className="font-bold text-lg text-gray-900 dark:text-white">View Orders</span>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/badges" className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 flex items-center gap-3 border border-purple-100 dark:border-purple-900/50">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">Badges</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">View achievements</div>
            </div>
          </Link>
          <Link href="/team" className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 flex items-center gap-3 border border-blue-100 dark:border-blue-900/50">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">Leaderboard</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Team rankings</div>
            </div>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">Recent Orders</h2>
            <Link href="/orders" className="text-sm text-pink-600 dark:text-pink-400 font-semibold hover:text-pink-700 dark:hover:text-pink-300">See All</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="text-gray-500 dark:text-gray-400 font-medium">No orders yet</div>
                <div className="text-gray-400 dark:text-gray-500 text-sm mt-1">Create your first order!</div>
              </div>
            ) : (
              recentOrders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{order.customer_name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">{PLAN_NAMES[order.plan_type]}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">${order.monthly_price}/mo</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">{new Date(order.created_at).toLocaleDateString()}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 px-4 py-2 safe-area-pb">
        <div className="flex items-center justify-around">
          <Link href="/" className="flex flex-col items-center py-2 px-3 text-pink-600 dark:text-pink-400">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs mt-1 font-semibold">Dashboard</span>
            <span className="w-1 h-1 bg-pink-600 dark:bg-pink-400 rounded-full mt-1"></span>
          </Link>
          <Link href="/orders" className="flex flex-col items-center py-2 px-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <FileText className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Orders</span>
          </Link>
          <Link href="/orders/new" className="w-16 h-16 -mt-8 bg-gradient-to-br from-pink-500 to-pink-700 rounded-full flex items-center justify-center shadow-xl shadow-pink-500/40 hover:shadow-pink-500/60 hover:scale-105 transition-all">
            <Plus className="w-8 h-8 text-white" strokeWidth={2.5} />
          </Link>
          <Link href="/team" className="flex flex-col items-center py-2 px-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Users className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Team</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center py-2 px-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Settings className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
