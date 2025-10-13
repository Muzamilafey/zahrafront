import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function AdminAssignDoctor(){
  const { id } = useParams(); // patient id
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const [doctors, setDoctors] = useState([]);
  const [selected, setSelected] = useState('');

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get('/doctors');
        const docs = res.data.doctors || res.data || [];
        setDoctors(docs);
      }catch(e){ console.error(e); }
    };
    load();
  },[]);

  const save = async ()=>{
    if(!selected) return alert('Select a doctor');
    try{
      await axiosInstance.put(`/patients/${id}/assign`, { doctorId: selected });
      alert('Doctor assigned');
      navigate(`/dashboard/admin/patients/${id}`);
    }catch(e){ console.error(e); alert(e?.response?.data?.message || 'Assign failed'); }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Assign Doctor</h2>
      <div className="bg-white p-4 rounded shadow max-w-lg">
        <label className="block text-sm mb-2">Select Doctor</label>
        <select className="input mb-4 w-full" value={selected} onChange={e=>setSelected(e.target.value)}>
          <option value="">-- Select --</option>
          {doctors.map(d=> (
            <option key={d._id} value={d._id}>{d.user?.name || d.user?.email || 'Doctor'}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button className="btn-brand" onClick={save}>Assign</button>
          <button className="btn-outline" onClick={()=>navigate(-1)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
