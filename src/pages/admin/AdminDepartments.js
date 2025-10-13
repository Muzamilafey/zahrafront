import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import DataTable from '../../components/ui/DataTable';

export default function AdminDepartments(){
  const { axiosInstance } = useContext(AuthContext);
  const [deps, setDeps] = useState([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeDept, setActiveDept] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get('/departments');
        setDeps(res.data.departments || []);
      }catch(e){ console.error(e); }
    };
    load();
  },[]);

  const create = async ()=>{
    try{
      await axiosInstance.post('/departments', { name, description: desc });
      setName(''); setDesc('');
      const res = await axiosInstance.get('/departments');
      setDeps(res.data.departments || []);
    }catch(e){ console.error(e); alert('Create failed'); }
  };

  const assign = (id) => {
    setActiveDept(id);
    setSelectedDoctor('');
    setShowAssignModal(true);
  };

  // load doctors when modal opens
  useEffect(()=>{
    if(!showAssignModal) return;
    const load = async ()=>{
      try{
        const res = await axiosInstance.get('/doctors');
        const docs = res.data?.doctors || res.data || [];
        setDoctors(docs);
      }catch(e){ console.error(e); }
    };
    load();
  }, [showAssignModal]);

  const submitAssign = async ()=>{
    if(!selectedDoctor) return alert('Select a doctor');
    try{
      await axiosInstance.post(`/departments/${activeDept}/doctors`, { doctorId: selectedDoctor });
      const res = await axiosInstance.get('/departments');
      setDeps(res.data.departments || []);
      setShowAssignModal(false);
    }catch(e){ console.error(e); alert('Assign failed'); }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Doctors', accessor: 'doctors' },
    { header: 'Actions', accessor: 'actions' },
  ];

  const data = deps.map(d=>({ name: d.name, doctors: (d.doctors||[]).map(x=>x.user?.name || x._id).join(', '), actions: (<div><button className="btn-brand mr-2" onClick={()=>assign(d._id)}>Assign Doctor</button></div>) }));

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-brand-700">Departments</h2>
      <div className="bg-white rounded p-4 shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="input" placeholder="Department name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="input" placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} />
          <button className="btn-brand" onClick={create}>Create</button>
        </div>
      </div>

      <div className="bg-white rounded p-4 shadow">
        <DataTable columns={columns} data={data} />
      </div>
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-3">Assign Doctor</h3>
            <label className="block text-sm mb-2">Doctor</label>
            <select className="input mb-4 w-full" value={selectedDoctor} onChange={e=>setSelectedDoctor(e.target.value)}>
              <option value="">-- Select --</option>
              {doctors.map(d=>(<option key={d._id} value={d._id}>{d.user?.name || d.user?.email || 'Doctor'}</option>))}
            </select>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={()=>setShowAssignModal(false)}>Cancel</button>
              <button className="btn-brand" onClick={submitAssign}>Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
