import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'];

function StatCard({ icon, label, value, sub, color = 'blue' }) {
  const colors = { blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600', yellow: 'bg-yellow-50 text-yellow-600', purple: 'bg-purple-50 text-purple-600' };
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color]}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="text-sm font-medium text-slate-600">{label}</div>
        {sub && <div className="text-xs text-slate-400">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading dashboard...</div>;

  const actStats = data?.activity_stats || [];
  const custStats = data?.customer_stats || [];

  const doneCount = actStats.find(a => a.activity_status === 'Done')?.count || 0;
  const pendingCount = actStats.find(a => a.activity_status === 'Pending')?.count || 0;
  const callAgainCount = actStats.find(a => a.activity_status === 'Call Again')?.count || 0;
  const totalAct = doneCount + pendingCount + callAgainCount;

  const newLoan = custStats.find(c => c.loan_type === 'New Loan')?.count || 0;
  const reloan = custStats.find(c => c.loan_type === 'Reloan')?.count || 0;

  const pieData = actStats.map(a => ({ name: a.activity_status, value: a.count }));
  const barData = [
    { name: 'New Loan', count: newLoan },
    { name: 'Reloan', count: reloan },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome, {user?.full_name?.split(' ')[0]}! 👋</h1>
        <p className="text-slate-500 text-sm mt-1">{user?.role} · {user?.agency} · {user?.region_name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Total Customers" value={data?.total_customers || 0} color="blue" />
        <StatCard icon="✅" label="Activities Done" value={doneCount} sub={`of ${totalAct} total`} color="green" />
        <StatCard icon="⏳" label="Pending Activities" value={pendingCount} color="yellow" />
        <StatCard icon="💰" label="Total LR Amount" value={`₱${((data?.lr_total || 0)/1000000).toFixed(2)}M`} color="purple" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Activity Status</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No activity data</div>}
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Customer by Loan Type</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-700">Recent Activities</h2>
          <button onClick={() => navigate('/activities')} className="text-sm text-blue-600 hover:underline">View all →</button>
        </div>
        {data?.recent_activities?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="table-head">
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Loan Status</th>
                <th className="px-3 py-2">Activity Status</th>
                <th className="px-3 py-2">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent_activities.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium">{a.client_name || a.customer_name}</td>
                    <td className="px-3 py-2 text-slate-500">{a.activity_type}</td>
                    <td className="px-3 py-2 text-slate-500">{a.loan_status}</td>
                    <td className="px-3 py-2">
                      <span className={a.activity_status === 'Done' ? 'status-done' : a.activity_status === 'Pending' ? 'status-pending' : 'status-call-again'}>
                        {a.activity_status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400">{a.created_at?.slice(0,10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-slate-400">No recent activities.</p>}
      </div>
    </div>
  );
}
