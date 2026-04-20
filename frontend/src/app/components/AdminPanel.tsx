import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, ShieldCheck, ShieldOff, Users, MessageSquare, FileDown } from 'lucide-react';

interface AdminPanelProps {
  userId: string;
  onClose: () => void;
  apiUrl: string;
}

interface UserDoc {
  _id: string;
  email: string;
  name?: string;
  role: string;
  created_at: string;
}

interface Stats {
  total_users: number;
  total_sessions: number;
  total_exports: number;
}

export default function AdminPanel({ userId, onClose, apiUrl }: AdminPanelProps) {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const headers = { 'Content-Type': 'application/json', 'x-user-id': userId };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(`${apiUrl}/admin/users`, { headers }),
        fetch(`${apiUrl}/admin/stats`, { headers }),
      ]);
      if (!usersRes.ok || !statsRes.ok) {
        setError('Failed to load admin data');
        setLoading(false);
        return;
      }
      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      setUsers(usersData.users);
      setStats(statsData);
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (targetId: string, email: string) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${apiUrl}/admin/users/${targetId}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Delete failed');
        return;
      }
      setUsers(prev => prev.filter(u => u._id !== targetId));
      if (stats) setStats({ ...stats, total_users: stats.total_users - 1 });
    } catch {
      setError('Could not connect to server');
    }
  };

  const handleToggleRole = async (targetId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch(`${apiUrl}/admin/users/${targetId}/role`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Role change failed');
        return;
      }
      setUsers(prev => prev.map(u => u._id === targetId ? { ...u, role: newRole } : u));
    } catch {
      setError('Could not connect to server');
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-[#662d3a] text-white px-6 py-4 flex items-center gap-4">
        <button onClick={onClose} className="hover:bg-white/10 p-2 rounded transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Comfortaa' }}>Admin Panel</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#662d3a]/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-[#662d3a]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#662d3a]">{stats.total_users}</p>
                <p className="text-xs text-gray-500">Total Users</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#662d3a]/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#662d3a]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#662d3a]">{stats.total_sessions}</p>
                <p className="text-xs text-gray-500">Chat Sessions</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#662d3a]/10 rounded-lg flex items-center justify-center">
                <FileDown className="w-5 h-5 text-[#662d3a]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#662d3a]">{stats.total_exports}</p>
                <p className="text-xs text-gray-500">Exports</p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-[#662d3a]">Users</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{user.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user._id !== userId && (
                            <>
                              <button
                                onClick={() => handleToggleRole(user._id, user.role)}
                                title={user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                              >
                                {user.role === 'admin' ? (
                                  <ShieldOff className="w-4 h-4 text-orange-500" />
                                ) : (
                                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(user._id, user.email)}
                                title="Delete user"
                                className="p-1.5 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </>
                          )}
                          {user._id === userId && (
                            <span className="text-xs text-gray-400">You</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
