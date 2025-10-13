import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function WardRooms(){
  const { wardId } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  useEffect(()=>{ axiosInstance.get(`/wards/${wardId}/rooms`).then(r=>setRooms(r.data.rooms||[])).catch(()=>{}); }, [wardId]);
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Rooms</h2>
      <div className="bg-white p-4 rounded shadow">
        <ul>
          {rooms.map(r=> (
            <li key={r._id} className="p-2 border-b flex justify-between items-center">
              <div>Room {r.number} — capacity {r.capacity}</div>
              <div><Link to={`/dashboard/admin/wards/${wardId}/rooms/${r._id}/beds`} className="btn-outline">View Beds</Link></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
