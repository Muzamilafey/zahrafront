import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

export default function RegisterDrugs(){
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useUI();
  const [form, setForm] = useState({ name: '', price: '', stockLevel: '', form: '', strength: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try{
      const payload = { ...form, price: Number(form.price||0), stockLevel: Number(form.stockLevel||0) };
      await axiosInstance.post('/pharmacy/drugs', payload);
      showToast({ message: 'Drug registered', type: 'success' });
      setForm({ name: '', price: '', stockLevel: '', form: '', strength: '' });
    }catch(e){
      console.error('Failed to register drug', e);
      showToast({ message: e?.response?.data?.message || 'Failed to register drug', type: 'error' });
    }finally{ setSaving(false); }
  };

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Register Drug</h2>
      <form onSubmit={submit} className="space-y-3 max-w-md">
        <div>
          <label className="block text-sm text-gray-600">Name</label>
          <input className="input" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} required />
        </div>

        <div>
          <label className="block text-sm text-gray-600">Form (e.g., tablet)</label>
          <input className="input" value={form.form} onChange={e=>setForm(f=>({...f, form: e.target.value}))} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-gray-600">Strength</label>
            <input className="input" value={form.strength} onChange={e=>setForm(f=>({...f, strength: e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Price</label>
            <input className="input" type="number" value={form.price} onChange={e=>setForm(f=>({...f, price: e.target.value}))} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600">Starting Stock</label>
          <input className="input" type="number" value={form.stockLevel} onChange={e=>setForm(f=>({...f, stockLevel: e.target.value}))} />
        </div>

        <div>
          <button className="btn-brand" disabled={saving}>{saving ? 'Saving...' : 'Register'}</button>
        </div>
      </form>
    </div>
  );
}
