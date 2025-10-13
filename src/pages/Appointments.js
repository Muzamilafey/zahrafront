import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function Appointments() {
  const { user, axiosInstance } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
    try{
      await axiosInstance.post(`/appointments/${exportAppointmentId}/export-email`, { to: exportRecipient });
      try{ localStorage.setItem('notificationRecipient', exportRecipient); }catch(e){}
      setExportSuccess(true); setTimeout(()=>setExportSuccess(false),2000);
      closeExportModal();
    }catch(e){ console.error(e); setExportError('Failed to send'); setTimeout(()=>setExportError(''),3000); }
    setExportLoading(false);
  };

  const printAppointment = (a) => {
    const w = window.open('', '_blank'); if(!w) return;
    const html = `
      <html><head><title>Appointment${a.appointmentNumber ? ' #' + a.appointmentNumber : ''}</title>
      <style>body{font-family: Arial; padding:20px;} .h{font-weight:700; font-size:18px; margin-bottom:10px;}</style>
      </head><body>
        <div class="h">Appointment${a.appointmentNumber ? ' #' + a.appointmentNumber : ''}</div>
        <div><strong>Doctor:</strong> ${(a.doctor?.user?.name || a.doctor?.name || a.doctor) || '-'}</div>
        <div><strong>Scheduled:</strong> ${new Date(a.scheduledAt).toLocaleString()}</div>
        <div><strong>Status:</strong> ${a.status}</div>
      </body></html>`;
    w.document.write(html); w.document.close(); w.focus(); setTimeout(()=>{ w.print(); w.close(); }, 300);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // fetch both upcoming (not served/expired) and all appointments
        const [allRes, upRes] = await Promise.all([
          axiosInstance.get('/appointments'),
          axiosInstance.get('/appointments?upcoming=true'),
        ]);
        setAppointments(allRes.data.appointments || []);
        setUpcomingAppointments(upRes.data.appointments || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // helper for status colors
  const statusClasses = {
    Pending: "bg-yellow-100 text-yellow-700",
    Confirmed: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
    Completed: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-extrabold mb-6 text-gray-800">Appointments</h2>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* Upcoming appointments section - these are not served/expired (backend enforces) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold">Upcoming Appointments</h2>
          <div className="text-sm text-gray-600">You have <span className="font-semibold">{upcomingAppointments.length}</span> upcoming appointment(s)</div>
        </div>

        {upcomingAppointments.length === 0 && !loading && (
          <p className="text-gray-500">No upcoming appointments.</p>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingAppointments.map((a) => (
            <div key={a._id} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Appointment #{a.appointmentNumber}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses[a.status] || 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
              </div>
              <div className="space-y-2 text-gray-600">
                <p><span className="font-medium text-gray-800">Doctor: </span>{(a.doctor?.user?.name || a.doctor?.name || '-')}</p>
                <p><span className="font-medium text-gray-800">Scheduled: </span>{new Date(a.scheduledAt).toLocaleString()}</p>
                <div className="mt-4 flex items-center gap-2">
                  {user?.role !== 'receptionist' && (
                    <>
                      <button className="btn-outline text-sm" onClick={()=>printAppointment(a)}>Print</button>
                      <button className="btn-primary text-sm" onClick={()=>openExportModal(a._id)}>Export to Email</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All appointments / history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold">All Appointments</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.length === 0 && !loading && (
            <p className="col-span-full text-gray-500">No appointments found.</p>
          )}

          {appointments.map((a) => (
            <div key={a._id} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Appointment #{a.appointmentNumber}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses[a.status] || 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
              </div>
              <div className="space-y-2 text-gray-600">
                <p><span className="font-medium text-gray-800">Doctor: </span>{(a.doctor?.user?.name || a.doctor?.name || '-')}</p>
                <p><span className="font-medium text-gray-800">Scheduled: </span>{new Date(a.scheduledAt).toLocaleString()}</p>
                <div className="mt-4 flex items-center gap-2">
                  {user?.role !== 'receptionist' && (
                    <>
                      <button className="btn-outline text-sm" onClick={()=>printAppointment(a)}>Print</button>
                      <button className="btn-primary text-sm" onClick={()=>openExportModal(a._id)}>Export to Email</button>
                    </>
                  )}
                  {a.status === 'completed' && <div className="text-sm text-green-700 font-semibold">Served</div>}
                  {a.status === 'expired' && <div className="text-sm text-red-700 font-semibold">Expired</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={closeExportModal}>
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="relative bg-white rounded p-4 w-full max-w-md mx-4" onClick={(e)=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Send appointment PDF to (email)</h3>
            <input type="email" className="w-full border rounded p-2 mb-3" placeholder="recipient@example.com" value={exportRecipient} onChange={e=>setExportRecipient(e.target.value)} />
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
            <div className="text-sm text-gray-600">This window will close automatically.</div>
          </div>
        </div>
      )}

      {exportError && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-white border rounded p-4 shadow">
          <div className="w-12 h-12 flex items-center justify-center bg-red-50 rounded-full mr-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 9v4" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 17h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <div className="font-semibold text-sm">{exportError}</div>
          </div>
        </div>
      )}
    </div>
  );
}
