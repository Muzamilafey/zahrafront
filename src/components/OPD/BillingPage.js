import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function BillingPage(){
  const { axiosInstance } = useContext(AuthContext);
  const [visitId, setVisitId] = useState('');
  const [items, setItems] = useState([{ description:'Consultation fee', amount:0 }]);
  const [saving, setSaving] = useState(false);

  const addItem = ()=> setItems([...items, { description:'', amount:0 }]);
  const change = (idx, key, val)=> { const next = [...items]; next[idx][key]= val; setItems(next); };

  const submit = async ()=>{
    setSaving(true);
    try{
      const res = await axiosInstance.post('/api/opd/billing', { visit: visitId, items });
      alert('Invoice created: ' + res.data.invoice._id);
    }catch(err){ console.error(err); alert(err.response?.data?.message || err.message); }
    finally{ setSaving(false); }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-3">OPD Billing</h2>
      <input className="input mb-2" placeholder="Visit ID" value={visitId} onChange={e=>setVisitId(e.target.value)} />
      <div className="space-y-2">
        {items.map((it,i)=> (
          <div key={i} className="flex gap-2">
            <input className="input flex-1" placeholder="Description" value={it.description} onChange={e=>change(i,'description',e.target.value)} />
            <input className="input w-32" type="number" value={it.amount} onChange={e=>change(i,'amount',Number(e.target.value))} />
          </div>
        ))}
      </div>
      <div className="mt-2">
        <button className="btn-outline" onClick={addItem}>Add Item</button>
        <button className="btn ml-2" onClick={submit} disabled={saving}>{saving?'Saving...':'Create Invoice'}</button>
      </div>
    </div>
  );
}
