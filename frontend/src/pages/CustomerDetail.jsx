import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const LOAN_STATUSES = ['For Application', 'Not Interested', 'Pending Approval', 'Released'];
const ACTIVITY_TYPES = ['Call', 'Message', 'Email', 'Online Meeting', 'Event', 'Visit'];
const ACTIVITY_STATUSES = ['Call Again', 'Pending', 'Done'];

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showActModal, setShowActModal] = useState(false);
  const [actForm, setActForm] = useState({
    loan_status: 'For Application', activity_type: 'Visit', activity_status: 'Pending',
    disbursal_date: '', duration: '', address: '', sales_notes: ''
  });

  const loadCustomer = () => {
    api.get(`/customers/${id}`).then(r => setCustomer(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadCustomer(); }, [id]);

  const handleAddActivity = async (e) => {
    e.preventDefault();
    try {
      await api.post('/activities', { ...actForm, customer_id: customer.id, customer_name: customer.client_name, loan_type: customer.loan_type });
      toast.success('Activity saved!');
      setShowActModal(false);
      loadCustomer();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save activity');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;
  if (!customer) return <div className="text-center py-10 text-slate-400">Customer not found</div>;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/customers')} className="text-blue-600 hover:underline text-sm">← Customers</button>
        <span className="text-slate-400">/</span>
        <span className="text-sm text-slate-600">{customer.client_name}</span>
      </div>

      {/* Customer Info Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{customer.client_name}</h1>
            <p className="text-sm text-slate-500 font-mono">{customer.customer_id}</p>
          </div>
          <div className="flex gap-2">
            {customer.priority && (
              <span className={`priority-${customer.priority?.toLowerCase()}`}>{customer.priority}</span>
            )}
            <span className="badge bg-blue-100 text-blue-700">{customer.agency}</span>
            <span className="badge bg-slate-100 text-slate-600">{customer.loan_type}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {[
            ['Product', customer.product],
            ['Loan Amount', `₱${Number(customer.loan_amount||0).toLocaleString()}`],
            ['Branch', customer.branch_name],
            ['Region', customer.region_name],
            ['School', customer.school || '—'],
            ['Location', customer.location || '—'],
            ['Employee No.', customer.employee_number || '—'],
            ['Mobile', customer.mobile_number || '—'],
            ['Email', customer.customer_email || '—'],
            ['Date Added', customer.date_added],
            ['Source', customer.source],
            ['Assigned SA', customer.sa_name || '—'],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">{k}</div>
              <div className="font-medium text-slate-700">{v}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
          {customer.mobile_number && <a href={`tel:${customer.mobile_number}`} className="btn-secondary flex items-center gap-1.5">📞 Call</a>}
          {customer.customer_email && <a href={`mailto:${customer.customer_email}`} className="btn-secondary flex items-center gap-1.5">✉️ Email</a>}
          <button onClick={() => setShowActModal(true)} className="btn-primary flex items-center gap-1.5">+ Add Activity</button>
        </div>
      </div>

      {/* Activities */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-700">Related Activities ({customer.activities?.length || 0})</h2>
          <button onClick={() => setShowActModal(true)} className="btn-secondary text-xs">+ Add</button>
        </div>
        {customer.activities?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="table-head">
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Loan Status</th>
                <th className="px-3 py-2">Activity Status</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">Notes</th>
                <th className="px-3 py-2">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {customer.activities.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">{a.activity_id}</td>
                    <td className="px-3 py-2">{a.activity_type}</td>
                    <td className="px-3 py-2 text-slate-500">{a.loan_status}</td>
                    <td className="px-3 py-2">
                      <span className={a.activity_status === 'Done' ? 'status-done' : a.activity_status === 'Pending' ? 'status-pending' : 'status-call-again'}>
                        {a.activity_status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400">{a.duration}</td>
                    <td className="px-3 py-2 text-slate-500 max-w-xs truncate">{a.sales_notes}</td>
                    <td className="px-3 py-2 text-slate-400 text-xs">{a.created_at?.slice(0,10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-slate-400">No activities yet. Add the first one!</p>}
      </div>

      {/* Activity Modal */}
      {showActModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Add Activity</h2>
              <button onClick={() => setShowActModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleAddActivity} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Activity Type *</label>
                  <select className="input" value={actForm.activity_type} onChange={e => setActForm({...actForm, activity_type: e.target.value})}>
                    {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Activity Status *</label>
                  <select className="input" value={actForm.activity_status} onChange={e => setActForm({...actForm, activity_status: e.target.value})}>
                    {ACTIVITY_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Loan Status *</label>
                <select className="input" value={actForm.loan_status} onChange={e => setActForm({...actForm, loan_status: e.target.value})}>
                  {LOAN_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              {actForm.loan_status === 'Released' && (
                <div>
                  <label className="label">Disbursal Date</label>
                  <input type="date" className="input" value={actForm.disbursal_date}
                    onChange={e => setActForm({...actForm, disbursal_date: e.target.value})} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Duration</label>
                  <input className="input" placeholder="30 mins" value={actForm.duration}
                    onChange={e => setActForm({...actForm, duration: e.target.value})} />
                </div>
                <div>
                  <label className="label">Address</label>
                  <input className="input" placeholder="City, Province" value={actForm.address}
                    onChange={e => setActForm({...actForm, address: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">Sales Notes</label>
                <textarea className="input" rows={3} placeholder="What happened during this activity..." value={actForm.sales_notes}
                  onChange={e => setActForm({...actForm, sales_notes: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Save Activity</button>
                <button type="button" onClick={() => setShowActModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
