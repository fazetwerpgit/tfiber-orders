'use client';

import { useEffect, useState } from 'react';
import { Users, Search, UserPlus, X, Plus, Trash2 } from 'lucide-react';
import {
  getTeams,
  getAllUsersWithTeams,
  assignUserToTeam,
  createTeam,
  deleteTeam,
} from '@/actions/teams';
import type { Team } from '@/lib/types';

interface UserWithTeam {
  id: string;
  name: string;
  email: string;
  team_id: string | null;
  team_name: string | null;
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserWithTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [saving, setSaving] = useState<string | null>(null);

  // Create team modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#E20074');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [teamsResult, usersResult] = await Promise.all([
      getTeams(),
      getAllUsersWithTeams(),
    ]);

    if (teamsResult.success && teamsResult.data) {
      setTeams(teamsResult.data);
    }

    if (usersResult.success && usersResult.data) {
      setUsers(usersResult.data);
    }

    setLoading(false);
  };

  const handleAssignTeam = async (userId: string, teamId: string | null) => {
    setSaving(userId);
    const result = await assignUserToTeam(userId, teamId);

    if (result.success) {
      // Update local state
      setUsers(
        users.map((u) =>
          u.id === userId
            ? {
                ...u,
                team_id: teamId,
                team_name: teamId
                  ? teams.find((t) => t.id === teamId)?.display_name || null
                  : null,
              }
            : u
        )
      );
    } else {
      alert(result.error || 'Failed to assign team');
    }

    setSaving(null);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    setCreating(true);
    const result = await createTeam({
      name: newTeamName.toLowerCase().replace(/\s+/g, '_'),
      display_name: newTeamName,
      description: null,
      color: newTeamColor,
      icon: null,
      is_active: true,
      created_by: null,
    });

    if (result.success && result.data) {
      setTeams([...teams, result.data]);
      setShowCreateModal(false);
      setNewTeamName('');
    } else {
      alert(result.error || 'Failed to create team');
    }
    setCreating(false);
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? All members will be removed.')) {
      return;
    }

    const result = await deleteTeam(teamId);

    if (result.success) {
      setTeams(teams.filter((t) => t.id !== teamId));
      // Clear team from users
      setUsers(
        users.map((u) =>
          u.team_id === teamId ? { ...u, team_id: null, team_name: null } : u
        )
      );
    } else {
      alert(result.error || 'Failed to delete team');
    }
  };

  const filteredUsers = users.filter((user) => {
    // Filter by team
    if (selectedTeamFilter === 'unassigned' && user.team_id !== null) return false;
    if (selectedTeamFilter !== 'all' && selectedTeamFilter !== 'unassigned' && user.team_id !== selectedTeamFilter)
      return false;

    // Filter by search
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const teamCounts = teams.reduce<Record<string, number>>((acc, team) => {
    acc[team.id] = users.filter((u) => u.team_id === team.id).length;
    return acc;
  }, {});

  const unassignedCount = users.filter((u) => u.team_id === null).length;

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Loading teams...
      </div>
    );
  }

  return (
    <main className="p-4 space-y-4">
      {/* Teams Overview */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Teams</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Team
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="relative p-3 rounded-lg border-2 transition-all"
              style={{
                borderColor: team.color,
                backgroundColor: `${team.color}10`,
              }}
            >
              <button
                onClick={() => handleDeleteTeam(team.id)}
                className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${team.color}30` }}
                >
                  {team.icon || '👥'}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {team.display_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {teamCounts[team.id] || 0} members
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
          />
        </div>
        <select
          value={selectedTeamFilter}
          onChange={(e) => setSelectedTeamFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm"
        >
          <option value="all">All Users</option>
          <option value="unassigned">Unassigned ({unassignedCount})</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.display_name} ({teamCounts[team.id] || 0})
            </option>
          ))}
        </select>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Assign Users to Teams
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Select a team for each user to enable team battles
          </p>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No users found
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={user.team_id || ''}
                    onChange={(e) =>
                      handleAssignTeam(user.id, e.target.value || null)
                    }
                    disabled={saving === user.id}
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm disabled:opacity-50"
                  >
                    <option value="">No Team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.display_name}
                      </option>
                    ))}
                  </select>
                  {saving === user.id && (
                    <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Create New Team
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Alpha Squad"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Team Color
                </label>
                <div className="flex gap-2">
                  {['#E20074', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'].map(
                    (color) => (
                      <button
                        key={color}
                        onClick={() => setNewTeamColor(color)}
                        className="w-8 h-8 rounded-full border-2 transition-all"
                        style={{
                          backgroundColor: color,
                          borderColor:
                            newTeamColor === color ? 'white' : 'transparent',
                          boxShadow:
                            newTeamColor === color
                              ? `0 0 0 2px ${color}`
                              : 'none',
                        }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={creating || !newTeamName.trim()}
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
