import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function AdminSlots(){
  const { axiosInstance } = useContext(AuthContext);
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ consultation: '', doctor: '', date: '', time: '' });

  useEffect(()=>{ const load = async ()=>{ try{ const rc = await axiosInstance.get('/consultations'); setConsultations(rc.data.consultations||[]); const rd = await axiosInstance.get('/doctors'); setDoctors(rd.data.doctors||[]); }catch(e){console.error(e);} }; load(); },[]);

  const create = async ()=>{
    try{
      const res = await axiosInstance.post('/slots', form);
      setSlots([res.data.slot, ...slots]);
      setForm({ consultation: '', doctor: '', date: '', time: '' });
      alert('Slot created');
    }catch(e){console.error(e); alert('Failed');}
  };

  const loadForConsultation = async (consultationId) => {
    if (!consultationId) return setSlots([]);
    try{ const r = await axiosInstance.get(`/slots?consultation=${consultationId}`); setSlots(r.data.slots||[]); }catch(e){console.error(e);} }

  const remove = async (id)=>{
    try{ await axiosInstance.delete(`/slots/${id}`); setSlots(slots.filter(s=>s._id!==id)); }catch(e){console.error(e); alert('Failed to delete');}
  };

  return (
    <div className="p-6">
  <h2 className="text-2xl font-bold mt-0 mb-0 text-brand-700">Available Slots</h2>
      <div className="bg-white rounded p-4 shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select className="border p-2 rounded" value={form.consultation} onChange={e=>{ setForm({...form, consultation: e.target.value}); loadForConsultation(e.target.value); }}>
            <option value="">Select consultation</option>
            {consultations.map(c=>(<option key={c._id} value={c._id}>{c.name}</option>))}
          </select>
          <select className="border p-2 rounded" value={form.doctor} onChange={e=>setForm({...form, doctor: e.target.value})}>
            <option value="">Select doctor (optional)</option>
            {doctors.map(d=>(<option key={d._id} value={d._id}>{d.user?.name || d._id}</option>))}
          </select>
          <input className="border p-2 rounded" type="date" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} />
          <input className="border p-2 rounded" placeholder="Time e.g., 09:00 AM" value={form.time} onChange={e=>setForm({...form, time: e.target.value})} />
          <div><button className="btn-brand" onClick={create}>Create slot</button></div>
        </div>
      </div>

      <div className="bg-white rounded p-4 shadow">
        <h4 className="font-medium mb-2">Slots</h4>
        <div className="space-y-2">
          {slots.map(s=>(
            <div key={s._id} className="p-2 border rounded flex justify-between items-center">
              <div>{s.date} — {s.time} — {s.doctor?.user?.name || s.consultation?.name}</div>
              <div><button className="btn-outline" onClick={()=>remove(s._id)}>Delete</button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
