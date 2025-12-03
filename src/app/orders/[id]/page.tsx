'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Order, PLAN_NAMES, PLAN_SPEEDS, TIME_SLOT_LABELS } from '@/lib/types';

const STATUS_COLORS = {
  new: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  scheduled: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  installed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  completed: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
};

const STATUS_OPTIONS = ['new', 'scheduled', 'installed', 'completed', 'cancelled'] as const;

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  const loadOrder = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error loading order:', error);
    } else {
      setOrder(data);
    }
    setLoading(false);
  };

  const updateStatus = async (newStatus: string) => {
    if (!order) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id);

    if (!error) {
      setOrder({ ...order, status: newStatus as Order['status'] });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="text-gray-500 dark:text-gray-400 mb-4">Order not found</div>
        <Link href="/orders" className="text-pink-600 dark:text-pink-400 font-medium hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-6">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/orders" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Order Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Edit2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Status Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Status</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[order.status]}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => updateStatus(status)}
                disabled={order.status === status}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  order.status === status
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Customer</h2>
          <div className="space-y-3">
            <div className="text-xl font-bold text-gray-900 dark:text-white">{order.customer_name}</div>

            <a
              href={`tel:${order.customer_phone}`}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
            >
              <Phone className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              <span className="text-gray-900 dark:text-gray-100">{order.customer_phone}</span>
            </a>

            {order.customer_email && (
              <a
                href={`mailto:${order.customer_email}`}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
              >
                <Mail className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                <span className="text-gray-900 dark:text-gray-100">{order.customer_email}</span>
              </a>
            )}

            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <MapPin className="w-5 h-5 text-pink-600 dark:text-pink-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-gray-900 dark:text-gray-100">{order.service_address}</div>
                <div className="text-gray-500 dark:text-gray-400">{order.city}, {order.state} {order.zip}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Details */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Plan</h2>
          <div className="flex items-center justify-between p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800/50">
            <div>
              <div className="text-lg font-bold text-pink-700 dark:text-pink-400">{PLAN_NAMES[order.plan_type]}</div>
              <div className="text-sm text-pink-600 dark:text-pink-500">{PLAN_SPEEDS[order.plan_type]}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-pink-700 dark:text-pink-400">${order.monthly_price}</div>
              <div className="text-sm text-pink-600 dark:text-pink-500">/month</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Pricing: {order.pricing_tier.replace('_', ' + ').replace('_', ' ')}
          </div>
        </div>

        {/* Installation */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Installation</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Calendar className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              <span className="text-gray-900 dark:text-gray-100">{formatDate(order.install_date)}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              <span className="text-gray-900 dark:text-gray-100">{TIME_SLOT_LABELS[order.install_time_slot]}</span>
            </div>
            {order.access_notes && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/50">
                <div className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-1">Notes</div>
                <div className="text-yellow-700 dark:text-yellow-300">{order.access_notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* Commission */}
        {order.commission_amount && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Commission</h2>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Amount</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">${order.commission_amount}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-600 dark:text-gray-400">Status</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                order.commission_paid
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
              }`}>
                {order.commission_paid ? 'Paid' : 'Pending'}
              </span>
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="text-center text-sm text-gray-400 dark:text-gray-500 space-y-1">
          <div>Created: {new Date(order.created_at).toLocaleString()}</div>
          <div>Order ID: {order.id}</div>
        </div>
      </main>
    </div>
  );
}
