'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Shield, DollarSign, LogOut, ChevronRight, Edit2, Check, X, Sun, Moon, Monitor, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { PLAN_NAMES } from '@/lib/types';
import { useTheme } from '@/lib/theme-context';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CommissionRate {
  plan_type: string;
  amount: number;
}

interface UserGoals {
  daily_goal: number;
  weekly_goal: number;
  monthly_goal: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [commissionRates, setCommissionRates] = useState<CommissionRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [saving, setSaving] = useState(false);
  const [goals, setGoals] = useState<UserGoals>({ daily_goal: 3, weekly_goal: 15, monthly_goal: 50 });
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [editedGoals, setEditedGoals] = useState<UserGoals>({ daily_goal: 3, weekly_goal: 15, monthly_goal: 50 });

  useEffect(() => {
    const loadSettings = async () => {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setEditedName(profileData.name);
      }

      // Get commission rates
      const { data: rates } = await supabase
        .from('commission_rates')
        .select('*')
        .order('amount', { ascending: true });

      if (rates) {
        setCommissionRates(rates);
      }

      // Get user goals
      const { data: goalsData } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (goalsData) {
        setGoals(goalsData);
        setEditedGoals(goalsData);
      }

      setLoading(false);
    };

    loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveGoals = async () => {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('user_goals')
      .upsert({
        user_id: profile.id,
        daily_goal: editedGoals.daily_goal,
        weekly_goal: editedGoals.weekly_goal,
        monthly_goal: editedGoals.monthly_goal,
      });

    if (!error) {
      setGoals(editedGoals);
      setIsEditingGoals(false);
    } else {
      alert('Failed to update goals. Please try again.');
    }
    setSaving(false);
  };

  const handleSaveName = async () => {
    if (!profile || !editedName.trim()) return;

    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('users')
      .update({ name: editedName.trim() })
      .eq('id', profile.id);

    if (!error) {
      setProfile({ ...profile, name: editedName.trim() });
      setIsEditingName(false);
    } else {
      alert('Failed to update name. Please try again.');
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-6">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Profile</h2>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="flex-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 outline-none text-lg"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setEditedName(profile?.name || '');
                      }}
                      className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{profile?.name}</div>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
                  <Mail className="w-4 h-4" />
                  {profile?.email}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Role</div>
                  <div className="font-medium text-gray-900 dark:text-white capitalize">{profile?.role}</div>
                </div>
              </div>
              {profile?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors"
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Sales Goals Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Sales Goals</h2>
            {!isEditingGoals ? (
              <button
                onClick={() => setIsEditingGoals(true)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveGoals}
                  disabled={saving}
                  className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsEditingGoals(false);
                    setEditedGoals(goals);
                  }}
                  className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="p-4 space-y-4">
            {[
              { key: 'daily_goal' as const, label: 'Daily Goal', desc: 'Orders per day' },
              { key: 'weekly_goal' as const, label: 'Weekly Goal', desc: 'Orders per week' },
              { key: 'monthly_goal' as const, label: 'Monthly Goal', desc: 'Orders per month' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{label}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </div>
                </div>
                {isEditingGoals ? (
                  <input
                    type="number"
                    min="1"
                    value={editedGoals[key]}
                    onChange={(e) => setEditedGoals(prev => ({ ...prev, [key]: parseInt(e.target.value) || 1 }))}
                    className="w-20 px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-center font-bold"
                  />
                ) : (
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{goals[key]}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Appearance</h2>
          </div>
          <div className="p-4">
            <div className="flex gap-2">
              {[
                { value: 'light' as const, label: 'Light', Icon: Sun },
                { value: 'dark' as const, label: 'Dark', Icon: Moon },
                { value: 'system' as const, label: 'System', Icon: Monitor },
              ].map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                    theme === value
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Commission Rates Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Commission Rates</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Per completed order</p>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {commissionRates.map((rate) => (
              <div key={rate.plan_type} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {PLAN_NAMES[rate.plan_type as keyof typeof PLAN_NAMES] || rate.plan_type}
                  </span>
                </div>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">${rate.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">App Info</h2>
          </div>

          <div className="p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Version</span>
              <span className="text-gray-900 dark:text-white">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Build</span>
              <span className="text-gray-900 dark:text-white">Production</span>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 flex items-center justify-between text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </div>
          <ChevronRight className="w-5 h-5" />
        </button>
      </main>
    </div>
  );
}
