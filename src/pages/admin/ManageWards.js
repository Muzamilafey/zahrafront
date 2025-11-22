import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function ManageWards(){
  const { axiosInstance } = useContext(AuthContext);
  const [wards, setWards] = useState([]);
  const [name, setName] = useState('');
  const [wardDailyRate, setWardDailyRate] = useState('');
  const [category, setCategory] = useState('General');
  const [selectedWardForRoom, setSelectedWardForRoom] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [selectedWardForBed, setSelectedWardForBed] = useState('');
  const [roomsForSelectedWard, setRoomsForSelectedWard] = useState([]);
  const [selectedRoomForBed, setSelectedRoomForBed] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [bedDailyRate, setBedDailyRate] = useState('');
  const [editingWardId, setEditingWardId] = useState(null);
  const [editWardName, setEditWardName] = useState('');
  const [editWardDailyRate, setEditWardDailyRate] = useState('');
  const [roomsByWard, setRoomsByWard] = useState({});

  const load = async ()=>{ try{ const res = await axiosInstance.get('/wards'); setWards(res.data.wards||[]); }catch(e){console.error(e);} };
  useEffect(()=>{ load(); }, []);

  const createWard = async ()=>{ try{ await axiosInstance.post('/wards', { name, dailyRate: wardDailyRate ? Number(wardDailyRate) : undefined, category }); setName(''); setWardDailyRate(''); await load(); }catch(e){console.error(e);} };
  const createRoom = async ()=>{ if(!selectedWardForRoom) return; try{ await axiosInstance.post(`/wards/${selectedWardForRoom}/rooms`, { number: roomNumber }); setRoomNumber(''); await load(); }catch(e){console.error(e);} };
  const loadRoomsForWard = async (wardId)=>{ try{ const res = await axiosInstance.get(`/wards/${wardId}/rooms`); const rooms = res.data.rooms||[]; setRoomsForSelectedWard(rooms); setRoomsByWard(r => ({ ...r, [wardId]: rooms })); }catch(e){console.error(e);} };
  const createBed = async ()=>{ if(!selectedWardForBed || !selectedRoomForBed) return; try{ await axiosInstance.post(`/wards/${selectedWardForBed}/rooms/${selectedRoomForBed}/beds`, { number: bedNumber, dailyRate: bedDailyRate ? Number(bedDailyRate) : undefined }); setBedNumber(''); setBedDailyRate(''); await load(); await loadRoomsForWard(selectedWardForBed); }catch(e){console.error(e);} };

  const startEditWard = (w)=>{ setEditingWardId(w._id); setEditWardName(w.name || ''); setEditWardDailyRate(w.dailyRate != null ? String(w.dailyRate) : ''); };
  const cancelEditWard = ()=>{ setEditingWardId(null); setEditWardName(''); setEditWardDailyRate(''); };
  const saveWardEdits = async (wardId)=>{ try{ await axiosInstance.put(`/wards/${wardId}`, { name: editWardName, dailyRate: editWardDailyRate ? Number(editWardDailyRate) : undefined }); await load(); cancelEditWard(); }catch(e){ console.error(e); } };
  const toggleRoomsView = async (wardId)=>{ if (roomsByWard[wardId]) { setRoomsByWard(r => { const copy = { ...r }; delete copy[wardId]; return copy; }); return; } await loadRoomsForWard(wardId); };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Manage Wards</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Create Ward</h3>
          <input className="input w-full mt-2" value={name} onChange={e=>setName(e.target.value)} placeholder="Ward name" />
          <select className="input w-full mt-2" value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="General">General</option>
            <option value="Special">Special</option>
          </select>
          <div className="mt-2"><button className="btn-brand" onClick={createWard}>Create Ward</button></div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Create Room</h3>
          <select className="input w-full" value={selectedWardForRoom} onChange={e=>setSelectedWardForRoom(e.target.value)}>
            <option value="">-- select ward --</option>
            {wards.map(w=> (<option key={w._id} value={w._id}>{w.name}</option>))}
          </select>
          <input className="input w-full mt-2" value={roomNumber} onChange={e=>setRoomNumber(e.target.value)} placeholder="Room number" />
          <div className="mt-2"><button className="btn-brand" onClick={createRoom}>Create Room</button></div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Create Bed</h3>
          <select className="input w-full" value={selectedWardForBed} onChange={e=>{ setSelectedWardForBed(e.target.value); loadRoomsForWard(e.target.value); }}>
            <option value="">-- select ward --</option>
            {wards.map(w=> (<option key={w._id} value={w._id}>{w.name}</option>))}
          </select>
          <select className="input w-full mt-2" value={selectedRoomForBed} onChange={e=>setSelectedRoomForBed(e.target.value)}>
            <option value="">-- select room --</option>
            {roomsForSelectedWard.map(r=> (<option key={r._id} value={r._id}>{r.number}</option>))}
          </select>
          <input className="input w-full mt-2" value={bedNumber} onChange={e=>setBedNumber(e.target.value)} placeholder="Bed number" />
          <div className="mt-2"><button className="btn-brand" onClick={createBed}>Create Bed</button></div>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded shadow">
        <h3 className="font-semibold">Existing Wards</h3>
        <ul className="mt-2 space-y-2">
          {wards.map(w=> (
            <li key={w._id} className="p-2 border rounded">
              {editingWardId === w._id ? (
                <div className="flex gap-2 items-center">
                  <input className="input" value={editWardName} onChange={e=>setEditWardName(e.target.value)} />
                  <input className="input w-32" placeholder="Daily rate" value={editWardDailyRate} onChange={e=>setEditWardDailyRate(e.target.value)} />
                  <button className="btn-brand" onClick={()=>saveWardEdits(w._id)}>Save</button>
                  <button className="btn-outline" onClick={cancelEditWard}>Cancel</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{w.name}</div>
                    <div className="text-sm text-gray-600">Daily Rate: ${w.dailyRate != null ? String(w.dailyRate) : '0'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-outline text-sm" onClick={()=>startEditWard(w)}>Edit</button>
                    <button className="btn-primary text-sm" onClick={()=>toggleRoomsView(w._id)}>{roomsByWard[w._id] ? 'Hide rooms' : 'View rooms'}</button>
                  </div>
                </div>
              )}

              {roomsByWard[w._id] && (
                <div className="mt-2 bg-gray-50 p-2 rounded">
                  <h4 className="font-medium">Rooms</h4>
                  {roomsByWard[w._id].length === 0 && <div className="text-sm text-gray-500">No rooms</div>}
                  <ul className="mt-2 space-y-1">
                    {roomsByWard[w._id].map(r=> (
                      <li key={r._id} className="flex items-center justify-between p-1 border rounded">
                        <div>Room {r.number}</div>
                        <div className="text-sm text-gray-600">Beds: {Array.isArray(r.beds) ? r.beds.length : (r._countBeds || 0)}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
