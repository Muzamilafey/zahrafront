import React, { useEffect, useState, useContext } from 'react';
import DataTable from '../../components/ui/DataTable';
import { AuthContext } from '../../contexts/AuthContext';

export default function PatientsForMe() {
  const { axiosInstance } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);

  useEffect(()=>{
    const load = async ()=>{
      try {
        const res = await axiosInstance.get('/patients');
        setPatients((res.data.patients || []).map(p => ({ id: p._id, name: p.user?.name, phone: p.user?.phone || '-', createdAt: new Date(p.createdAt).toLocaleString() })));
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Patients Assigned to Me</h2>
      <DataTable columns={[{header:'Name', accessor:'name'},{header:'Phone', accessor:'phone'},{header:'Created', accessor:'createdAt'}]} data={patients} />
    </div>
  );
}
