import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const AGENCIES = ['DEPED', 'BEYOND_DEPED', 'PENSION'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function MeterGauge({ value, max, label }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const color = pct >= 100 ? '#10b981' : pct >= 75 ? '#3b82f6' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-semibold">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>₱{Number(value).toLocaleString()}</span>
        <span>₱{Number(max).toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function Targets() {
  const { user } = useAuth();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAgency, setFilterAgency] = useState(user?.role === 'Admin' ? '' : (user?.agency || 'DEPED'));
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    region_product_group: '', agency: 'DEPED', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    target_amount: '', actual_lr_mtd: '', actual_lr_ytd: '', actual_lp: '', target_lp: '', lr_stretch_target: '',
    total_new_loan: '', total_reloan: '', target_new_money: '', actual_new_money: ''
  });

  const loadTargets = () => {
    const params = { month: filterMonth, year: filterYear };
    if (filterAgency) params.agency = filterAgency;
    api.get('/targets', { params }).then(r => setTargets(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadTargets(); }, [filterAgency, filterMonth, filterYear]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/targets', form);
      toast.success('Target saved!');
      setShowModal(false);
      loadTargets();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const chartData = targets.map(t => ({
    name: t.region_product_group,
    Target: t.target_amount,
    Actual: t.actual_lr_mtd,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Targets Tracking</h1>
          <p className="text-sm text-slate-500">{targets.length} records</p>
        </div>
        {['Admin','SH'].includes(user?.role) && (
          <button onClick={() => setShowModal(true)} className="btn-primary">+ Add/Update Target</button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {user?.role === 'Admin' && (
          <select className="input max-w-xs" value={filterAgency} onChange={e => setFilterAgency(e.target.value)}>
            <option value="">All Agencies</option>
            {AGENCIES.map(a => <option key={a}>{a}</option>)}
          </select>
        )}
        <select className="input w-32" value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <input type="number" className="input w-28" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} min={2020} max={2030} />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Target vs Actual LR (MTD)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `₱${(v/1000000).toFixed(1)}M`} width={70} />
              <Tooltip formatter={v => `₱${Number(v).toLocaleString()}`} />
              <Bar dataKey="Target" fill="#cbd5e1" radius={[4,4,0,0]} />
              <Bar dataKey="Actual" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gauge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {targets.map(t => (
          <div key={t.id} className="card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">{t.region_product_group}</div>
                <div className="text-xs text-slate-400">{t.agency} · {MONTHS[t.month-1]} {t.year}</div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>New: {t.total_new_loan}</div>
                <div>Reloan: {t.total_reloan}</div>
              </div>
            </div>
            <MeterGauge value={t.actual_lr_mtd} max={t.target_amount} label="LR MTD Attainment" />
            <MeterGauge value={t.actual_lr_ytd} max={t.target_amount * 9} label="LR YTD Attainment" />
            <MeterGauge value={t.actual_new_money} max={t.target_new_money} label="New Money Attainment" />
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-center text-xs">
              <div><div className="font-semibold text-slate-700">{t.mtd_attainment?.toFixed(1)}%</div><div className="text-slate-400">MTD Att.</div></div>
              <div><div className="font-semibold text-slate-700">{t.lp_attainment?.toFixed(1)}%</div><div className="text-slate-400">LP Att.</div></div>
              <div><div className="font-semibold text-slate-700">{t.stretch_attainment?.toFixed(1)}%</div><div className="text-slate-400">Stretch</div></div>
            </div>
          </div>
        ))}
        {!loading && targets.length === 0 && (
          <div className="col-span-2 text-center py-10 text-slate-400">No target data for this period.</div>
        )}
      </div>

      {/* Add/Update Target Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Add / Update Target</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="label">Region / Product Group *</label>
                <input className="input" placeholder="e.g. NCR NORTH" value={form.region_product_group}
                  onChange={e => setForm({...form, region_product_group: e.target.value})} required />
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
              <div className="grid grid-cols-2 gap-3">
                {[['Target Amount','target_amount'],['Actual LR MTD','actual_lr_mtd'],['Actual LR YTD','actual_lr_ytd'],['Actual LP','actual_lp'],['Target LP','target_lp'],['LR Stretch Target','lr_stretch_target'],['Total New Loan','total_new_loan'],['Total Reloan','total_reloan'],['Target New Money','target_new_money'],['Actual New Money','actual_new_money']].map(([label, key]) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input type="number" className="input" value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Save Target</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
