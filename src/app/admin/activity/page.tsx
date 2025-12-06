'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, Clock, User, FileText, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { PLAN_NAMES, Order } from '@/lib/types';

interface ActivityItem {
  id: string;
  type: 'order_created' | 'order_updated' | 'order_cancelled';
  order: Order;
  salesperson_name: string;
  created_at: string;
}

interface SalespersonStats {
  id: string;
  name: string;
  email: string;
  todayOrders: number;
  todayCommission: number;
  lastSale: string | null;
}

export default function ActivityFeedPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [salespeople, setSalespeople] = useState<SalespersonStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today'>('today');

  const loadActivity = async () => {
    setLoading(true);
    const supabase = createClient();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all users
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email');

    const userMap = new Map(users?.map(u => [u.id, u]) || []);

    // Get recent orders
    let ordersQuery = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter === 'today') {
      ordersQuery = ordersQuery.gte('created_at', today.toISOString());
    } else {
      ordersQuery = ordersQuery.limit(50);
    }

    const { data: orders } = await ordersQuery;

    // Build activity feed
    const activityItems: ActivityItem[] = (orders || []).map(order => ({
      id: order.id,
      type: order.status === 'cancelled' ? 'order_cancelled' : 'order_created',
      order,
      salesperson_name: userMap.get(order.salesperson_id)?.name || 'Unknown',
      created_at: order.created_at,
    }));

    setActivities(activityItems);

    // Calculate salesperson stats for today
    const stats: Record<string, SalespersonStats> = {};
    
    users?.forEach(user => {
      stats[user.id] = {
        id: user.id,
        name: user.name,
        email: user.email,
        todayOrders: 0,
        todayCommission: 0,
        lastSale: null,
      };
    });

    const todayOrders = (orders || []).filter(o => 
      new Date(o.created_at) >= today && o.status !== 'cancelled'
    );

    todayOrders.forEach(order => {
      if (stats[order.salesperson_id]) {
        stats[order.salesperson_id].todayOrders++;
        stats[order.salesperson_id].todayCommission += order.commission_amount || 0;
        if (!stats[order.salesperson_id].lastSale || 
            new Date(order.created_at) > new Date(stats[order.salesperson_id].lastSale!)) {
          stats[order.salesperson_id].lastSale = order.created_at;
        }
      }
    });

    // Sort by today's orders descending
    const sortedStats = Object.values(stats).sort((a, b) => b.todayOrders - a.todayOrders);
    setSalespeople(sortedStats);

    setLoading(false);
  };

  useEffect(() => {
    loadActivity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">Loading activity...</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-6">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/admin" className="p-2 -ml-2 hover:bg-white/20 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6" />
            <h1 className="text-xl font-bold">Team Activity</h1>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'today'
                ? 'bg-white text-indigo-600'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'all'
                ? 'bg-white text-indigo-600'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Recent (50)
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Team Performance Cards */}
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Today&apos;s Performance
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {salespeople.slice(0, 6).map((person) => (
              <div
                key={person.id}
                className={`bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm ${
                  person.todayOrders > 0 ? 'ring-2 ring-green-400' : ''
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {person.name}
                    </div>
                    {person.lastSale && (
                      <div className="text-xs text-gray-500">
                        Last: {formatTime(person.lastSale)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {person.todayOrders}
                    </div>
                    <div className="text-xs text-gray-500">orders</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ${person.todayCommission.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500">commission</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Activity Feed
          </h2>
          
          {activities.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center">
              <Activity className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <div className="text-gray-500 dark:text-gray-400">No activity {filter === 'today' ? 'today' : 'yet'}</div>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/orders/${activity.id}`}
                  className="block bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === 'order_cancelled' 
                        ? 'bg-red-100 dark:bg-red-900/30' 
                        : 'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      <FileText className={`w-5 h-5 ${
                        activity.type === 'order_cancelled'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {activity.salesperson_name}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {activity.type === 'order_cancelled' ? 'cancelled' : 'sold'}
                        </span>
                        <span className="font-medium text-pink-600 dark:text-pink-400">
                          {PLAN_NAMES[activity.order.plan_type]}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {activity.order.customer_name} - {activity.order.city}, {activity.order.state}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span>{formatTime(activity.created_at)}</span>
                        {activity.order.commission_amount && (
                          <span className="text-green-600 font-medium">
                            +${activity.order.commission_amount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
