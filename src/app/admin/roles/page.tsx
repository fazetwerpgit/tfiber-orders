'use client';

import { useEffect, useState } from 'react';
import { Role, RoleCommissionRate, PlanType, PLAN_NAMES } from '@/lib/types';
import { Plus, Edit2, Trash2, Check, X, Shield, Lock, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { getAllRoles, createRole, updateRole, deleteRole, getRoleCommissionRates, updateRoleCommissionRate, initializeRoleCommissionRates } from './actions';

const ROLE_COLORS = [
  { name: 'gray', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-500' },
  { name: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  { name: 'green', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  { name: 'red', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  { name: 'pink', bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', dot: 'bg-pink-500' },
  { name: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  { name: 'amber', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
];

function getRoleColorClasses(colorName: string) {
  return ROLE_COLORS.find(c => c.name === colorName) || ROLE_COLORS[0];
}

const PLAN_TYPES: PlanType[] = ['fiber_500', 'fiber_1gig', 'fiber_2gig', 'founders_club'];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Commission rates state
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [commissionRates, setCommissionRates] = useState<Record<string, RoleCommissionRate[]>>({});
  const [editingCommission, setEditingCommission] = useState<{ roleName: string; planType: PlanType } | null>(null);
  const [commissionValue, setCommissionValue] = useState('');
  const [savingCommission, setSavingCommission] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    color: 'gray',
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    const result = await getAllRoles();
    if (result.error) {
      setError(result.error);
    } else {
      setRoles(result.roles);
    }
    setLoading(false);
  };

  const loadCommissionRates = async (roleName: string) => {
    if (commissionRates[roleName]) return; // Already loaded

    const result = await getRoleCommissionRates(roleName);
    if (!result.error) {
      setCommissionRates(prev => ({ ...prev, [roleName]: result.rates }));
    }
  };

  const toggleRoleExpand = async (roleName: string) => {
    if (expandedRole === roleName) {
      setExpandedRole(null);
    } else {
      setExpandedRole(roleName);
      await loadCommissionRates(roleName);
    }
  };

  const handleCommissionEdit = (roleName: string, planType: PlanType, currentAmount: number) => {
    setEditingCommission({ roleName, planType });
    setCommissionValue(currentAmount.toString());
  };

  const handleCommissionSave = async () => {
    if (!editingCommission) return;

    const amount = parseFloat(commissionValue);
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid commission amount');
      return;
    }

    setSavingCommission(true);
    const result = await updateRoleCommissionRate(
      editingCommission.roleName,
      editingCommission.planType,
      amount
    );

    if (result.success) {
      // Update local state
      setCommissionRates(prev => ({
        ...prev,
        [editingCommission.roleName]: prev[editingCommission.roleName]?.map(rate =>
          rate.plan_type === editingCommission.planType
            ? { ...rate, amount }
            : rate
        ) || [],
      }));
      setEditingCommission(null);
    } else {
      alert(result.error || 'Failed to save commission rate');
    }
    setSavingCommission(false);
  };

  const getCommissionAmount = (roleName: string, planType: PlanType): number => {
    const rates = commissionRates[roleName] || [];
    const rate = rates.find(r => r.plan_type === planType);
    return rate?.amount ?? 0;
  };

  const resetForm = () => {
    setFormData({ name: '', display_name: '', description: '', color: 'gray' });
    setError(null);
  };

  const handleCreate = async () => {
    if (!formData.display_name.trim()) {
      setError('Role name is required');
      return;
    }

    setSaving(true);
    setError(null);

    const result = await createRole({
      name: formData.name || formData.display_name,
      display_name: formData.display_name,
      description: formData.description,
      color: formData.color,
    });

    if (result.success && result.role) {
      setRoles([...roles, result.role]);
      setShowCreateModal(false);
      resetForm();
    } else {
      setError(result.error || 'Failed to create role');
    }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingRole) return;

    setSaving(true);
    setError(null);

    const result = await updateRole(editingRole.id, {
      display_name: formData.display_name,
      description: formData.description,
      color: formData.color,
    });

    if (result.success) {
      setRoles(roles.map(r =>
        r.id === editingRole.id
          ? { ...r, display_name: formData.display_name, description: formData.description, color: formData.color }
          : r
      ));
      setEditingRole(null);
      resetForm();
    } else {
      setError(result.error || 'Failed to update role');
    }
    setSaving(false);
  };

  const handleDelete = async (roleId: string) => {
    setSaving(true);
    const result = await deleteRole(roleId);

    if (result.success) {
      setRoles(roles.filter(r => r.id !== roleId));
      setDeleteConfirm(null);
    } else {
      alert(result.error || 'Failed to delete role');
    }
    setSaving(false);
  };

  const openEditModal = (role: Role) => {
    setFormData({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
      color: role.color,
    });
    setEditingRole(role);
    setError(null);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingRole(null);
    resetForm();
  };

  return (
    <main className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Manage Roles</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create and manage user roles</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Role
        </button>
      </div>

      {/* Roles List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading roles...</div>
        ) : roles.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No roles found</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {roles.map((role) => {
              const colorClasses = getRoleColorClasses(role.color);
              const isExpanded = expandedRole === role.name;
              return (
                <div key={role.id} className="overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses.bg}`}>
                        {role.is_system ? (
                          <Lock className={`w-5 h-5 ${colorClasses.text}`} />
                        ) : (
                          <Shield className={`w-5 h-5 ${colorClasses.text}`} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {role.display_name}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses.bg} ${colorClasses.text}`}>
                            {role.name}
                          </span>
                          {role.is_system && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                              System
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {role.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRoleExpand(role.name)}
                        className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-sm ${
                          isExpanded
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                        title="Edit commissions"
                      >
                        <DollarSign className="w-4 h-4" />
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEditModal(role)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit role"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    {!role.is_system && (
                      <button
                        onClick={() => setDeleteConfirm(role.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                  {/* Expandable Commission Rates Section */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-800/50">
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Commission Rates
                        </h4>
                        {!commissionRates[role.name] ? (
                          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
                        ) : commissionRates[role.name].length === 0 ? (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            No commission rates set.{' '}
                            <button
                              onClick={async () => {
                                await initializeRoleCommissionRates(role.name);
                                const result = await getRoleCommissionRates(role.name);
                                if (!result.error) {
                                  setCommissionRates(prev => ({ ...prev, [role.name]: result.rates }));
                                }
                              }}
                              className="text-pink-600 hover:underline"
                            >
                              Initialize from defaults
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {PLAN_TYPES.map((planType) => {
                              const amount = getCommissionAmount(role.name, planType);
                              const isEditing = editingCommission?.roleName === role.name && editingCommission?.planType === planType;
                              return (
                                <div
                                  key={planType}
                                  className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                                >
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    {PLAN_NAMES[planType]}
                                  </div>
                                  {isEditing ? (
                                    <div className="flex items-center gap-1">
                                      <span className="text-gray-400">$</span>
                                      <input
                                        type="number"
                                        value={commissionValue}
                                        onChange={(e) => setCommissionValue(e.target.value)}
                                        className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                                        autoFocus
                                        min="0"
                                        step="0.01"
                                      />
                                      <button
                                        onClick={handleCommissionSave}
                                        disabled={savingCommission}
                                        className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => setEditingCommission(null)}
                                        className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => handleCommissionEdit(role.name, planType, amount)}
                                      className="flex items-center justify-between cursor-pointer group"
                                    >
                                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                        ${amount.toFixed(0)}
                                      </span>
                                      <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingRole) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </h3>
              <button
                onClick={closeModals}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g., Senior Salesperson"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 outline-none"
                />
              </div>

              {!editingRole && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role ID (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="auto-generated from display name"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 outline-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Used internally. Will be lowercase with underscores.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What can users with this role do?"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Badge Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setFormData({ ...formData, color: color.name })}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        formData.color === color.name
                          ? 'ring-2 ring-offset-2 ring-pink-500 dark:ring-offset-gray-900'
                          : ''
                      } ${color.bg}`}
                    >
                      <div className={`w-4 h-4 rounded-full ${color.dot}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModals}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={editingRole ? handleUpdate : handleCreate}
                disabled={saving || !formData.display_name.trim()}
                className="flex-1 px-4 py-2.5 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : (editingRole ? 'Save Changes' : 'Create Role')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Role?</h3>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this role? Users with this role will need to be reassigned first.
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
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
