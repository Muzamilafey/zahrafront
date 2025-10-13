import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function WardsList(){
  const { axiosInstance } = useContext(AuthContext);
  const [wards, setWards] = useState([]);
  useEffect(()=>{ axiosInstance.get('/wards').then(r=>setWards(r.data.wards||[])).catch(()=>{}); }, []);
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Wards</h2>
      <div className="bg-white p-4 rounded shadow">
        <ul>
          {wards.map(w=> (
            <li key={w._id} className="p-2 border-b flex justify-between items-center">
              <div>{w.name} — {w.type}</div>
              <div><Link to={`/dashboard/admin/wards/${w._id}/rooms`} className="btn-outline">View Rooms</Link></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
