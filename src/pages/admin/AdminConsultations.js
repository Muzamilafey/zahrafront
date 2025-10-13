import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import DataTable from '../../components/ui/DataTable';

export default function AdminConsultations(){
  const { axiosInstance } = useContext(AuthContext);
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: 0 });

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignConsultation, setAssignConsultation] = useState(null);
  const [assignSelected, setAssignSelected] = useState([]);

  useEffect(()=>{
    const load = async ()=>{
      try{
        const r = await axiosInstance.get('/consultations');
        setConsultations(r.data.consultations||[]);
        const rd = await axiosInstance.get('/doctors');
        setDoctors(rd.data.doctors||[]);
      }catch(e){console.error(e);} 
    };
    load();
  },[]);

  const create = async ()=>{
    try{
      const res = await axiosInstance.post('/consultations', form);
      setConsultations([res.data.consultation, ...consultations]);
      setForm({ name: '', description: '', price: 0 });
      alert('Consultation created');
    }catch(e){ console.error(e); alert('Failed'); }
  };

  const openAssignModal = (id) => {
    const c = consultations.find(x => x._id === id);
    setAssignConsultation(c);
    setAssignSelected((c?.doctors || []).map(d => (d._id || d)));
    setShowAssignModal(true);
  };

  const toggleDoctor = (docId) => {
    setAssignSelected(prev => prev.includes(docId) ? prev.filter(d=>d!==docId) : [...prev, docId]);
  };

  const saveAssign = async () => {
    if (!assignConsultation) return;
    try{
      const res = await axiosInstance.post(`/consultations/${assignConsultation._id}/assign`, { doctors: assignSelected });
      setConsultations(consultations.map(c => c._id === assignConsultation._id ? res.data.consultation : c));
      setShowAssignModal(false);
      setAssignConsultation(null);
      setAssignSelected([]);
      alert('Assigned successfully');
    }catch(e){ console.error(e); alert('Failed to assign'); }
  };

  const data = consultations.map(c=>({
    name: c.name,
    description: (c.description||'-').length>80?(c.description||'-').slice(0,80)+'...':(c.description||'-'),
    price: c.price?`KES ${c.price}`:'Free',
    doctors: (c.doctors||[]).map(d=>d.user?.name||d.user?.email||d._id).join(', '),
    actions: (<div><button className="btn-brand mr-2" onClick={()=>openAssignModal(c._id)}>Assign Doctors</button></div>)
  }));

  return (
    <div className="p-6">
  <h2 className="text-2xl font-bold mt-0 mb-0 text-brand-700">Consultation Services</h2>
      <div className="mb-4 text-sm text-gray-600">Manage available booking times in <a className="text-brand-600 underline" href="/dashboard/admin/slots">Available Slots</a></div>
      <div className="bg-white rounded p-4 shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Name" className="border p-2 rounded" />
          <input value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="Price" className="border p-2 rounded" />
          <input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Description" className="border p-2 rounded" />
          <div><button className="btn-brand" onClick={create}>Create</button></div>
        </div>
      </div>

      <div className="bg-white rounded p-4 shadow">
        <DataTable columns={[{header:'Name',accessor:'name'},{header:'Description',accessor:'description'},{header:'Price',accessor:'price'},{header:'Doctors',accessor:'doctors'},{header:'Actions',accessor:'actions'}]} data={data} />
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Assign Doctors to: {assignConsultation?.name}</h3>
              <button className="text-gray-600" onClick={() => { setShowAssignModal(false); setAssignConsultation(null); setAssignSelected([]); }}>✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto mb-4">
              {doctors.map(d => (
                <label key={d._id} className="flex items-center gap-2 p-2 border rounded">
                  <input type="checkbox" checked={assignSelected.includes(d._id)} onChange={()=>toggleDoctor(d._id)} />
                  <div>
                    <div className="font-medium">{d.user?.name || d.user?.email || d._id}</div>
                    <div className="text-xs text-gray-500">{(d.specialties||[]).join(', ')}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => { setShowAssignModal(false); setAssignConsultation(null); setAssignSelected([]); }}>Cancel</button>
              <button className="btn-brand" onClick={saveAssign}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
