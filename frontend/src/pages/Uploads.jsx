import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api';

const TABLES = [
  { key: 'daily_lr', label: 'Daily LR', desc: 'Daily loan disbursement records', icon: '💰' },
  { key: 'lcs14', label: 'LCS 14 (MOB 14)', desc: 'Month-on-book 14 loan data', icon: '📄' },
  { key: 'lcs18_pd_npl', label: 'LCS 18 / PD_NPL', desc: 'Non-performing loans and MOB 18', icon: '📋' },
  { key: 'deped_reloan', label: 'DepEd Reloan Monitoring', desc: 'DepEd reloan tracking data', icon: '🏫' },
  { key: 'deped_sor', label: 'DepEd SOR', desc: 'DepEd Statement of Releases', icon: '📑' },
  { key: 'deped_mob', label: 'DepEd MOB', desc: 'DepEd Month on Book data', icon: '📊' },
];

export default function Uploads() {
  const [uploading, setUploading] = useState({});
  const [results, setResults] = useState({});

  const handleUpload = async (table, file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error('Only CSV files are accepted');
      return;
    }
    setUploading(u => ({ ...u, [table]: true }));
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(`/uploads/${table}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`${res.data.inserted} records uploaded to ${table}`);
      setResults(r => ({ ...r, [table]: { success: true, count: res.data.inserted } }));
    } catch (err) {
      toast.error(err.response?.data?.error || `Upload failed for ${table}`);
      setResults(r => ({ ...r, [table]: { success: false, error: err.response?.data?.error } }));
    } finally {
      setUploading(u => ({ ...u, [table]: false }));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Data Uploads</h1>
        <p className="text-sm text-slate-500">Upload CSV files for bulk data import. Admin only.</p>
      </div>

      <div className="card bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div className="text-sm text-yellow-800">
            <div className="font-semibold">CSV Format Required</div>
            <div>All files must be uploaded in <strong>.csv</strong> format only. The system will not accept Excel (.xlsx), PDF, or image files.</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TABLES.map(t => (
          <div key={t.key} className="card">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-3xl">{t.icon}</div>
              <div>
                <div className="font-semibold text-slate-800">{t.label}</div>
                <div className="text-xs text-slate-500">{t.desc}</div>
              </div>
            </div>

            <label className="block">
              <div className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${uploading[t.key] ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                {uploading[t.key] ? (
                  <div className="text-blue-600 text-sm">Uploading...</div>
                ) : (
                  <>
                    <div className="text-2xl mb-1">📁</div>
                    <div className="text-sm font-medium text-slate-600">Drop CSV file or click to browse</div>
                    <div className="text-xs text-slate-400 mt-0.5">.csv files only</div>
                  </>
                )}
              </div>
              <input type="file" accept=".csv" className="hidden"
                onChange={e => { if (e.target.files[0]) handleUpload(t.key, e.target.files[0]); e.target.value = ''; }}
                disabled={uploading[t.key]} />
            </label>

            {results[t.key] && (
              <div className={`mt-3 p-2.5 rounded-lg text-xs ${results[t.key].success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {results[t.key].success ? `✅ ${results[t.key].count} records imported` : `❌ ${results[t.key].error}`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
