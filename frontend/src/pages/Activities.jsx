import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const LOAN_STATUSES = ['For Application', 'Not Interested', 'Pending Approval', 'Released'];
const ACTIVITY_TYPES = ['Call', 'Message', 'Email', 'Online Meeting', 'Event', 'Visit'];
const ACTIVITY_STATUSES = ['Call Again', 'Pending', 'Done'];

export default function Activities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [editActivity, setEditActivity] = useState(null);
  const [form, setForm] = useState({
    customer_id: '', loan_status: 'For Application', activity_type: 'Visit',
    activity_status: 'Pending', disbursal_date: '', duration: '', address: '', sales_notes: ''
  });

  const loadActivities = () => {
    const params = {};
    if (filterStatus) params.status = filterStatus;
    api.get('/activities', { params }).then(r => setActivities(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadActivities(); }, [filterStatus]);
  useEffect(() => { api.get('/customers').then(r => setCustomers(r.data)).catch(() => {}); }, []);

  const openNew = () => { setEditActivity(null); setForm({ customer_id: '', loan_status: 'For Application', activity_type: 'Visit', activity_status: 'Pending', disbursal_date: '', duration: '', address: '', sales_notes: '' }); setShowModal(true); };
  const openEdit = (a) => { setEditActivity(a); setForm({ customer_id: a.customer_id || '', loan_status: a.loan_status, activity_type: a.activity_type, activity_status: a.activity_status, disbursal_date: a.disbursal_date || '', duration: a.duration || '', address: a.address || '', sales_notes: a.sales_notes || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editActivity) {
        await api.put(`/activities/${editActivity.id}`, form);
        toast.success('Activity updated!');
      } else {
        await api.post('/activities', form);
        toast.success('Activity created!');
      }
      setShowModal(false);
      loadActivities();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await api.delete(`/activities/${id}`);
      toast.success('Deleted');
      loadActivities();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Activities</h1>
          <p className="text-sm text-slate-500">{activities.length} activities</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ Add Activity</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="input max-w-xs" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {ACTIVITY_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="table-head">
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Loan Status</th>
            <th className="px-4 py-3">Activity Status</th>
            <th className="px-4 py-3">Duration</th>
            <th className="px-4 py-3">Notes</th>
            <th className="px-4 py-3">SA</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={10} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : activities.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-10 text-slate-400">No activities found</td></tr>
            ) : activities.map(a => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{a.activity_id}</td>
                <td className="px-4 py-2.5 font-medium">{a.client_name || a.customer_name}</td>
                <td className="px-4 py-2.5 text-slate-600">{a.activity_type}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{a.loan_status}</td>
                <td className="px-4 py-2.5">
                  <span className={a.activity_status === 'Done' ? 'status-done' : a.activity_status === 'Pending' ? 'status-pending' : 'status-call-again'}>
                    {a.activity_status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-400">{a.duration}</td>
                <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate text-xs">{a.sales_notes}</td>
                <td className="px-4 py-2.5 text-slate-400 text-xs">{a.sa_name}</td>
                <td className="px-4 py-2.5 text-slate-400 text-xs">{a.created_at?.slice(0,10)}</td>
                <td className="px-4 py-2.5 flex gap-2">
                  <button onClick={() => openEdit(a)} className="text-blue-600 hover:underline text-xs font-medium">Edit</button>
                  {user?.role === 'SA' && <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:underline text-xs font-medium">Del</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Activity Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{editActivity ? 'Edit Activity' : 'New Activity'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              {!editActivity && (
                <div>
                  <label className="label">Customer *</label>
                  <select className="input" value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})} required>
                    <option value="">Select customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.client_name} ({c.customer_id})</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Activity Type *</label>
                  <select className="input" value={form.activity_type} onChange={e => setForm({...form, activity_type: e.target.value})}>
                    {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Activity Status *</label>
                  <select className="input" value={form.activity_status} onChange={e => setForm({...form, activity_status: e.target.value})}>
                    {ACTIVITY_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Loan Status *</label>
                <select className="input" value={form.loan_status} onChange={e => setForm({...form, loan_status: e.target.value})}>
                  {LOAN_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              {form.loan_status === 'Released' && (
                <div>
                  <label className="label">Disbursal Date</label>
                  <input type="date" className="input" value={form.disbursal_date}
                    onChange={e => setForm({...form, disbursal_date: e.target.value})} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Duration</label>
                  <input className="input" placeholder="30 mins" value={form.duration}
                    onChange={e => setForm({...form, duration: e.target.value})} />
                </div>
                <div>
                  <label className="label">Address</label>
                  <input className="input" placeholder="City, Province" value={form.address}
                    onChange={e => setForm({...form, address: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">Sales Notes</label>
                <textarea className="input" rows={3} value={form.sales_notes}
                  onChange={e => setForm({...form, sales_notes: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{editActivity ? 'Update' : 'Save'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
