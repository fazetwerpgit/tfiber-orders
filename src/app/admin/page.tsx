'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { PLAN_NAMES, Order } from '@/lib/types';
import { Download, Users, FileText, DollarSign, Clock, TrendingUp, AlertCircle, Shield } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  totalCommissions: number;
  pendingCommissions: number;
  activeUsers: number;
  ordersByPlan: { name: string; count: number }[];
  ordersByStatus: { name: string; count: number }[];
  ordersOverTime: { date: string; count: number }[];
  topSalespeople: { name: string; orders: number; commission: number }[];
  recentOrders: Order[];
  todayOrders: number;
  weekOrders: number;
}

const COLORS = ['#E20074', '#FF4DA6', '#10B981', '#F59E0B', '#6366F1'];

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    const supabase = createClient();

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    let startDate = new Date(0);
    if (timeRange === 'week') {
      startDate = weekAgo;
    } else if (timeRange === 'month') {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Fetch all orders (for export and full stats)
    const { data: allOrdersData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    setAllOrders(allOrdersData || []);

    // Fetch filtered orders for display
    let query = supabase.from('orders').select('*');
    if (timeRange !== 'all') {
      query = query.gte('created_at', startDate.toISOString());
    }

    const { data: orders } = await query.order('created_at', { ascending: true });

    // Fetch users for salesperson names
    const { data: users } = await supabase.from('users').select('id, name');
    const userMap = new Map(users?.map(u => [u.id, u.name]) || []);

    if (!orders) {
      setLoading(false);
      return;
    }

    // Process analytics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.monthly_price), 0);
    const totalCommissions = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.commission_amount || 0), 0);

    // Pending commissions (not paid yet)
    const pendingCommissions = (allOrdersData || [])
      .filter(o => o.status !== 'cancelled' && !o.commission_paid)
      .reduce((sum, o) => sum + Number(o.commission_amount || 0), 0);

    // Today's orders
    const todayOrders = (allOrdersData || []).filter(o => new Date(o.created_at) >= today).length;

    // Week orders
    const weekOrders = (allOrdersData || []).filter(o => new Date(o.created_at) >= weekAgo).length;

    // Orders by plan
    const planCounts: Record<string, number> = {};
    orders.forEach(o => {
      planCounts[o.plan_type] = (planCounts[o.plan_type] || 0) + 1;
    });
    const ordersByPlan = Object.entries(planCounts).map(([plan, count]) => ({
      name: PLAN_NAMES[plan as keyof typeof PLAN_NAMES] || plan,
      count,
    }));

    // Orders by status
    const statusCounts: Record<string, number> = {};
    orders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      count,
    }));

    // Orders over time
    const dateCounts: Record<string, number> = {};
    orders.forEach(o => {
      const date = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    const ordersOverTime = Object.entries(dateCounts).map(([date, count]) => ({
      date,
      count,
    }));

    // Top salespeople
    const salespeople: Record<string, { name: string; orders: number; commission: number }> = {};
    orders.forEach(o => {
      const name = userMap.get(o.salesperson_id) || 'Unknown';
      if (!salespeople[o.salesperson_id]) {
        salespeople[o.salesperson_id] = { name, orders: 0, commission: 0 };
      }
      salespeople[o.salesperson_id].orders++;
      if (o.status !== 'cancelled') {
        salespeople[o.salesperson_id].commission += Number(o.commission_amount || 0);
      }
    });
    const topSalespeople = Object.values(salespeople)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);

    // Recent orders (last 5)
    const recentOrders = (allOrdersData || []).slice(0, 5);

    setData({
      totalOrders,
      totalRevenue,
      totalCommissions,
      pendingCommissions,
      activeUsers: users?.length || 0,
      ordersByPlan,
      ordersByStatus,
      ordersOverTime,
      topSalespeople,
      recentOrders,
      todayOrders,
      weekOrders,
    });
    setLoading(false);
  };

  const exportToCSV = () => {
    if (!allOrders.length) return;

    const headers = [
      'ID', 'Customer Name', 'Phone', 'Email', 'Address', 'City', 'State', 'ZIP',
      'Plan', 'Monthly Price', 'Install Date', 'Time Slot', 'Status',
      'Commission', 'Commission Paid', 'Promo Code', 'Created At'
    ];

    const csvRows = [
      headers.join(','),
      ...allOrders.map(o => [
        o.id,
        `"${o.customer_name}"`,
        o.customer_phone,
        o.customer_email || '',
        `"${o.service_address}"`,
        o.city,
        o.state,
        o.zip,
        o.plan_type,
        o.monthly_price,
        o.install_date,
        o.install_time_slot,
        o.status,
        o.commission_amount || 0,
        o.commission_paid ? 'Yes' : 'No',
        o.promo_code || '',
        new Date(o.created_at).toISOString()
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading analytics...</div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">Failed to load analytics</div>
    );
  }

  return (
    <main className="p-4 space-y-6">
      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {(['week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-pink-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {range === 'week' ? 'Last 7 Days' : range === 'month' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 text-pink-100 text-sm">
            <Clock className="w-4 h-4" />
            Today
          </div>
          <div className="text-3xl font-bold mt-1">{data.todayOrders}</div>
          <div className="text-pink-200 text-xs">orders</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 text-blue-100 text-sm">
            <TrendingUp className="w-4 h-4" />
            This Week
          </div>
          <div className="text-3xl font-bold mt-1">{data.weekOrders}</div>
          <div className="text-blue-200 text-xs">orders</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 text-green-100 text-sm">
            <Users className="w-4 h-4" />
            Team
          </div>
          <div className="text-3xl font-bold mt-1">{data.activeUsers}</div>
          <div className="text-green-200 text-xs">active users</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 text-amber-100 text-sm">
            <AlertCircle className="w-4 h-4" />
            Pending
          </div>
          <div className="text-3xl font-bold mt-1">${data.pendingCommissions.toFixed(0)}</div>
          <div className="text-amber-200 text-xs">commissions</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Orders</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.totalOrders}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-400">Monthly Revenue</div>
          <div className="text-3xl font-bold text-pink-600">${data.totalRevenue}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Commissions</div>
          <div className="text-3xl font-bold text-green-600">${data.totalCommissions.toFixed(0)}</div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Link href="/admin/users" className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">Manage Users</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Edit user roles</div>
          </div>
        </Link>
        <Link href="/admin/roles" className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">Manage Roles</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Create & edit roles</div>
          </div>
        </Link>
        <Link href="/admin/orders" className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">All Orders</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">View & manage orders</div>
          </div>
        </Link>
        <Link href="/admin/commissions" className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">Commissions</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Manage payouts</div>
          </div>
        </Link>
        <Link href="/admin/activity" className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">Activity Feed</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Real-time sales</div>
          </div>
        </Link>
        <Link href="/team" className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">Leaderboard</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Team performance</div>
          </div>
        </Link>
      </div>

      {/* Orders Over Time Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Orders Over Time</h3>
        {data.ordersOverTime.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.ordersOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Line type="monotone" dataKey="count" stroke="#E20074" strokeWidth={2} dot={{ fill: '#E20074' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No order data yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Orders will appear here as they come in</p>
            </div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Orders by Plan */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Orders by Plan</h3>
          {data.ordersByPlan.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.ordersByPlan}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {data.ordersByPlan.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">No plans data</p>
              </div>
            </div>
          )}
        </div>

        {/* Orders by Status */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Orders by Status</h3>
          {data.ordersByStatus.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ordersByStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#F9FAFB' }}
                  />
                  <Bar dataKey="count" fill="#E20074" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">No status data</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Salespeople */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Top Salespeople</h3>
        </div>
        {data.topSalespeople.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.topSalespeople.map((person, index) => (
              <div key={index} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{person.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">{person.orders}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">orders</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">${person.commission.toFixed(0)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">commission</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No salespeople data yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Leaderboard will populate as orders come in</p>
          </div>
        )}
      </div>
    </main>
  );
}
