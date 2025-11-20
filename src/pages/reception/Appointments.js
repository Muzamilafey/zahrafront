import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import DataTable from '../../components/ui/DataTable';

export default function ReceptionAppointments(){
  const { axiosInstance, user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportRecipient, setExportRecipient] = useState('');
  const [exportAppointmentId, setExportAppointmentId] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState('');

  useEffect(()=>{ try{ const saved = localStorage.getItem('notificationRecipient'); if (saved) setExportRecipient(saved); }catch(e){} },[]);

  const openExportModal = (id)=>{ setExportAppointmentId(id); setExportModalOpen(true); };
  const closeExportModal = ()=>{ setExportAppointmentId(null); setExportModalOpen(false); };

  const sendExportEmail = async ()=>{
    if (!exportRecipient) { setExportError('Enter recipient'); setTimeout(()=>setExportError(''),3000); return; }
    setExportLoading(true);
    try{ await axiosInstance.post(`/appointments/${exportAppointmentId}/export-email`, { to: exportRecipient }); try{ localStorage.setItem('notificationRecipient', exportRecipient); }catch(e){} setExportSuccess(true); setTimeout(()=>setExportSuccess(false),2000); closeExportModal(); }catch(e){ console.error(e); setExportError('Failed to send'); setTimeout(()=>setExportError(''),3000); }
    setExportLoading(false);
  };

  const printAppointment = (a) => { const w = window.open('', '_blank'); if(!w) return; const html = `<html><head><title>Appointment</title><style>body{font-family:Arial;padding:20px}</style></head><body><h2>Appointment</h2><div><strong>Patient:</strong> ${a.patient || '-'}</div><div><strong>Doctor:</strong> ${a.doctor || '-'}</div><div><strong>Time:</strong> ${a.time}</div></body></html>`; w.document.write(html); w.document.close(); w.focus(); setTimeout(()=>{ w.print(); w.close(); },300); };

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get('/appointments');
  setAppointments((res.data.appointments || []).map(a=>({ id: a._id, time: new Date(a.scheduledAt).toLocaleString(), patient: a.patient?.user?.name || '-', doctor: a.doctor?.user?.name || '-', status: a.status, raw: a })));
      }catch(e){ console.error(e); }
    };
    load();
  },[axiosInstance]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Reception — Appointments</h2>
      <div className="bg-white rounded p-4 shadow">
        <DataTable columns={[{header:'Time',accessor:'time'},{header:'Patient',accessor:'patient'},{header:'Doctor',accessor:'doctor'},{header:'Status',accessor:'status'},{header:'Actions',accessor:'actions'}]} data={appointments.map(a=>({ ...a, actions: (
          user?.role === 'receptionist' ? null : (
            <div className="flex items-center gap-2"><button className="btn-outline text-sm" onClick={()=>printAppointment(a.raw)}>Print</button><button className="btn-primary text-sm" onClick={()=>openExportModal(a.id)}>Export to Email</button></div>
          )
        ) }))} />
      </div>

      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={closeExportModal}>
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="relative bg-white rounded p-4 w-full max-w-md mx-4" onClick={(e)=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Send appointment PDF to (email)</h3>
            <input type="email" className="w-full border rounded p-2 mb-3" placeholder="recipient@example.com" value={exportRecipient} onChange={e=>setExportRecipient(e.target.value)} />
            {exportError && <div className="text-red-500 text-sm mb-2">{exportError}</div>}
            <div className="flex justify-end space-x-2">
              <button className="btn-outline" onClick={closeExportModal} disabled={exportLoading}>Cancel</button>
              <button className="btn-primary" onClick={sendExportEmail} disabled={exportLoading}>{exportLoading? 'Sending...' : 'Send & Save'}</button>
            </div>
          </div>
        </div>
      )}

      {exportSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={()=>setExportSuccess(false)}>
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="relative bg-white rounded p-6 w-full max-w-sm mx-4 text-center" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-center mb-4">
              <div className="w-24 h-24 flex items-center justify-center bg-green-50 rounded-full">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <div className="font-semibold text-lg mb-2">Email sent</div>
          </div>
        </div>
      )}
    </div>
  );
}
