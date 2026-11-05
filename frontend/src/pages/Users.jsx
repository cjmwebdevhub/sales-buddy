import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const ROLES = ['SA', 'ASH', 'RSH', 'SH', 'Admin'];
const AGENCIES = ['DEPED', 'BEYOND_DEPED', 'PENSION', 'ALL'];

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [search, setSearch] = useState('');

  const loadUsers = () => {
    api.get('/users').then(r => setUsers(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ full_name: u.full_name, role: u.role, agency: u.agency, region_name: u.region_name, branch_code: u.branch_code, branch_name: u.branch_name, reports_to: u.reports_to || '' });
  };

  const handleSave = async () => {
    try {
      await api.put(`/users/${editUser.id}`, editForm);
      toast.success('User updated!');
      setEditUser(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      loadUsers();
    } catch { toast.error('Delete failed'); }
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.employee_id?.toLowerCase().includes(search.toLowerCase())
  );

  const roleColors = { SA: 'bg-green-100 text-green-700', ASH: 'bg-blue-100 text-blue-700', RSH: 'bg-purple-100 text-purple-700', SH: 'bg-orange-100 text-orange-700', Admin: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Users</h1>
          <p className="text-sm text-slate-500">{users.length} registered users</p>
        </div>
      </div>

      <input className="input max-w-xs" placeholder="Search name, email, ID..." value={search}
        onChange={e => setSearch(e.target.value)} />

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="table-head">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Employee ID</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Agency</th>
            <th className="px-4 py-3">Branch</th>
            <th className="px-4 py-3">Region</th>
            <th className="px-4 py-3">Reports To</th>
            {user?.role === 'Admin' && <th className="px-4 py-3">Actions</th>}
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={9} className="text-center py-10 text-slate-400">Loading...</td></tr>
            : filtered.length === 0 ? <tr><td colSpan={9} className="text-center py-10 text-slate-400">No users found</td></tr>
            : filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-800">{u.full_name}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{u.email}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{u.employee_id}</td>
                <td className="px-4 py-2.5"><span className={`badge ${roleColors[u.role] || 'bg-gray-100'}`}>{u.role}</span></td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{u.agency}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{u.branch_name}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{u.region_name}</td>
                <td className="px-4 py-2.5 text-slate-400 text-xs">{u.reports_to || '—'}</td>
                {user?.role === 'Admin' && (
                  <td className="px-4 py-2.5 flex gap-2">
                    <button onClick={() => openEdit(u)} className="text-blue-600 hover:underline text-xs font-medium">Edit</button>
                    <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:underline text-xs font-medium">Del</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Edit User: {editUser.full_name}</h2>
              <button onClick={() => setEditUser(null)} className="text-slate-400 text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Role</label>
                  <select className="input" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Agency</label>
                  <select className="input" value={editForm.agency} onChange={e => setEditForm({...editForm, agency: e.target.value})}>
                    {AGENCIES.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Reports To</label>
                <input className="input" value={editForm.reports_to} onChange={e => setEditForm({...editForm, reports_to: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} className="btn-primary flex-1">Save Changes</button>
                <button onClick={() => setEditUser(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
