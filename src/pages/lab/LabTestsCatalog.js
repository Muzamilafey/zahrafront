import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function LabTestsCatalog(){
  const { axiosInstance } = useContext(AuthContext);
  const [tests, setTests] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', normalValue: '', startValue: '', endValue: '', unit: '', price: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ load(); },[]);
  async function load(){
    setLoading(true);
    try{
      const res = await axiosInstance.get('/labs/catalog');
      setTests(res.data.tests || []);
    }catch(e){ console.error(e); }
    setLoading(false);
  }

  async function save(e){
    e && e.preventDefault();
    const payload = { ...form, price: Number(form.price) || 0 };
    try{
      const res = await axiosInstance.post('/labs/catalog', payload);
      setTests(prev=>[res.data.test, ...prev]);
      setForm({ name: '', code: '', normalValue: '', startValue: '', endValue: '', unit: '', price: '' });
    }catch(e){ console.error(e); }
  }

  async function remove(id){
    if(!window.confirm('Delete test?')) return;
    try{
      await axiosInstance.delete(`/labs/catalog/${id}`);
      setTests(prev=>prev.filter(t=>t._id !== id));
    }catch(e){ console.error(e); }
  }

  function startEdit(t){
    setEditingId(t._id);
    setEditForm({ name: t.name||'', code: t.code||'', normalValue: t.normalValue||'', startValue: t.startValue||'', endValue: t.endValue||'', unit: t.unit||'', price: t.price||0 });
  }

  async function saveEdit(id){
    try{
      const payload = { ...editForm, price: Number(editForm.price) || 0 };
      const res = await axiosInstance.put(`/labs/catalog/${id}`, payload);
      setTests(prev => prev.map(p => p._id === id ? res.data.test : p));
      setEditingId(null);
      setEditForm({});
    }catch(e){ console.error(e); }
  }

  function cancelEdit(){ setEditingId(null); setEditForm({}); }

  const filtered = tests.filter(t => !search || (t.name || '').toLowerCase().includes(search.toLowerCase()) || (t.code||'').toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Lab Tests Catalog</h2>
      <div className="flex items-center gap-2 mb-4">
        <input placeholder="Search tests by name or code" value={search} onChange={e=>setSearch(e.target.value)} className="p-2 border rounded w-64" />
      </div>
      <form onSubmit={save} className="grid grid-cols-2 gap-2 mb-4">
        <input required placeholder="Test name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="p-2 border rounded" />
        <input placeholder="Code" value={form.code} onChange={e=>setForm({...form,code:e.target.value})} className="p-2 border rounded" />
        <input placeholder="Normal value" value={form.normalValue} onChange={e=>setForm({...form,normalValue:e.target.value})} className="p-2 border rounded" />
        <input placeholder="Unit" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} className="p-2 border rounded" />
        <input placeholder="Start value" value={form.startValue} onChange={e=>setForm({...form,startValue:e.target.value})} className="p-2 border rounded" />
        <input placeholder="End value" value={form.endValue} onChange={e=>setForm({...form,endValue:e.target.value})} className="p-2 border rounded" />
        <input placeholder="Price" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="p-2 border rounded" />
        <div className="flex items-center">
          <button type="submit" className="px-3 py-1 bg-brand-600 text-white rounded">Add Test</button>
        </div>
      </form>

      {loading ? <div>Loading...</div> : (
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left"><th>Name</th><th>Range</th><th>Unit</th><th>Price</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map(t=> (
              <tr key={t._id} className="border-t">
                {editingId === t._id ? (
                  <>
                    <td><input value={editForm.name} onChange={e=>setEditForm(prev=>({...prev,name:e.target.value}))} className="p-1 border rounded w-full" /></td>
                    <td>
                      <input value={editForm.startValue} onChange={e=>setEditForm(prev=>({...prev,startValue:e.target.value}))} placeholder="start" className="p-1 border rounded w-32 mr-2" />
                      <input value={editForm.endValue} onChange={e=>setEditForm(prev=>({...prev,endValue:e.target.value}))} placeholder="end" className="p-1 border rounded w-32" />
                      <div className="text-xs text-gray-500">{editForm.normalValue}</div>
                    </td>
                    <td><input value={editForm.unit} onChange={e=>setEditForm(prev=>({...prev,unit:e.target.value}))} className="p-1 border rounded w-24" /></td>
                    <td><input type="number" value={editForm.price} onChange={e=>setEditForm(prev=>({...prev,price:e.target.value}))} className="p-1 border rounded w-24" /></td>
                    <td className="flex gap-2">
                      <button onClick={()=>saveEdit(t._id)} className="px-2 py-1 bg-brand-600 text-white rounded">Save</button>
                      <button onClick={cancelEdit} className="px-2 py-1 border rounded">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{t.name}</td>
                    <td>{t.startValue} - {t.endValue} ({t.normalValue})</td>
                    <td>{t.unit}</td>
                    <td>{t.price}</td>
                    <td className="flex gap-2"><button onClick={()=>startEdit(t)} className="text-blue-600">Edit</button><button onClick={()=>remove(t._id)} className="text-red-600">Delete</button></td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
