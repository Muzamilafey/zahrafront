import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function Wards() {
  const { axiosInstance } = useContext(AuthContext);
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomCapacity, setRoomCapacity] = useState(1);
  const [beds, setBeds] = useState([]);
  const [bedNumber, setBedNumber] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('general');

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get('/wards');
        setWards(res.data.wards || []);
      }catch(e){ console.error(e); }
    };
    load();
  }, []);

  const loadRooms = async (wardId) => {
    try{
      const r = await axiosInstance.get(`/wards/${wardId}/rooms`);
      setRooms(r.data.rooms || []);
      setSelectedWard(wardId);
      setBeds([]);
    }catch(e){ console.error(e); }
  };

  const createRoom = async (e) => {
    e && e.preventDefault && e.preventDefault();
    try{
      await axiosInstance.post(`/wards/${selectedWard}/rooms`, { number: roomNumber, capacity: roomCapacity });
      await loadRooms(selectedWard);
      setRoomNumber(''); setRoomCapacity(1);
    }catch(e){ console.error(e); }
  };

  const loadBeds = async (roomId) => {
    try{
      const b = await axiosInstance.get(`/wards/${selectedWard}/rooms/${roomId}/beds`);
      setBeds(b.data.beds || []);
    }catch(e){ console.error(e); }
  };

  const createBed = async (e, roomId) => {
    e && e.preventDefault && e.preventDefault();
    try{
      await axiosInstance.post(`/wards/${selectedWard}/rooms/${roomId}/beds`, { number: bedNumber });
      await loadBeds(roomId);
      setBedNumber('');
    }catch(e){ console.error(e); }
  };

  const create = async (e)=>{
    e && e.preventDefault && e.preventDefault();
    try{
      await axiosInstance.post('/wards', { name, type });
      const res = await axiosInstance.get('/wards');
      setWards(res.data.wards || []);
      setName(''); setType('general');
    }catch(e){ console.error(e); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Wards</h1>
      <form onSubmit={create} className="mb-4 flex gap-2">
        <input className="input" placeholder="Ward name" value={name} onChange={e=>setName(e.target.value)} />
        <select className="input" value={type} onChange={e=>setType(e.target.value)}>
          <option value="general">General</option>
          <option value="icu">ICU</option>
          <option value="maternity">Maternity</option>
          <option value="pediatric">Pediatric</option>
        </select>
        <button className="btn-brand" type="submit">Create</button>
      </form>
      <div className="bg-white rounded p-4 shadow grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Wards</h4>
          <table className="table-auto w-full text-sm">
            <thead><tr><th>Name</th><th>Type</th></tr></thead>
            <tbody>
              {wards.map(w=> (
                <tr key={w._id} className="border-t"><td className="px-2 py-1"><button className="text-blue-600" onClick={()=>loadRooms(w._id)}>{w.name}</button></td><td className="px-2 py-1">{w.type}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Rooms{selectedWard ? ` (Ward)` : ''}</h4>
          {selectedWard ? (
            <div>
              <form onSubmit={createRoom} className="flex gap-2 mb-2">
                <input className="input" placeholder="Room #" value={roomNumber} onChange={e=>setRoomNumber(e.target.value)} />
                <input type="number" className="input" value={roomCapacity} onChange={e=>setRoomCapacity(e.target.value)} />
                <button className="btn-brand" type="submit">Add Room</button>
              </form>
              <table className="table-auto w-full text-sm">
                <thead><tr><th>#</th><th>Capacity</th><th>Actions</th></tr></thead>
                <tbody>
                  {rooms.map(r=> (
                    <tr key={r._id} className="border-t"><td className="px-2 py-1">{r.number}</td><td className="px-2 py-1">{r.capacity}</td><td className="px-2 py-1"><button className="btn-outline" onClick={()=>loadBeds(r._id)}>Beds</button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (<div className="text-sm text-gray-500">Select a ward to view rooms</div>)}
        </div>

        <div>
          <h4 className="font-semibold mb-2">Beds</h4>
          {beds.length === 0 ? (<div className="text-sm text-gray-500">Select a room to view beds</div>) : (
            <div>
              <table className="table-auto w-full text-sm">
                <thead><tr><th>#</th><th>Status</th><th>Patient</th></tr></thead>
                <tbody>
                  {beds.map(b=> (
                    <tr key={b._id} className="border-t"><td className="px-2 py-1">{b.number}</td><td className="px-2 py-1">{b.status}</td><td className="px-2 py-1">{b.patient?.user?.name || '-'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
