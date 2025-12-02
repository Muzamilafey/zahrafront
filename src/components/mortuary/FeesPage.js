import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function FeesPage(){
  const { axiosInstance } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', description: '', amount: 0 });

  const load = async ()=>{
    try{ const res = await axiosInstance.get('/mortuary/fees'); setServices(res.data.services || []); }catch(e){}
  };

  useEffect(()=>{ load(); }, []);

  const submit = async (e)=>{
    e.preventDefault();
    try{
      await axiosInstance.post('/mortuary/fees', form);
      setForm({ name: '', code: '', description: '', amount: 0 });
      await load();
    }catch(e){ alert('Failed to create'); }
  };

  const remove = async (id)=>{
    if(!confirm('Delete this service?')) return;
    try{ await axiosInstance.delete(`/mortuary/fees/${id}`); await load(); }catch(e){ alert('Delete failed'); }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Mortuary Service Fees</h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border p-4 rounded">
          <form onSubmit={submit} className="space-y-2">
            <input required placeholder="Name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full p-2 border rounded" />
            <input placeholder="Code" value={form.code} onChange={e=>setForm({...form, code: e.target.value})} className="w-full p-2 border rounded" />
            <input type="number" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form, amount: Number(e.target.value)})} className="w-full p-2 border rounded" />
            <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} className="w-full p-2 border rounded" />
            <div><button className="px-3 py-1 bg-brand-600 text-white rounded">Create</button></div>
          </form>
        </div>
        <div className="bg-white border p-4 rounded">
          <h3 className="font-medium mb-2">Existing Services</h3>
          <ul>
            {services.map(s=> (
              <li key={s._id} className="flex justify-between py-2 border-b">
                <div>
                  <div className="font-medium">{s.name} — {s.amount}</div>
                  <div className="text-sm text-gray-600">{s.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>remove(s._id)} className="text-sm text-red-600">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
