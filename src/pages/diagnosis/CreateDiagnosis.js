import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function CreateDiagnosis(){
  const { axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return setError('Name is required');
    setError('');
    setLoading(true);
    try {
      const payload = { name: form.name, code: form.code, description: form.description };
      await axiosInstance.post('/diagnoses', payload);
      alert('Diagnosis created');
      navigate('/lab/tests/list');
    } catch (err) {
      console.error('Failed to create diagnosis', err);
      setError(err?.response?.data?.message || 'Failed to create diagnosis');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white border rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Register Diagnosis</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
          <input className="p-2 border rounded" placeholder="Diagnosis name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <input className="p-2 border rounded" placeholder="Code (optional)" value={form.code} onChange={e=>setForm({...form,code:e.target.value})} />
          <textarea className="p-2 border rounded" placeholder="Description (optional)" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="text-right">
            <button type="submit" disabled={loading} className="px-3 py-1 bg-blue-600 text-white rounded">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
