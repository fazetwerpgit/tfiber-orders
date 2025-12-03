'use client';

import { useEffect, useState } from 'react';
import { User, UserRole, Role } from '@/lib/types';
import { Search, Edit2, Check, X } from 'lucide-react';
import { getAllUsers, updateUserRole } from './actions';
import { getAllRoles } from '../roles/actions';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole>('salesperson');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [usersResult, rolesResult] = await Promise.all([
      getAllUsers(),
      getAllRoles(),
    ]);

    if (usersResult.error) {
      console.error('Error loading users:', usersResult.error);
    } else {
      setUsers(usersResult.users);
    }

    if (!rolesResult.error) {
      setRoles(rolesResult.roles);
    }

    setLoading(false);
  };

  const handleUpdateRole = async (userId: string) => {
    setSaving(true);
    const result = await updateUserRole(userId, editingRole);

    if (result.success) {
      setUsers(users.map(u =>
        u.id === userId ? { ...u, role: editingRole } : u
      ));
      setEditingId(null);
    } else {
      alert(result.error || 'Failed to update role.');
    }
    setSaving(false);
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const getRoleBadgeColor = (roleName: UserRole) => {
    const role = roles.find(r => r.name === roleName);
    const colorMap: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    };
    return colorMap[role?.color || 'gray'] || colorMap.gray;
  };

  const getRoleDisplayName = (roleName: UserRole) => {
    const role = roles.find(r => r.name === roleName);
    return role?.display_name || roleName;
  };

  return (
    <main className="p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
        />
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <div className="bg-white dark:bg-gray-900 px-4 py-2 rounded-lg">
          <span className="text-gray-500 dark:text-gray-400">Total: </span>
          <span className="font-bold text-gray-900 dark:text-white">{users.length}</span>
        </div>
        <div className="bg-white dark:bg-gray-900 px-4 py-2 rounded-lg">
          <span className="text-gray-500 dark:text-gray-400">Admins: </span>
          <span className="font-bold text-red-600">{users.filter(u => u.role === 'admin').length}</span>
        </div>
        <div className="bg-white dark:bg-gray-900 px-4 py-2 rounded-lg">
          <span className="text-gray-500 dark:text-gray-400">Managers: </span>
          <span className="font-bold text-blue-600">{users.filter(u => u.role === 'manager').length}</span>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No users found</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{user.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {editingId === user.id ? (
                    <>
                      <select
                        value={editingRole}
                        onChange={(e) => setEditingRole(e.target.value as UserRole)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm"
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.name}>
                            {role.display_name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleUpdateRole(user.id)}
                        disabled={saving}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                      <button
                        onClick={() => {
                          setEditingId(user.id);
                          setEditingRole(user.role);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
