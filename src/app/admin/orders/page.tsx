'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Order, PLAN_NAMES, TIME_SLOT_LABELS } from '@/lib/types';
import { Search, ChevronRight, Trash2, X } from 'lucide-react';
import { getAllOrders, deleteOrder } from './actions';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  scheduled: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  installed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

interface OrderWithSalesperson extends Order {
  salesperson_name?: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithSalesperson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const result = await getAllOrders();
    if (result.error) {
      console.error('Error loading orders:', result.error);
    } else {
      setOrders(result.orders);
    }
    setLoading(false);
  };

  const handleDelete = async (orderId: string) => {
    setDeleting(true);
    const result = await deleteOrder(orderId);
    if (result.success) {
      setOrders(orders.filter(o => o.id !== orderId));
      setDeleteConfirm(null);
    } else {
      alert(result.error || 'Failed to delete order');
    }
    setDeleting(false);
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.customer_name.toLowerCase().includes(query) ||
      order.customer_phone.includes(query) ||
      order.salesperson_name?.toLowerCase().includes(query) ||
      order.city.toLowerCase().includes(query) ||
      order.service_address.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <main className="p-4 space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, address, or salesperson..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="scheduled">Scheduled</option>
          <option value="installed">Installed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredOrders.length} of {orders.length} orders
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">No orders found</div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <Link href={`/orders/${order.id}`} className="flex-1 min-w-0">
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
                    <span className="text-pink-600 font-medium">
                      {PLAN_NAMES[order.plan_type]}
                    </span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatDate(order.install_date)} {TIME_SLOT_LABELS[order.install_time_slot]}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    Salesperson: <span className="text-gray-600 dark:text-gray-400">{order.salesperson_name}</span>
                    {order.promo_code && (
                      <span className="ml-3">Promo: <span className="text-pink-600">{order.promo_code}</span></span>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-3 ml-4">
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      ${order.monthly_price}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">/mo</span>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(order.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete order"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Order?</h3>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
