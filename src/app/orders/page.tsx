'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Order, PLAN_NAMES, TIME_SLOT_LABELS } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  scheduled: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  installed: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  completed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
};

function SuccessMessage() {
  const searchParams = useSearchParams();
  const showSuccess = searchParams.get('success') === '1';

  if (!showSuccess) return null;

  return (
    <div className="mx-4 mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      <span className="text-green-700 dark:text-green-300 font-medium">Order submitted successfully!</span>
    </div>
  );
}

function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.customer_name.toLowerCase().includes(query) ||
      order.customer_phone.includes(query) ||
      order.service_address.toLowerCase().includes(query) ||
      order.city.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Orders</h1>
          </div>
          <Link
            href="/orders/new"
            className="flex items-center gap-1 px-3 py-2 bg-pink-600 text-white rounded-lg font-medium text-sm hover:bg-pink-700"
          >
            <Plus className="w-4 h-4" />
            New
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
      </header>

      <Suspense fallback={null}>
        <SuccessMessage />
      </Suspense>

      <main className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery ? 'No orders found' : 'No orders yet'}
            </p>
            {!searchQuery && (
              <Link
                href="/orders/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700"
              >
                <Plus className="w-4 h-4" />
                Create First Order
              </Link>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-transparent dark:border-gray-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                      {order.customer_name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {order.service_address}, {order.city}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="text-pink-600 dark:text-pink-400 font-medium">
                      {PLAN_NAMES[order.plan_type]}
                    </span>
                    <span className="text-gray-400 dark:text-gray-600">|</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatDate(order.install_date)} {TIME_SLOT_LABELS[order.install_time_slot]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    ${order.monthly_price}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            </Link>
          ))
        )}
      </main>

      <Link
        href="/orders/new"
        className="fixed bottom-6 right-6 w-14 h-14 bg-pink-600 rounded-full shadow-lg flex items-center justify-center hover:bg-pink-700 transition-colors"
      >
        <Plus className="w-7 h-7 text-white" />
      </Link>
    </>
  );
}

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <OrdersList />
    </div>
  );
}
