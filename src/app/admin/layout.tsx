'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Users, FileText, DollarSign } from 'lucide-react';
import { checkAdminStatus } from './actions';

const navItems = [
  { href: '/admin', label: 'Dashboard', Icon: BarChart3 },
  { href: '/admin/users', label: 'Users', Icon: Users },
  { href: '/admin/orders', label: 'Orders', Icon: FileText },
  { href: '/admin/commissions', label: 'Commissions', Icon: DollarSign },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifyAdmin();
  }, []);

  const verifyAdmin = async () => {
    const result = await checkAdminStatus();

    if (result.error === 'Not authenticated') {
      router.push('/login');
      return;
    }

    if (!result.isAdmin) {
      setError(result.error || 'Admin access required');
      setLoading(false);
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Verifying admin access...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Admin Access Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-600 to-pink-700 text-white px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 hover:bg-pink-500/50 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2 overflow-x-auto">
        <div className="flex gap-1">
          {navItems.map(({ href, label, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      {children}
    </div>
  );
}
