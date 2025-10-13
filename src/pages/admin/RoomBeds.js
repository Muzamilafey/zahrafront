import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function RoomBeds(){
  const { wardId, roomId } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const [beds, setBeds] = useState([]);
  useEffect(()=>{ axiosInstance.get(`/wards/${wardId}/rooms/${roomId}/beds`).then(r=>setBeds(r.data.beds||[])).catch(()=>{}); }, [wardId, roomId]);
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Beds</h2>
      <div className="bg-white p-4 rounded shadow">
        <ul>
          {beds.map(b=> (
            <li key={b._id} className="p-2 border-b flex justify-between items-center">
              <div>Bed {b.number} — {b.status} {b.patient? `— patient: ${b.patient?.user?.name || b.patient}` : ''}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
