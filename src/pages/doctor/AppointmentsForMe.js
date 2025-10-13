import React, { useEffect, useState, useContext } from 'react';
import DataTable from '../../components/ui/DataTable';
import { AuthContext } from '../../contexts/AuthContext';

export default function AppointmentsForMe() {
  const { axiosInstance } = useContext(AuthContext);
  const [appts, setAppts] = useState([]);

  useEffect(()=>{
    const load = async ()=>{
      try {
        const res = await axiosInstance.get('/appointments');
        setAppts((res.data.appointments || []).map(a=>({ id: a._id, time: new Date(a.scheduledAt).toLocaleString(), patient: a.patient?.user?.name || 'Unknown', status: a.status })));
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Appointments Booked with Me</h2>
      <DataTable columns={[{header:'Time',accessor:'time'},{header:'Patient',accessor:'patient'},{header:'Status',accessor:'status'}]} data={appts} />
    </div>
  );
}
