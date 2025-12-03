import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function QueueView(){
  const { axiosInstance } = useContext(AuthContext);
  const [queueName, setQueueName] = useState('triage');
  const [items, setItems] = useState([]);

  const load = async () => {
    try{
      const res = await axiosInstance.get('/api/opd/queue', { params: { queueName } });
      setItems(res.data.queue || []);
    }catch(err){ console.error(err); }
  };

  useEffect(()=>{ load(); }, [queueName]);

  return (
    <div className="p-4">
      <h2 className="text-xl mb-3">Queue: {queueName}</h2>
      <select className="input mb-3" value={queueName} onChange={e=>setQueueName(e.target.value)}>
        <option value="triage">Triage</option>
        <option value="clinician">Clinician</option>
        <option value="lab">Lab</option>
        <option value="pharmacy">Pharmacy</option>
      </select>
      <div className="space-y-2">
        {items.map(i=> (
          <div key={i._id} className="p-2 border rounded flex justify-between">
            <div>Visit: {i.visit? i.visit._id : i.visit}</div>
            <div>Position: {i.position} — Status: {i.status}</div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <button className="btn" onClick={load}>Refresh</button>
      </div>
    </div>
  );
}
