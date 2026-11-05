import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col items-center justify-center text-white p-6">
      <div className="max-w-2xl text-center">
        <div className="text-7xl mb-6">💼</div>
        <h1 className="text-5xl font-bold mb-4">Sales Buddy 3.0</h1>
        <p className="text-xl text-blue-200 mb-8">
          The all-in-one sales management platform for City Savings Bank's Salary and Pension Loans teams.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 text-left">
          {[
            { icon: '👥', title: 'Lead Management', desc: 'Register and track leads across DepEd, Beyond DepEd, and Pension sectors.' },
            { icon: '📋', title: 'Activity Tracking', desc: 'Log field engagements, calls, visits, and monitor real-time statuses.' },
            { icon: '🎯', title: 'Performance Analytics', desc: 'Track targets, attainments, and productivity by branch, region, or agency.' },
            { icon: '📤', title: 'Data Uploads', desc: 'Bulk import MOB, LCS, Daily LR, and DepEd reloan data via CSV.' },
          ].map((f, i) => (
            <div key={i} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="font-semibold text-lg mb-1">{f.title}</div>
              <div className="text-sm text-blue-200">{f.desc}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 justify-center">
          <button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-lg">
            Sign In
          </button>
          <button onClick={() => navigate('/register')} className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-lg backdrop-blur-sm">
            Register
          </button>
        </div>
        <p className="mt-8 text-xs text-blue-300">City Savings Bank · Internal Use Only</p>
      </div>
    </div>
  );
}
