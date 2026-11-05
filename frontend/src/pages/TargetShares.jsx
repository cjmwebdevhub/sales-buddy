import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const AGENCIES = ['DEPED', 'BEYOND_DEPED', 'PENSION'];

export default function TargetShares() {
  const { user } = useAuth();
  const [shares, setShares] = useState([]);
  const [saList, setSaList] = useState([]);
  const [audit, setAudit] = useState([]);
  const [selectedSa, setSelectedSa] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [form, setForm] = useState({
    sa_id: '', agency: user?.agency || 'DEPED', month: new Date().getMonth() + 1,
    year: new Date().getFullYear(), target_amount: ''
  });

  const loadShares = () => {
    api.get('/targets/shares').then(r => setShares(r.data)).catch(console.error);
  };

  useEffect(() => {
    loadShares();
    api.get('/reports/sa-list').then(r => setSaList(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/targets/shares', form);
      toast.success('Target share saved!');
      setShowModal(false);
      loadShares();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const openAudit = (sa_id) => {
    setSelectedSa(sa_id);
    api.get(`/reports/target-audit/${sa_id}`).then(r => setAudit(r.data)).catch(() => setAudit([]));
    setShowAudit(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Target Shares</h1>
          <p className="text-sm text-slate-500">Assign and manage SA-level targets</p>
        </div>
        {['ASH','RSH','SH','Admin'].includes(user?.role) && (
          <button onClick={() => setShowModal(true)} className="btn-primary">+ Assign Target</button>
        )}
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="table-head">
            <th className="px-4 py-3">SA Name</th>
            <th className="px-4 py-3">Employee ID</th>
            <th className="px-4 py-3">Agency</th>
            <th className="px-4 py-3">Month/Year</th>
            <th className="px-4 py-3">Target Amount</th>
            <th className="px-4 py-3">Actual LR</th>
            <th className="px-4 py-3">Attainment</th>
            <th className="px-4 py-3">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {shares.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-slate-400">No target shares assigned yet.</td></tr>
            ) : shares.map(s => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-800">{s.full_name}</td>
                <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{s.employee_id}</td>
                <td className="px-4 py-2.5"><span className="badge bg-blue-50 text-blue-700">{s.agency}</span></td>
                <td className="px-4 py-2.5 text-slate-500">{MONTHS[s.month-1]} {s.year}</td>
                <td className="px-4 py-2.5 font-semibold">₱{Number(s.target_amount).toLocaleString()}</td>
                <td className="px-4 py-2.5 text-slate-600">₱{Number(s.actual_lr || 0).toLocaleString()}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, s.attainment || 0)}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{(s.attainment || 0).toFixed(1)}%</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <button onClick={() => openAudit(s.sa_id)} className="text-blue-600 hover:underline text-xs font-medium">Audit Trail</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assign Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Assign Target Share</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="label">Sales Associate *</label>
                <select className="input" value={form.sa_id} onChange={e => setForm({...form, sa_id: e.target.value})} required>
                  <option value="">Select SA...</option>
                  {saList.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.employee_id})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Agency</label>
                  <select className="input" value={form.agency} onChange={e => setForm({...form, agency: e.target.value})}>
                    {AGENCIES.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Month</label>
                  <select className="input" value={form.month} onChange={e => setForm({...form, month: Number(e.target.value)})}>
                    {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Year</label>
                  <input type="number" className="input" value={form.year} onChange={e => setForm({...form, year: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="label">Target Amount (₱) *</label>
                <input type="number" className="input" value={form.target_amount} onChange={e => setForm({...form, target_amount: e.target.value})} required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Save & Notify</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Trail Modal */}
      {showAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Audit Trail</h2>
              <button onClick={() => setShowAudit(false)} className="text-slate-400 text-2xl">&times;</button>
            </div>
            <div className="p-5">
              {audit.length === 0 ? (
                <p className="text-slate-400 text-sm">No audit history.</p>
              ) : (
                <div className="space-y-2">
                  {audit.map(a => (
                    <div key={a.id} className="p-3 bg-slate-50 rounded-lg text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{a.changed_by_name}</span>
                        <span className="text-xs text-slate-400">{a.changed_at?.slice(0,16)}</span>
                      </div>
                      <div className="text-slate-500 text-xs mt-1">
                        ₱{Number(a.old_target).toLocaleString()} → ₱{Number(a.new_target).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
