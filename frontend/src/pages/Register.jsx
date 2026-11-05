import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const ROLES = ['SA', 'ASH', 'RSH', 'SH', 'Admin'];
const AGENCIES = ['DEPED', 'BEYOND_DEPED', 'PENSION'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', employee_id: '',
    role: 'SA', agency: 'DEPED', region_name: '', branch_code: '', branch_name: '', reports_to: ''
  });

  useEffect(() => {
    api.get('/reports/branches').then(r => setBranches(r.data)).catch(() => {});
  }, []);

  const regions = [...new Set(branches.map(b => b.region_name))];
  const filteredBranches = branches.filter(b => b.region_name === form.region_name);

  const handleRegionChange = (e) => {
    const region = e.target.value;
    setForm({...form, region_name: region, branch_code: '', branch_name: ''});
  };

  const handleBranchCodeChange = (e) => {
    const code = e.target.value;
    const b = branches.find(x => x.branch_code === code);
    setForm({...form, branch_code: code, branch_name: b?.branch_name || ''});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">💼</div>
          <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
          <p className="text-slate-500 text-sm">Sales Buddy 3.0 Registration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" placeholder="First Middle Last" value={form.full_name}
                onChange={e => setForm({...form, full_name: e.target.value})} required />
            </div>
            <div>
              <label className="label">Employee ID *</label>
              <input className="input" placeholder="EMP-001" value={form.employee_id}
                onChange={e => setForm({...form, employee_id: e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="label">CSB Email *</label>
            <input type="email" className="input" placeholder="you@csb.com" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div>
            <label className="label">Password *</label>
            <input type="password" className="input" placeholder="Min 6 characters" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role *</label>
              <select className="input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Agency *</label>
              <select className="input" value={form.agency} onChange={e => setForm({...form, agency: e.target.value})}
                disabled={form.role === 'Admin'}>
                {AGENCIES.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Region Name *</label>
            <select className="input" value={form.region_name} onChange={handleRegionChange} required>
              <option value="">Select region...</option>
              {regions.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Branch Code</label>
              <select className="input" value={form.branch_code} onChange={handleBranchCodeChange}>
                <option value="">Select branch...</option>
                {filteredBranches.map(b => <option key={b.branch_code} value={b.branch_code}>{b.branch_code}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Branch Name</label>
              <input className="input bg-slate-50" value={form.branch_name} readOnly />
            </div>
          </div>
          <div>
            <label className="label">Reporting To (email)</label>
            <input className="input" placeholder="supervisor@csb.com" value={form.reports_to}
              onChange={e => setForm({...form, reports_to: e.target.value})} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-base mt-2">
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already registered?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
