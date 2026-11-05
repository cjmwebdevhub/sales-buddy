import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const LOAN_TYPES = ['New Loan', 'Reloan'];
const DEPED_PRODUCTS = ['01.01 DEPED', '01.02 DEPED CALAMITY', '02 NEWLY HIRED TEACHERS', '03 DEPED SPECIAL'];
const BEYOND_PRODUCTS = ['SUC', 'LGU', 'GOCCs', 'Other Government'];
const PENSION_PRODUCTS = ['Pension', 'GSIS', 'SSS', 'AFP'];

function ProductOptions({ agency }) {
  const opts = agency === 'DEPED' ? DEPED_PRODUCTS : agency === 'BEYOND_DEPED' ? BEYOND_PRODUCTS : PENSION_PRODUCTS;
  return opts.map(p => <option key={p} value={p}>{p}</option>);
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function Customers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLoan, setFilterLoan] = useState('');
  const [form, setForm] = useState({
    loan_type: 'New Loan', agency: user?.agency || 'DEPED', product: '', promo_id: '',
    client_name: '', date_added: new Date().toISOString().slice(0,10),
    school: '', location: '', employee_number: '', mobile_number: '', customer_email: '', loan_amount: ''
  });

  const loadCustomers = () => {
    const params = {};
    if (filterLoan) params.loan_type = filterLoan;
    api.get('/customers', { params }).then(r => setCustomers(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadCustomers(); }, [filterLoan]);
  useEffect(() => {
    api.get('/promos', { params: { active_only: 'true', agency: form.agency } }).then(r => setPromos(r.data)).catch(() => {});
  }, [form.agency]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', form);
      toast.success('Customer registered!');
      setShowModal(false);
      setForm({ ...form, client_name: '', school: '', location: '', employee_number: '', mobile_number: '', customer_email: '', loan_amount: '' });
      loadCustomers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to register customer');
    }
  };

  const filtered = customers.filter(c =>
    c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.customer_id?.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile_number?.includes(search)
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{customers.length} total customers</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <span className="text-lg">+</span> Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search name, ID, mobile..." value={search}
          onChange={e => setSearch(e.target.value)} />
        <select className="input max-w-xs" value={filterLoan} onChange={e => setFilterLoan(e.target.value)}>
          <option value="">All Loan Types</option>
          {LOAN_TYPES.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-head">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Client Name</th>
              <th className="px-4 py-3">Agency</th>
              <th className="px-4 py-3">Loan Type</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={11} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={11} className="text-center py-10 text-slate-400">No customers found</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{c.customer_id}</td>
                <td className="px-4 py-2.5 font-medium text-slate-800">{c.client_name}</td>
                <td className="px-4 py-2.5">
                  <span className="badge bg-blue-50 text-blue-700">{c.agency}</span>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{c.loan_type}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{c.product}</td>
                <td className="px-4 py-2.5 text-slate-700">₱{Number(c.loan_amount || 0).toLocaleString()}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{c.branch_name}</td>
                <td className="px-4 py-2.5">
                  <span className={`badge ${c.source === 'Manual' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>{c.source}</span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    {c.mobile_number && <a href={`tel:${c.mobile_number}`} title="Call" className="text-blue-500 hover:text-blue-700 text-lg">📞</a>}
                    {c.customer_email && <a href={`mailto:${c.customer_email}`} title="Email" className="text-green-500 hover:text-green-700 text-lg">✉️</a>}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-400 text-xs">{c.date_added}</td>
                <td className="px-4 py-2.5">
                  <button onClick={() => navigate(`/customers/${c.id}`)} className="text-blue-600 hover:underline text-xs font-medium">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Register New Customer">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Loan Type *</label>
              <select className="input" value={form.loan_type} onChange={e => setForm({...form, loan_type: e.target.value})}>
                {LOAN_TYPES.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Agency</label>
              <input className="input bg-slate-50" value={form.agency} readOnly />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Product</label>
              <select className="input" value={form.product} onChange={e => setForm({...form, product: e.target.value})}>
                <option value="">Select product</option>
                <ProductOptions agency={form.agency} />
              </select>
            </div>
            <div>
              <label className="label">Promo</label>
              <select className="input" value={form.promo_id} onChange={e => setForm({...form, promo_id: e.target.value})}>
                <option value="">No promo</option>
                {promos.map(p => <option key={p.id} value={p.id}>{p.promo_name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Client Full Name *</label>
            <input className="input" placeholder="First Middle Last" value={form.client_name}
              onChange={e => setForm({...form, client_name: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date Added *</label>
              <input type="date" className="input" value={form.date_added}
                onChange={e => setForm({...form, date_added: e.target.value})} required />
            </div>
            <div>
              <label className="label">Employee Number</label>
              <input className="input" placeholder="EMP-001" value={form.employee_number}
                onChange={e => setForm({...form, employee_number: e.target.value})} />
            </div>
          </div>
          {(form.agency === 'DEPED') && (
            <div>
              <label className="label">School Name</label>
              <input className="input" placeholder="School name" value={form.school}
                onChange={e => setForm({...form, school: e.target.value})} />
            </div>
          )}
          <div>
            <label className="label">Location</label>
            <input className="input" placeholder="City, Province" value={form.location}
              onChange={e => setForm({...form, location: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Mobile Number</label>
              <input className="input" placeholder="09XX-XXX-XXXX" value={form.mobile_number}
                onChange={e => setForm({...form, mobile_number: e.target.value})} />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input type="email" className="input" placeholder="client@email.com" value={form.customer_email}
                onChange={e => setForm({...form, customer_email: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="label">Loan Amount (₱)</label>
            <input type="number" className="input" placeholder="150000" value={form.loan_amount}
              onChange={e => setForm({...form, loan_amount: e.target.value})} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Save Customer</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
