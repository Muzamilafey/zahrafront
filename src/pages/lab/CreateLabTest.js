import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function CreateLabTest(){
  const { axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', code: '', unit: '', normalValue: '', startValue: '', endValue: '', price: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(()=>{
    // no-op for now; kept for symmetry if we later fetch departments
  },[]);

  const handleSubmit = async (e)=>{
    e.preventDefault();
    setError('');
    if(!form.name) return setError('Test name is required');
    setLoading(true);
    try{
      const payload = { 
        name: form.name,
        code: form.code,
        unit: form.unit,
        normalValue: form.normalValue,
        startValue: form.startValue,
        endValue: form.endValue,
        price: Number(form.price) || 0
      };
      // Post to /lab/catalog so RegisterLabTemplate (which requests /lab/catalog) will pick it up
      const res = await axiosInstance.post('/lab/catalog', payload);
      alert('Lab test created');
      // navigate back to catalog list if route exists; otherwise go to templates
      try{ navigate('/lab/tests'); }catch(e){ navigate('/lab/templates'); }
    }catch(err){
      console.error('Failed to create lab test', err);
      setError(err?.response?.data?.message || 'Failed to create test');
    }finally{ setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white border rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Create Lab Test</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
          <input className="p-2 border rounded" placeholder="Test name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <input className="p-2 border rounded" placeholder="Code (optional)" value={form.code} onChange={e=>setForm({...form,code:e.target.value})} />
          <input className="p-2 border rounded" placeholder="Unit" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} />
          <input className="p-2 border rounded" placeholder="Normal value (description)" value={form.normalValue} onChange={e=>setForm({...form,normalValue:e.target.value})} />
          <div className="grid grid-cols-2 gap-2">
            <input className="p-2 border rounded" placeholder="Start value" value={form.startValue} onChange={e=>setForm({...form,startValue:e.target.value})} />
            <input className="p-2 border rounded" placeholder="End value" value={form.endValue} onChange={e=>setForm({...form,endValue:e.target.value})} />
          </div>
          <input className="p-2 border rounded" placeholder="Price" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} />

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="text-right">
            <button type="submit" disabled={loading} className="px-3 py-1 bg-blue-600 text-white rounded">{loading ? 'Saving...' : 'Create Test'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
