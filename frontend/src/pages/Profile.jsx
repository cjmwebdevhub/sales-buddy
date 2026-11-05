import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ full_name: '', reports_to: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ full_name: user.full_name, reports_to: user.reports_to || '' });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/users/me', form);
      await refreshUser();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const roleColors = { SA: 'bg-green-100 text-green-700', ASH: 'bg-blue-100 text-blue-700', RSH: 'bg-purple-100 text-purple-700', SH: 'bg-orange-100 text-orange-700', Admin: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>

      <div className="card">
        <div className="flex items-center gap-5 mb-6 pb-5 border-b border-slate-100">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{user?.full_name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="flex gap-2 mt-2">
              <span className={`badge ${roleColors[user?.role] || 'bg-gray-100'}`}>{user?.role}</span>
              <span className="badge bg-slate-100 text-slate-600">{user?.agency}</span>
            </div>
          </div>
        </div>

        {/* Read-only info */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {[
            ['Employee ID', user?.employee_id],
            ['Email', user?.email],
            ['Branch', user?.branch_name],
            ['Branch Code', user?.branch_code],
            ['Region', user?.region_name],
            ['Joined', user?.created_at?.slice(0,10)],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">{k}</div>
              <div className="text-sm font-medium text-slate-700">{v || '—'}</div>
            </div>
          ))}
        </div>

        {/* Editable fields */}
        <form onSubmit={handleSave} className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Edit Details</h3>
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
          </div>
          <div>
            <label className="label">Reporting To (Email)</label>
            <input className="input" value={form.reports_to} onChange={e => setForm({...form, reports_to: e.target.value})} placeholder="supervisor@csb.com" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div className="mt-5 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
          <strong>⚠️ Important:</strong> If you need to correct critical details such as your Employee ID, email, or role, please contact your Area Sales Head (ASH). Your ASH will coordinate with the System Admin.
        </div>
      </div>
    </div>
  );
}
