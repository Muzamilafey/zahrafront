import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function AdmitPatient(){
  const { axiosInstance } = useContext(AuthContext);
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [beds, setBeds] = useState([]);
  const [selectedBed, setSelectedBed] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState([]);

  useEffect(()=>{
    const t = setTimeout(()=>{
      const q = patientQuery && patientQuery.trim();
      if (!q) { setPatientResults([]); return; }
      axiosInstance.get(`/patients?search=${encodeURIComponent(q)}`).then(r=>setPatientResults(r.data.patients||[])).catch(()=>{});
    }, 400);
    return ()=>clearTimeout(t);
  }, [patientQuery]);

  useEffect(()=>{ loadWards(); }, []);
  const loadWards = async ()=>{ try{ const res = await axiosInstance.get('/wards'); setWards(res.data.wards||[]); }catch(e){console.error(e);} };
  const loadRooms = async (wardId)=>{ try{ const res = await axiosInstance.get(`/wards/${wardId}/rooms`); setRooms(res.data.rooms||[]); }catch(e){console.error(e);} };
  const loadBeds = async (wardId, roomId)=>{ try{ const res = await axiosInstance.get(`/wards/${wardId}/rooms/${roomId}/beds`); setBeds(res.data.beds||[]); }catch(e){console.error(e);} };

  const handleWardChange = (v)=>{ setSelectedWard(v); setSelectedRoom(''); setBeds([]); if(v) loadRooms(v); };
  const handleRoomChange = (v)=>{ setSelectedRoom(v); setBeds([]); if(v) loadBeds(selectedWard, v); };

  const admit = async ()=>{
    if(!selectedBed || !patientId) return;
    try{
      await axiosInstance.put(`/wards/beds/${selectedBed}/assign`, { patientId });
      alert('Patient admitted');
    }catch(e){ console.error(e); alert('Failed to admit'); }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Admit Patient</h2>
      <div className="bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm">Ward</label>
          <select className="input w-full" value={selectedWard} onChange={e=>handleWardChange(e.target.value)}>
            <option value="">-- select ward --</option>
            {wards.map(w=> (<option key={w._id} value={w._id}>{w.name}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm">Room</label>
          <select className="input w-full" value={selectedRoom} onChange={e=>handleRoomChange(e.target.value)}>
            <option value="">-- select room --</option>
            {rooms.map(r=> (<option key={r._id} value={r._id}>{r.number}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm">Bed</label>
          <select className="input w-full" value={selectedBed} onChange={e=>setSelectedBed(e.target.value)}>
            <option value="">-- select bed --</option>
            {beds.map(b=> (<option key={b._id} value={b._id}>{b.number} — {b.status}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm">Patient ID</label>
          <input className="input w-full" value={patientId} onChange={e=>setPatientId(e.target.value)} placeholder="Patient _id or hospitalId" />
          <div className="mt-2">
            <label className="block text-xs text-gray-500">Or search patient</label>
            <input className="input w-full" value={patientQuery} onChange={e=>setPatientQuery(e.target.value)} placeholder="Search by name or hospitalId" />
            {patientResults.length > 0 && (
              <ul className="bg-white border rounded mt-1 max-h-48 overflow-auto">
                {patientResults.map(p=> (<li key={p._id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={()=>{ setPatientId(p._id); setPatientResults([]); setPatientQuery(''); }}>{p.user?.name || p._id} — {p.hospitalId || ''}</li>))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4"><button className="btn-brand" onClick={admit}>Admit</button></div>
    </div>
  );
}
