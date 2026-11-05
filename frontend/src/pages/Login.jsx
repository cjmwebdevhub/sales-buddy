import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💼</div>
          <h1 className="text-2xl font-bold text-slate-800">Sales Buddy 3.0</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email Address</label>
            <input type="email" className="input" placeholder="you@csb.com" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="••••••••" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-base mt-2">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-xs text-slate-600">
          <div className="font-semibold mb-1">Demo Accounts:</div>
          <div>admin@csb.com / Admin@123</div>
          <div>ash@csb.com / Ash@1234</div>
          <div>sa1@csb.com / Sa@12345</div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">Register</Link>
        </p>
      </div>
    </div>
  );
}
