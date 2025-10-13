import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import DataTable from '../../components/ui/DataTable';
import { useNavigate } from 'react-router-dom';

export default function AdminPatients(){
  const { axiosInstance } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get('/patients');
        setPatients(res.data.patients || []);
      }catch(e){ console.error(e); }
      finally{ setLoading(false); }
    };
    load();
  },[]);

  const navigate = useNavigate();

  const viewPatient = (id) => {
    // navigate to patient detail page
    navigate(`/dashboard/admin/patients/${id}`);
  };

  const columns = [
    { header: '', accessor: 'avatar' },
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Hospital ID', accessor: 'hospitalId' },
    { header: 'Created', accessor: 'createdAt' },
    { header: 'Actions', accessor: 'actions' },
  ];

  const data = patients.map(p=>({
    avatar: (<div className="w-8 h-8 rounded overflow-hidden bg-gray-100">
      {p.logo ? <img src={`${process.env.REACT_APP_API_BASE?.replace('/api','') || ''}${p.logo}`} alt="logo" className="w-full h-full object-cover" /> : <div className="text-xs text-gray-400">N/A</div>}
    </div>),
    name: p.user?.name || '-',
    email: p.user?.email || '-',
    hospitalId: p.hospitalId || '-',
    createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-',
    actions: (<div>
      <button className="btn-brand mr-2" onClick={()=>viewPatient(p._id)}>View</button>
    </div>)
  }));

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-brand-700">Patients</h2>
      <div className="bg-white rounded p-4 shadow">
        {loading ? <div className="text-sm text-gray-500">Loading...</div> : <DataTable columns={columns} data={data} /> }
      </div>
    </div>
  );
}
