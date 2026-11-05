import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DailyLR() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  useEffect(() => {
    const params = {};
    if (filterMonth) params.month = filterMonth;
    if (filterYear) params.year = filterYear;
    api.get('/reports/daily-lr', { params }).then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [filterMonth, filterYear]);

  const totalLR = data.reduce((sum, d) => sum + (d.total_lr || 0), 0);
  const totalCount = data.reduce((sum, d) => sum + (d.count || 0), 0);

  const chartData = [...new Map(data.map(d => [d.disbursal_date, {
    date: d.disbursal_date,
    amount: data.filter(x => x.disbursal_date === d.disbursal_date).reduce((s, x) => s + x.total_lr, 0)
  }])).values()].slice(0, 30);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Daily Loan Releases</h1>
        <p className="text-sm text-slate-500">Disbursement records and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="text-3xl">💰</div>
          <div>
            <div className="text-2xl font-bold text-slate-800">₱{(totalLR/1000000).toFixed(2)}M</div>
            <div className="text-sm text-slate-500">Total LR Amount</div>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="text-3xl">📊</div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{totalCount}</div>
            <div className="text-sm text-slate-500">Total Disbursements</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="input max-w-xs" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <input type="number" className="input w-28" placeholder="Year" value={filterYear} onChange={e => setFilterYear(e.target.value)} />
      </div>

      {chartData.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Daily LR Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} width={70} />
              <Tooltip formatter={v => `₱${Number(v).toLocaleString()}`} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="table-head">
            <th className="px-4 py-3">Disbursal Date</th>
            <th className="px-4 py-3">Branch</th>
            <th className="px-4 py-3">Region</th>
            <th className="px-4 py-3">Count</th>
            <th className="px-4 py-3">Total LR</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-slate-400">No data found</td></tr>
            ) : data.map((d, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono text-xs">{d.disbursal_date}</td>
                <td className="px-4 py-2.5">{d.branch_name}</td>
                <td className="px-4 py-2.5 text-slate-500">{d.region}</td>
                <td className="px-4 py-2.5 text-center">{d.count}</td>
                <td className="px-4 py-2.5 font-semibold text-blue-700">₱{Number(d.total_lr).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
