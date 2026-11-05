import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const PRIORITIES = ['P1', 'P2', 'P3'];
const TABLES = ['lcs14', 'lcs18_pd_npl', 'deped_reloan', 'deped_mob'];
const TABLE_LABELS = { lcs14: 'LCS 14', lcs18_pd_npl: 'LCS 18 / PD_NPL', deped_reloan: 'DepEd Reloan', deped_mob: 'DepEd MOB' };

export default function Assign() {
  const { user } = useAuth();
  const [saList, setSaList] = useState([]);
  const [selectedTable, setSelectedTable] = useState('lcs14');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [assignForm, setAssignForm] = useState({ sa_id: '', priority: 'P2' });

  useEffect(() => {
    api.get('/reports/sa-list').then(r => setSaList(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get(`/uploads/${selectedTable}`).then(r => setRecords(r.data)).catch(() => setRecords([])).finally(() => setLoading(false));
  }, [selectedTable]);

  const handleAssign = async () => {
    if (!assignForm.sa_id || !assignModal) return;
    // Find the record account_name as client_name
    const rec = assignModal;
    try {
      // Create a customer from the upload record, then assign
      // Derive agency from source table: deped_* → DEPED, lcs18_pd_npl → DEPED, lcs14 → DEPED
      const agencyMap = { lcs14: 'DEPED', lcs18_pd_npl: 'DEPED', deped_reloan: 'DEPED', deped_mob: 'DEPED' };
      const customerRes = await api.post('/customers', {
        loan_type: 'Reloan',
        agency: agencyMap[selectedTable] || 'DEPED',
        product: rec.product || rec.product_categ || '',
        client_name: rec.account_name,
        date_added: new Date().toISOString().slice(0,10),
        employee_number: rec.emp_num || rec.alt_id || '',
        mobile_number: rec.contact_no || '',
        loan_amount: rec.loan_amount || 0,
        source: selectedTable === 'lcs14' ? 'LCS14' : selectedTable === 'lcs18_pd_npl' ? 'PD_NPL' : selectedTable === 'deped_reloan' ? 'DepEd_Leads' : 'MOB',
      });
      // Now assign to SA
      await api.post(`/customers/${customerRes.data.id}/assign`, assignForm);
      toast.success(`Customer assigned to SA with ${assignForm.priority} priority. Loan type auto-tagged as Reloan.`);
      setAssignModal(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Assignment failed');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Assign Leads to SA</h1>
        <p className="text-sm text-slate-500">Distribute high-potential leads from uploaded master lists</p>
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <span className="text-xl">ℹ️</span>
          <div className="text-sm text-blue-800">
            <div className="font-semibold">Smart Tagging</div>
            <div>All customers assigned through this module will be automatically tagged as <strong>Reloan</strong>, eliminating manual data entry.</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <label className="label mb-0 min-w-fit">Source:</label>
        {TABLES.map(t => (
          <button key={t} onClick={() => setSelectedTable(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedTable === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-300'}`}>
            {TABLE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="table-head">
            <th className="px-4 py-3">Account Name</th>
            <th className="px-4 py-3">Branch Code</th>
            <th className="px-4 py-3">Account No.</th>
            <th className="px-4 py-3">Loan Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">MOB</th>
            <th className="px-4 py-3">Action</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading...</td></tr>
            : records.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-slate-400">No records. Upload a CSV file first.</td></tr>
            : records.slice(0, 100).map((r, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium">{r.account_name}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{r.branch_code}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{r.account_no}</td>
                <td className="px-4 py-2.5">₱{Number(r.loan_amount || 0).toLocaleString()}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{r.status || r.loanstatus || '—'}</td>
                <td className="px-4 py-2.5 text-xs">{r.mob || '—'}</td>
                <td className="px-4 py-2.5">
                  <button onClick={() => { setAssignModal(r); setAssignForm({ sa_id: '', priority: 'P2' }); }}
                    className="text-blue-600 hover:underline text-xs font-medium">Assign</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Assign Customer</h2>
              <button onClick={() => setAssignModal(null)} className="text-slate-400 text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg text-sm">
                <div className="font-semibold">{assignModal.account_name}</div>
                <div className="text-xs text-slate-500">{assignModal.branch_code} · ₱{Number(assignModal.loan_amount || 0).toLocaleString()}</div>
                <div className="text-xs text-green-600 mt-1 font-medium">🏷️ Will be auto-tagged as Reloan</div>
              </div>
              <div>
                <label className="label">Assign to SA *</label>
                <select className="input" value={assignForm.sa_id} onChange={e => setAssignForm({...assignForm, sa_id: e.target.value})} required>
                  <option value="">Select SA...</option>
                  {saList.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.employee_id})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={assignForm.priority} onChange={e => setAssignForm({...assignForm, priority: e.target.value})}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p} — {p==='P1'?'HIGH':p==='P2'?'MID':'LOW'}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleAssign} disabled={!assignForm.sa_id} className="btn-primary flex-1">Assign Customer</button>
                <button onClick={() => setAssignModal(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
