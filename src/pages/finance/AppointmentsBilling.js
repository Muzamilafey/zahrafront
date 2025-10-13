import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import DataTable from '../../components/ui/DataTable';

export default function AppointmentsBilling(){
  const { axiosInstance } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [invoiceMap, setInvoiceMap] = useState({});

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get('/appointments');
        setAppointments(res.data.appointments || []);
        // also load invoices and map them to appointments
        const invRes = await axiosInstance.get('/billing');
  const invs = invRes.data.invoices || [];
  const map = {};
  invs.forEach(i=>{ if(i.appointment) map[String(i.appointment)] = true; });
  setInvoiceMap(map);
      }catch(e){ console.error(e); }
    };
    load();
  },[]);

  const createInvoice = async (id)=>{
    try{
      // simple prompt for amount
      const amount = parseFloat(prompt('Enter invoice amount')); if (!amount) return;
      await axiosInstance.post('/billing', { appointmentId: id, amount, type: 'treatment' });
      alert('Invoice created');
      // refresh list
      const invRes = await axiosInstance.get('/billing');
  const invs = invRes.data.invoices || [];
  const map = {};
  invs.forEach(i=>{ if(i.appointment) map[String(i.appointment)] = true; });
  setInvoiceMap(map);
    }catch(e){ console.error(e); alert('Failed to create'); }
  };

  const data = appointments.map(a=>({
    when: new Date(a.scheduledAt).toLocaleString(),
    patient: a.patient?.user?.name || '-',
    doctor: a.doctor?.user?.name || '-',
    status: a.status,
    actions: (
      invoiceMap[String(a._id)] || a.status === 'expired' ? (
        <button className="btn-disabled" disabled>{invoiceMap[String(a._id)] ? 'Invoiced' : 'Expired'}</button>
      ) : (
        <button className="btn-brand" onClick={()=>createInvoice(a._id)}>Create Invoice</button>
      )
    )
  }));

  return (
    <div className="p-6">
  <h2 className="text-2xl font-bold mt-0 mb-0">Appointments Billing</h2>
      <div className="bg-white rounded p-4 shadow">
        <DataTable columns={[{header:'When',accessor:'when'},{header:'Patient',accessor:'patient'},{header:'Doctor',accessor:'doctor'},{header:'Status',accessor:'status'},{header:'Actions',accessor:'actions'}]} data={data} />
      </div>
    </div>
  );
}
