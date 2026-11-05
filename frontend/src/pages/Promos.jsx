import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const AGENCIES = ['DEPED', 'BEYOND_DEPED', 'PENSION'];

export default function Promos() {
  const { user } = useAuth();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPromo, setEditPromo] = useState(null);
  const [form, setForm] = useState({
    promo_agency: 'DEPED', promo_name: '', date_start: '', date_end: '', description: '', changes_made: ''
  });

  const loadPromos = () => {
    api.get('/promos').then(r => setPromos(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadPromos(); }, []);

  const openNew = () => {
    setEditPromo(null);
    setForm({ promo_agency: 'DEPED', promo_name: '', date_start: '', date_end: '', description: '', changes_made: '' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditPromo(p);
    setForm({ promo_agency: p.promo_agency, promo_name: p.promo_name, date_start: p.date_start, date_end: p.date_end, description: p.description || '', changes_made: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editPromo) {
        await api.put(`/promos/${editPromo.id}`, form);
        toast.success('Promo updated!');
      } else {
        await api.post('/promos', form);
        toast.success('Promo created!');
      }
      setShowModal(false);
      loadPromos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this promo?')) return;
    try {
      await api.delete(`/promos/${id}`);
      toast.success('Promo deleted');
      loadPromos();
    } catch { toast.error('Delete failed'); }
  };

  const isActive = (p) => new Date(p.date_end) >= new Date();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Promos</h1>
          <p className="text-sm text-slate-500">Active and expired promotional offers</p>
        </div>
        {user?.role === 'Admin' && (
          <button onClick={openNew} className="btn-primary">+ Create Promo</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div className="col-span-3 text-center py-10 text-slate-400">Loading...</div>
        : promos.length === 0 ? <div className="col-span-3 text-center py-10 text-slate-400">No promos available.</div>
        : promos.map(p => (
          <div key={p.id} className={`card ${!isActive(p) ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-3xl mb-1">🎁</div>
                <div className="font-semibold text-slate-800">{p.promo_name}</div>
                <div className="text-xs text-slate-500">{p.promo_id}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`badge ${isActive(p) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isActive(p) ? '✅ Active' : '❌ Expired'}
                </span>
                <span className="badge bg-blue-50 text-blue-700">{p.promo_agency}</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-3">{p.description}</p>
            <div className="text-xs text-slate-400 space-y-0.5">
              <div>Start: <span className="text-slate-600 font-medium">{p.date_start}</span></div>
              <div>End: <span className="text-slate-600 font-medium">{p.date_end}</span></div>
              <div>Created by: {p.created_by}</div>
            </div>
            {user?.role === 'Admin' && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                <button onClick={() => openEdit(p)} className="btn-secondary text-xs flex-1">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="btn-danger text-xs flex-1">Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Promo Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{editPromo ? 'Edit Promo' : 'Create Promo'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Agency *</label>
                  <select className="input" value={form.promo_agency} onChange={e => setForm({...form, promo_agency: e.target.value})}>
                    {AGENCIES.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Promo Name *</label>
                  <input className="input" value={form.promo_name} onChange={e => setForm({...form, promo_name: e.target.value})} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date Start *</label>
                  <input type="date" className="input" value={form.date_start} onChange={e => setForm({...form, date_start: e.target.value})} required />
                </div>
                <div>
                  <label className="label">Date End *</label>
                  <input type="date" className="input" value={form.date_end} onChange={e => setForm({...form, date_end: e.target.value})} required />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              {editPromo && (
                <div>
                  <label className="label">Changes Made</label>
                  <input className="input" value={form.changes_made} onChange={e => setForm({...form, changes_made: e.target.value})} placeholder="Describe what was changed..." />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{editPromo ? 'Update' : 'Create'} Promo</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
