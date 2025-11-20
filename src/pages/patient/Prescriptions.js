import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import DataTable from '../../components/ui/DataTable';

export default function PrescriptionsPage(){
  const { axiosInstance } = useContext(AuthContext);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get('/prescriptions/mine');
        setPrescriptions(res.data.prescriptions || []);
      }catch(e){ console.error(e); }
    };
    load();
  },[axiosInstance]);

  const data = prescriptions.map(p=>({
    num: p.prescriptionNumber || '-',
    doctor: p.appointment?.doctor?.user?.name || '-',
    date: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-',
    summary: p.details ? (p.details.length>100? p.details.slice(0,100)+'...': p.details) : '-',
    raw: p,
  }));

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Prescriptions</h2>
      {prescriptions.length === 0 && <p className="text-gray-500">No prescriptions found.</p>}
      {prescriptions.length > 0 && (
        <DataTable columns={[{header:'#',accessor:'num'},{header:'Doctor',accessor:'doctor'},{header:'Date',accessor:'date'},{header:'Summary',accessor:'summary'},{header:'Actions',accessor:'actions'}]} data={data.map(d=>({...d, actions: (<a className="text-blue-600" href={`#pres-${d.num}`}>View</a>)}))} />
      )}

      {prescriptions.map(p=> (
        <div key={p._id} id={`pres-${p.prescriptionNumber || p._id}`} className="mt-6 bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Prescription #{p.prescriptionNumber || '-'}</h3>
          <div className="text-sm text-gray-600">Prescribed by: {p.appointment?.doctor?.user?.name || '-'} on {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</div>
          <pre className="mt-3 whitespace-pre-wrap">{p.details || '-'}</pre>
        </div>
      ))}
    </div>
  );
}
