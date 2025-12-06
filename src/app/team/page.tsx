'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Medal, TrendingUp, Flame, DollarSign, BarChart3 } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface LeaderboardEntry {
  id: string;
  name: string;
  email: string;
  order_count: number;
  total_commission: number;
  avg_commission: number;
  current_streak: number;
}

type TimeRange = 'today' | 'week' | 'month' | 'all';
type SortBy = 'orders' | 'commission' | 'streak';

export default function TeamPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [sortBy, setSortBy] = useState<SortBy>('orders');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadLeaderboard = async () => {
    setLoading(true);
    const supabase = createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    // Calculate date range
    const now = new Date();
    let startDate = new Date(0); // Default to all time

    if (timeRange === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === 'week') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 1);
    }

    // Get all users
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email');

    // Get streaks for all users
    const { data: streaks } = await supabase
      .from('user_streaks')
      .select('user_id, current_streak');

    const streakMap = new Map<string, number>();
    streaks?.forEach(s => streakMap.set(s.user_id, s.current_streak || 0));

    // Get orders within date range
    let ordersQuery = supabase
      .from('orders')
      .select('salesperson_id, commission_amount')
      .neq('status', 'cancelled');

    if (timeRange !== 'all') {
      ordersQuery = ordersQuery.gte('created_at', startDate.toISOString());
    }

    const { data: orders } = await ordersQuery;

    if (users && orders) {
      const leaderboardData: LeaderboardEntry[] = users.map(user => {
        const userOrders = orders.filter(o => o.salesperson_id === user.id);
        const totalCommission = userOrders.reduce((sum, o) => sum + (o.commission_amount || 0), 0);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          order_count: userOrders.length,
          total_commission: totalCommission,
          avg_commission: userOrders.length > 0 ? totalCommission / userOrders.length : 0,
          current_streak: streakMap.get(user.id) || 0,
        };
      });

      // Sort based on selected metric
      if (sortBy === 'orders') {
        leaderboardData.sort((a, b) => b.order_count - a.order_count);
      } else if (sortBy === 'commission') {
        leaderboardData.sort((a, b) => b.total_commission - a.total_commission);
      } else if (sortBy === 'streak') {
        leaderboardData.sort((a, b) => b.current_streak - a.current_streak);
      }

      setLeaderboard(leaderboardData);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadLeaderboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, sortBy]);

  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900';
    if (index === 1) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800';
    if (index === 2) return 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100';
    return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5" />;
    if (index === 1) return <Medal className="w-5 h-5" />;
    if (index === 2) return <Medal className="w-5 h-5" />;
    return <span className="text-sm font-bold">#{index + 1}</span>;
  };

  const currentUserRank = leaderboard.findIndex(e => e.id === currentUserId) + 1;
  const currentUserEntry = leaderboard.find(e => e.id === currentUserId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-600 to-pink-700 text-white px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="p-2 -ml-2 hover:bg-pink-500/50 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Team Leaderboard</h1>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-3">
          {(['today', 'week', 'month', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                timeRange === range
                  ? 'bg-white text-pink-600'
                  : 'bg-pink-500/30 text-white hover:bg-pink-500/50'
              }`}
            >
              {range === 'today' ? 'Today' : range === 'week' ? 'Week' : range === 'month' ? 'Month' : 'All'}
            </button>
          ))}
        </div>

        {/* Sort By Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('orders')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
              sortBy === 'orders'
                ? 'bg-white/20 text-white'
                : 'text-pink-200 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Orders
          </button>
          <button
            onClick={() => setSortBy('commission')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
              sortBy === 'commission'
                ? 'bg-white/20 text-white'
                : 'text-pink-200 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Commission
          </button>
          <button
            onClick={() => setSortBy('streak')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
              sortBy === 'streak'
                ? 'bg-white/20 text-white'
                : 'text-pink-200 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            Streaks
          </button>
        </div>
      </header>

      {/* Current User Rank Card */}
      {currentUserEntry && (
        <div className="mx-4 -mt-4 bg-white dark:bg-gray-900 rounded-xl p-4 shadow-lg border-2 border-pink-200 dark:border-pink-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Your Rank</div>
              <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">#{currentUserRank}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{currentUserEntry.order_count}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">orders</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">${currentUserEntry.total_commission.toFixed(0)}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">commission</div>
            </div>
          </div>
          {currentUserRank > 1 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {leaderboard[currentUserRank - 2].order_count - currentUserEntry.order_count + 1} more orders to reach #{currentUserRank - 1}!
              </span>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      <main className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading leaderboard...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">No team members yet</div>
        ) : (
          leaderboard.map((entry, index) => (
            <div
              key={entry.id}
              className={`bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm flex items-center gap-4 ${
                entry.id === currentUserId ? 'ring-2 ring-pink-400' : ''
              }`}
            >
              {/* Rank Badge */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankStyle(index)}`}>
                {getRankIcon(index)}
              </div>

              {/* Name & Email */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white truncate">
                  {entry.name}
                  {entry.id === currentUserId && (
                    <span className="ml-2 text-xs bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300 px-2 py-0.5 rounded-full">You</span>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{entry.email}</div>
              </div>

              {/* Stats */}
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900 dark:text-white">{entry.order_count}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">orders</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">${entry.total_commission.toFixed(0)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">earned</div>
              </div>
              {entry.current_streak > 0 && (
                <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{entry.current_streak}</span>
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
