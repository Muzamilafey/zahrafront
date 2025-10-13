import React, { useState, useEffect, useContext, useMemo } from 'react';
// Sidebar and Topbar are handled by the global Layout
import DataTable from '../ui/DataTable';
import SimpleChart from '../ui/SimpleChart';
import { AuthContext } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';

export default function DoctorDashboard() {
  const [notes, setNotes] = useState('');
  const [prescriptionText, setPrescriptionText] = useState('');
  const [selectedAppt, setSelectedAppt] = useState('');
  const [activeTab, setActiveTab] = useState('appointments');
  const [profile, setProfile] = useState({ specialization: '', phone: '', bio: '' });
  const [invoices, setInvoices] = useState([]);
  const [patientDetails, setPatientDetails] = useState(null);
  const [labRequestText, setLabRequestText] = useState('');
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [myLabRequests, setMyLabRequests] = useState([]);
  const [labPatientForRequest, setLabPatientForRequest] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState('');
  const [labAmount, setLabAmount] = useState('');
  const [reagentsList, setReagentsList] = useState([]);
  const [selectedReagents, setSelectedReagents] = useState([]); // [{ itemId, qty }]
  const [reagentSelect, setReagentSelect] = useState('');
  const [reagentQtyInput, setReagentQtyInput] = useState('');

  const [assignNurseModalOpen, setAssignNurseModalOpen] = useState(false);
  const [selectedPatientForNurse, setSelectedPatientForNurse] = useState(null);
  const [nursesList, setNursesList] = useState([]);
  const [selectedNurse, setSelectedNurse] = useState('');
  const [savingConsult, setSavingConsult] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleApptId, setRescheduleApptId] = useState(null);
  const [rescheduleDateValue, setRescheduleDateValue] = useState('');

  const apptColumns = [
    { header: 'Time', accessor: 'time' },
    { header: 'Patient', accessor: 'patient' },
    { header: 'Reason', accessor: 'reason' },
    { header: 'Status', accessor: 'status' },
    { header: 'Actions', accessor: 'actions' },
  ];

  const [upcoming, setUpcoming] = useState([]);
  const [appointmentsRaw, setAppointmentsRaw] = useState([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [assigned, setAssigned] = useState([]);
  const [rawAssignedPatients, setRawAssignedPatients] = useState([]);
  const [periodDays, setPeriodDays] = useState(7);
  const { axiosInstance, user, logout } = useContext(AuthContext);
  const [availability, setAvailability] = useState({ available: true, message: '' });
  const [availLoading, setAvailLoading] = useState(false);
  const [availSuccess, setAvailSuccess] = useState(false);
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

  const printAppointment = (a) => { const w = window.open('', '_blank'); if(!w) return; const html = `<html><head><title>Appointment</title><style>body{font-family:Arial;padding:20px}</style></head><body><h2>Appointment</h2><div><strong>Patient:</strong> ${a.patient?.user?.name || a.patient || '-'}</div><div><strong>Scheduled:</strong> ${new Date(a.raw?.scheduledAt || a.scheduledAt).toLocaleString()}</div></body></html>`; w.document.write(html); w.document.close(); w.focus(); setTimeout(()=>{ w.print(); w.close(); },300); };

  const loadAppointments = async () => {
    try {
      // fetch both all appointments (for analytics/history) and upcoming (for actions)
      const allRes = await axiosInstance.get('/appointments');
      const upRes = await axiosInstance.get('/appointments?upcoming=true');
      const appts = allRes.data.appointments || [];
      const upAppts = upRes.data.appointments || [];
      setAppointmentsRaw(appts);
      setUpcoming(upAppts.map(a=>({ 
        id: a._id,
        time: new Date(a.scheduledAt).toLocaleString(),
        patient: a.patient?.user?.name || 'Unknown',
        reason: a.reason || a.status,
        status: a.status || '-',
        raw: a,
        actions: (
            <div>
              {a.status === 'requested' ? (
                <>
                  <button className="btn-brand mr-2" onClick={()=>approveAppointment(a._id)} disabled={a.status === 'completed'}>Approve</button>
                  <button className="btn-outline" onClick={()=>declineAppointment(a._id)} disabled={a.status === 'completed'}>Decline</button>
                </>
              ) : ('-')}
            </div>
          ),
      })));
      // only count non-expired, non-completed upcoming appts
      setUpcomingCount((upAppts || []).filter(a => !['completed','cancelled','expired'].includes(a.status)).length);
    } catch (err) { console.error(err); }
  };

  const loadMyLabRequests = async () => {
    try {
      const res = await axiosInstance.get('/labs/my-requests');
      setMyLabRequests(res.data.orders || res.data.orders || []);
    } catch (e) { console.error('Failed to load my lab requests', e); }
  };

  const loadProfile = async () => {
    try {
      const res = await axiosInstance.get('/doctors/me');
      const d = res.data.doctor || res.data;
      if (d) setProfile({ specialization: d.specialty || d.specialization || '', phone: d.phone || '', bio: d.bio || '' });
    } catch (e) { /* endpoint may not exist, ignore */ }
  };

  const loadInvoices = async () => {
    try {
      const r = await axiosInstance.get('/billing');
      setInvoices(r.data.invoices || []);
    } catch (e) { console.error('Failed to load invoices', e); }
  };

  const approveAppointment = async (id) => {
    try{
      await axiosInstance.put(`/appointments/${id}`, { status: 'confirmed' });
      await loadAppointments();
    }catch(e){ console.error(e); alert(e?.response?.data?.message || 'Failed to approve'); }
  };

  const declineAppointment = async (id) => {
    try{
      await axiosInstance.put(`/appointments/${id}`, { status: 'cancelled' });
      await loadAppointments();
    }catch(e){ console.error(e); alert(e?.response?.data?.message || 'Failed to decline'); }
  };

  useEffect(()=>{
    const load = async ()=>{
      try {
        await loadAppointments();

        // Assigned patients: fetch patients if endpoint exists
        const pRes = await axiosInstance.get('/patients');
        const raw = pRes.data.patients || [];
        setRawAssignedPatients(raw);
        setAssigned(raw.map(p=>({ 
          name: p.user?.name, 
          room: p.admission?.ward || '-', 
          lastVisit: p.updatedAt || '-',
          patientId: p._id,
              actions: (
            <div className="flex items-center gap-2">
              <button className="btn-modern" onClick={()=>viewPatient(p._id)}>View</button>
              <button className="btn-modern-primary" onClick={()=>startConsultationForPatient(p._id)} disabled={(findNextApptForPatient(p._id)?.status === 'completed')}>Start</button>
              <button className="btn-modern" onClick={()=>prescribeForPatient(p._id)} disabled={(findNextApptForPatient(p._id)?.status === 'completed')}>Prescribe</button>
              <button className="btn-modern" onClick={()=>requestLabForPatient(p._id)} disabled={(findNextApptForPatient(p._id)?.status === 'completed')}>Lab</button>
              <button className="btn-modern" onClick={()=>invoiceForPatient(p._id)} disabled={(findNextApptForPatient(p._id)?.status === 'completed')}>Invoice</button>
              <button className="btn-modern" onClick={()=> openRescheduleModal(findNextApptForPatient(p._id)?._id, findNextApptForPatient(p._id)?.scheduledAt)} disabled={(findNextApptForPatient(p._id)?.status === 'completed')}>Reschedule</button>
            </div>
          )
        })));

        // load current availability for doctor
        try{
          const ar = await axiosInstance.get('/doctor-availability/me');
          setAvailability({ available: ar.data.availability.available, message: ar.data.availability.message || '' });
        }catch(e){ /* ignore */ }

        // attempt to load profile and invoices
        await Promise.all([loadProfile(), loadInvoices()]);
  // load doctor's own lab requests
  await loadMyLabRequests();

        // no doctor selection needed — prescriptions are created by the logged-in doctor
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  // derive admitted patients assigned to this doctor
  const myAdmittedPatients = React.useMemo(() => {
    try{
      return (rawAssignedPatients || []).filter(p => p.admission && p.admission.isAdmitted);
    }catch(e){ return []; }
  }, [rawAssignedPatients]);

  const saveAvailability = async () => {
    setAvailLoading(true);
    try{
      const res = await axiosInstance.put('/doctor-availability/me', { available: availability.available, message: availability.message });
      setAvailability({ available: res.data.availability.available, message: res.data.availability.message || '' });
      setAvailSuccess(true);
      setTimeout(()=>setAvailSuccess(false),2000);
    }catch(e){ console.error(e); alert('Failed to update availability'); }
    setAvailLoading(false);
  };

  // compute a series for the chart based on appointmentsRaw and the selected period
  const { dailySeries, labels } = useMemo(() => {
    const days = Array.from({ length: periodDays }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (periodDays - 1 - i));
      d.setHours(0,0,0,0);
      return d;
    });
    const counts = days.map(_ => 0);
    (appointmentsRaw || []).forEach(appt => {
      const sa = new Date(appt.scheduledAt);
      for (let i = 0; i < days.length; i++) {
        const start = days[i];
        const end = new Date(start); end.setHours(23,59,59,999);
        if (sa >= start && sa <= end) {
          counts[i] = (counts[i] || 0) + 1;
          break;
        }
      }
    });
    const labels = days.map(d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    return { dailySeries: counts, labels };
  }, [appointmentsRaw, periodDays]);

  const savePrescription = async (e) => {
    e.preventDefault();
    try{
      if(!selectedAppt) return alert('Select an appointment');
      // Send appointmentId and details to backend
      await axiosInstance.post('/prescriptions', { appointmentId: selectedAppt, details: prescriptionText, drugs: [] });
      alert('Prescription saved');
      setPrescriptionText('');
      setSelectedAppt('');
      await loadAppointments();
    }catch(e){ console.error(e); alert(e?.response?.data?.message || 'Save failed'); }
  };

  // Save doctor profile (best-effort endpoint)
  const saveProfile = async () => {
    try {
      const res = await axiosInstance.put('/doctors/me', profile);
      alert('Profile updated');
      if (res.data.doctor) setProfile({ specialization: res.data.doctor.specialty || res.data.doctor.specialization || '', phone: res.data.doctor.phone || '', bio: res.data.doctor.bio || '' });
    } catch (e) { console.error(e); alert('Failed to update profile'); }
  };

  // Reschedule appointment
  const rescheduleAppointment = async (id, newDateIso) => {
    try {
      await axiosInstance.put(`/appointments/${id}`, { scheduledAt: newDateIso });
      await loadAppointments();
      alert('Rescheduled');
    } catch (e) { console.error(e); alert('Failed to reschedule'); }
  };

  const openRescheduleModal = (id, currentDate) => {
    setRescheduleApptId(id);
    // default to current appointment date if provided
    setRescheduleDateValue(currentDate ? new Date(currentDate).toISOString().slice(0,16) : '');
    setShowRescheduleModal(true);
  };

  const closeRescheduleModal = () => {
    setShowRescheduleModal(false);
    setRescheduleApptId(null);
    setRescheduleDateValue('');
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleApptId || !rescheduleDateValue) return alert('Please enter a new date and time');
    const iso = new Date(rescheduleDateValue).toISOString();
    await rescheduleAppointment(rescheduleApptId, iso);
    closeRescheduleModal();
  };

  const markStatus = async (id, status) => {
    try{
      await axiosInstance.put(`/appointments/${id}`, { status });
      await loadAppointments();
    }catch(e){ console.error(e); alert('Failed to update status'); }
  };

  // Save consultation notes/diagnosis (best-effort API)
  const saveConsultation = async (appointmentId, notesText, diagnosis) => {
    setSavingConsult(true);
    try{
      await axiosInstance.post('/consultations', { appointmentId, notes: notesText, diagnosis });
      alert('Consultation saved');
      await loadAppointments();
    }catch(e){ console.error(e); alert('Save failed'); }
    setSavingConsult(false);
  };

  // Request lab
  const requestLab = async (appointmentId) => {
    // open modal for lab request
    setLabPatientForRequest(appointmentId);
    setLabModalOpen(true);
  };

  const viewPatient = async (patientId) => {
    try{
      const r = await axiosInstance.get(`/patients/${patientId}`);
      setPatientDetails(r.data.patient || r.data);
    }catch(e){ console.error(e); alert('Failed to load patient details'); }
  };

  // helper: find next upcoming appointment for a patient
  const findNextApptForPatient = (patientId) => {
    if (!patientId) return null;
    const now = Date.now();
    // consider only appointments that are not completed/cancelled/expired
    const candidates = (appointmentsRaw || []).filter(a => {
      const pid = a.patient?._id || a.patient?.user?._id;
      const statusOk = !['completed','cancelled','expired'].includes(a.status);
      return pid === patientId && statusOk && new Date(a.scheduledAt).getTime() >= now;
    }).sort((a,b)=> new Date(a.scheduledAt) - new Date(b.scheduledAt));
    return candidates.length ? candidates[0] : null;
  };

  const startConsultationForPatient = async (patientId) => {
    const appt = findNextApptForPatient(patientId);
    if (!appt) return alert('No upcoming appointment found for this patient');
    await markStatus(appt._id, 'ongoing');
  };

  const prescribeForPatient = (patientId) => {
    const appt = findNextApptForPatient(patientId);
    if (!appt) return alert('No upcoming appointment to prescribe for');
    setSelectedAppt(appt._id);
    setActiveTab('prescriptions');
  };

  const requestLabForPatient = async (patientId) => {
    const appt = findNextApptForPatient(patientId);
    if (!appt) return alert('No upcoming appointment to request lab for');
  setLabPatientForRequest(appt._id);
    setLabModalOpen(true);
  };

  const fetchTechnicians = async () => {
    try{
      const res = await axiosInstance.get('/labs/technicians');
      setTechnicians(res.data.technicians || []);
    }catch(e){ console.error(e); }
  };

  const fetchReagents = async () => {
    try{
      const res = await axiosInstance.get('/labs/reagents');
      setReagentsList(res.data.reagents || []);
    }catch(e){ console.error('Failed to load reagents', e); }
  };

  const submitLabRequest = async () => {
    if (!labPatientForRequest) return alert('No appointment selected');
    if (!labRequestText) return alert('Enter lab details');
    try{
      if (technicians.length === 0) await fetchTechnicians();
      // validate reagents quantities
      if (Array.isArray(selectedReagents)) {
        for (const r of selectedReagents) {
          const it = reagentsList.find(i => String(i._id) === String(r.itemId));
          if (!it) return alert('Selected reagent not found');
          if ((Number(r.qty) || 0) <= 0) return alert('Enter valid reagent quantity');
          if ((Number(r.qty) || 0) > (Number(it.quantity) || 0)) return alert(`Selected qty for ${it.name} exceeds available stock (${it.quantity})`);
        }
      }
      await axiosInstance.post('/labs/requests', { appointmentId: labPatientForRequest, details: labRequestText, testType: labRequestText, assignedTo: selectedTech || null, amount: Number(labAmount) || 0, reagents: selectedReagents });
      setLabModalOpen(false);
      setLabRequestText('');
      setSelectedTech('');
      setLabAmount('');
      setSelectedReagents([]);
      await loadAppointments();
      await loadMyLabRequests();
    }catch(e){ console.error(e); alert('Failed to send lab request'); }
  };

  const cancelLabRequest = async (id) => {
    if (!window.confirm('Cancel this lab request?')) return;
    try {
      await axiosInstance.put(`/labs/${id}/cancel`);
      await loadMyLabRequests();
      await loadAppointments();
    } catch (e) { console.error(e); alert('Failed to cancel'); }
  };

  // Assign nurse modal
  const openAssignNurse = async (patientId) => {
    setSelectedPatientForNurse(patientId);
    setAssignNurseModalOpen(true);
    try{
      const res = await axiosInstance.get('/nurses/list');
      setNursesList(res.data.nurses || []);
    }catch(e){ console.error(e); }
  };

  const submitAssignNurse = async () => {
    if (!selectedPatientForNurse || !selectedNurse) return alert('Select a nurse');
    try{
      await axiosInstance.put(`/nurses/assign/${selectedPatientForNurse}`, { nurseId: selectedNurse });
      setAssignNurseModalOpen(false);
      setSelectedNurse('');
      // refresh appointments and assigned patients view
      await loadAppointments();
      try{
        const pRes = await axiosInstance.get('/patients');
        setAssigned(pRes.data.patients.map(p=>({ 
          name: p.user?.name, 
          room: p.admission?.ward || '-', 
          lastVisit: p.updatedAt || '-',
          patientId: p._id,
          actions: (
            <div className="flex items-center gap-2">
              <button className="btn-modern" onClick={()=>viewPatient(p._id)}>View</button>
              <button className="btn-modern-primary" onClick={()=>startConsultationForPatient(p._id)} disabled={(findNextApptForPatient(p._id)?.status === 'completed')}>Start</button>
              <button className="btn-modern" onClick={()=>prescribeForPatient(p._id)} disabled={(findNextApptForPatient(p._id)?.status === 'completed')}>Prescribe</button>
              <button className="btn-modern" onClick={()=>requestLabForPatient(p._id)} disabled={(findNextApptForPatient(p._id)?.status === 'completed')}>Lab</button>
              <button className="btn-modern" onClick={()=>invoiceForPatient(p._id)} disabled={(findNextApptForPatient(p._id)?.status === 'completed')}>Invoice</button>
              <button className="btn-modern" onClick={()=> openRescheduleModal(findNextApptForPatient(p._id)?._id, findNextApptForPatient(p._id)?.scheduledAt)} disabled={(findNextApptForPatient(p._id)?.status === 'completed')}>Reschedule</button>
            </div>
          )
        })));
      }catch(e){ /* ignore refresh errors */ }
    }catch(e){ console.error(e); alert('Failed to assign nurse'); }
  };

  const invoiceForPatient = async (patientId) => {
    const appt = findNextApptForPatient(patientId);
    if (!appt) return alert('No upcoming appointment to invoice');
    const amountStr = window.prompt('Enter invoice amount:');
    const amount = Number(amountStr);
    if (!amount || Number.isNaN(amount)) return alert('Invalid amount');
    try{
      await axiosInstance.post('/billing', { appointmentId: appt._id, amount });
      alert('Invoice created');
      await loadInvoices();
    }catch(e){ console.error(e); alert('Failed to create invoice'); }
  };

  // analytics: patients seen and revenue
  const patientsSeenCount = useMemo(()=> (appointmentsRaw||[]).filter(a=>a.status === 'completed').length, [appointmentsRaw]);
  const revenueTotal = useMemo(()=> (invoices||[]).reduce((s,i)=>s + (i.amount||0), 0), [invoices]);

  return (
    <>
      <div className="flex items-center justify-between mt-0 mb-0">
        <h1 className="text-2xl font-bold mt-0 mb-0">Doctor Dashboard</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="text-sm text-gray-600">{user?.name}</div>
          <button className="btn-outline" onClick={logout}>Logout</button>
        </div>
      </div>

  <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {['appointments','profile','schedule','patients','consultations','prescriptions','billing','analytics','messages'].map(t=> (
            <button key={t} className={`text-sm px-3 py-1 rounded ${activeTab===t? 'bg-brand-600 text-white':'bg-gray-100'}`} onClick={()=>setActiveTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* Appointments tab */}
      {activeTab === 'appointments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 bg-white rounded p-4 shadow">
            <h3 className="font-semibold mb-2">Upcoming Appointments</h3>
            <div className="mb-3">
              <div className="inline-block px-3 py-2 bg-blue-50 text-blue-800 rounded">Upcoming to Attend: <span className="font-bold">{upcomingCount}</span></div>
              <div className="inline-block ml-3 px-3 py-2 bg-green-50 text-green-800 rounded">My Admitted Patients: <span className="font-bold">{myAdmittedPatients.length}</span></div>
            </div>
            {myAdmittedPatients.length > 0 && (
              <div className="mb-3">
                <div className="text-sm font-medium mb-1">Admitted patients (quick view)</div>
                <div className="space-y-1 text-sm">
                  {myAdmittedPatients.slice(0,5).map(p => (
                    <div key={p._id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div>
                        <div className="font-medium">{p.user?.name || '-'}</div>
                        <div className="text-xs text-gray-500">{p.admission?.ward || '-'} • {p.admission?.room || '-'} • Bed {p.admission?.bed || '-'}</div>
                      </div>
                      <div>
                        <button className="btn-modern" onClick={() => viewPatient(p._id)}>View</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <DataTable
              columns={apptColumns}
              data={upcoming.map(u => ({
                ...u,
                actions: (
                  <div>
                        {u.raw?.status === 'requested' && (
                          <>
                            <button className="btn-modern-primary mr-2" onClick={() => approveAppointment(u.id)} disabled={u.raw?.status === 'completed'}>Approve</button>
                            <button className="btn-modern-outline" onClick={() => declineAppointment(u.id)} disabled={u.raw?.status === 'completed'}>Decline</button>
                          </>
                        )}
              <button className="btn-modern text-xs ml-2" onClick={() => openRescheduleModal(u.raw?._id || u.id, u.raw?.scheduledAt)} disabled={u.raw?.status === 'completed'}>Reschedule</button>
              <button className="btn-modern text-xs ml-2" onClick={() => markStatus(u.id, 'ongoing')} disabled={u.raw?.status === 'completed'}>Start</button>
              <button className="btn-modern text-xs ml-2" onClick={() => markStatus(u.id, 'completed')} disabled={u.raw?.status === 'completed'}>Complete</button>
              <button className="btn-modern text-xs ml-2" onClick={() => viewPatient(u.raw?.patient?._id)}>Patient</button>
                  </div>
                )
              }))}
            />
          </div>

          <div className="bg-white rounded p-4 shadow">
            <div className="mb-3">
              <h4 className="font-medium">Availability</h4>
              <div className="mt-2 flex items-center gap-3">
                {/* Custom sun/moon toggle */}
                <div
                  role="switch"
                  aria-checked={availability.available}
                  onClick={() => setAvailability(prev => ({ ...prev, available: !prev.available }))}
                  title={availability.available ? '' : ' '}
                  className="cursor-pointer select-none"
                  style={{
                    width: 160,
                    height: 56,
                    borderRadius: 9999,
                    padding: 6,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    background: availability.available ? 'linear-gradient(90deg,#7dd3fc,#60a5fa)' : 'linear-gradient(90deg,#0f172a,#111827)'
                  }}
                >
                  {/* left label */}
                  <div style={{ position: 'absolute', left: 18, pointerEvents: 'none', color: availability.available ? '#052f5f' : '#94a3b8', fontSize: 13, fontWeight: 600 }}>
                    
                  </div>
                  {/* right label */}
                  <div style={{ position: 'absolute', right: 18, pointerEvents: 'none', color: availability.available ? '#c7f0ff' : '#cbd5e1', fontSize: 13, fontWeight: 600 }}>
                     
                  </div>

                  {/* sliding knob */}
                  <div style={{
                    position: 'absolute',
                    top: 6,
                    left: availability.available ? 6 : 160 - 6 - 44,
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 6px 14px rgba(0,0,0,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'left .22s cubic-bezier(.2,.9,.3,1)'
                  }}>
                    {availability.available ? (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="5" fill="#F59E0B" />
                        <g stroke="#F59E0B" strokeWidth="1" strokeLinecap="round">
                          <path d="M12 2v2" />
                          <path d="M12 20v2" />
                          <path d="M4.93 4.93l1.41 1.41" />
                          <path d="M17.66 17.66l1.41 1.41" />
                          <path d="M2 12h2" />
                          <path d="M20 12h2" />
                          <path d="M4.93 19.07l1.41-1.41" />
                          <path d="M17.66 6.34l1.41-1.41" />
                        </g>
                      </svg>
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#E6EEF8"/>
                        <path d="M21 12.79A9 9 0 1111.21 3" stroke="#94A3B8" strokeWidth="0"/>
                      </svg>
                    )}
                  </div>
                </div>

                {/* visible availability text */}
                <div className={`text-sm font-semibold ${availability.available ? 'text-green-600' : 'text-red-500'}`}>{availability.available ? 'Available' : 'Not available'}</div>

                {/* spacer to push save button to the right */}
                <div className="flex-1" />
                <button className="btn-modern-primary" onClick={saveAvailability} disabled={availLoading}>{availLoading? 'Saving...' : 'Save'}</button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Daily Appointments</h3>
              <div>
                <select className="input text-sm" value={periodDays} onChange={e=>setPeriodDays(Number(e.target.value))}>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
            </div>
            <SimpleChart data={dailySeries} labels={labels} height={120} />
          </div>
        </div>
      )}

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded p-4 shadow mb-4">
          <h3 className="font-semibold mb-2">Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Specialization</label>
              <input className="input" value={profile.specialization} onChange={e=>setProfile(prev=>({...prev, specialization: e.target.value}))} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Phone</label>
              <input className="input" value={profile.phone} onChange={e=>setProfile(prev=>({...prev, phone: e.target.value}))} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Bio</label>
              <textarea className="input h-24" value={profile.bio} onChange={e=>setProfile(prev=>({...prev, bio: e.target.value}))} />
            </div>
          </div>
          <div className="mt-3 text-right"><button className="btn-brand" onClick={saveProfile}>Save Profile</button></div>
        </div>
      )}

      {/* Patients tab */}
      {activeTab === 'patients' && (
        <div>
          <div className="bg-white rounded p-4 shadow mb-4">
            <h3 className="font-semibold">Assigned Patients</h3>
            <DataTable columns={[{header:'Name',accessor:'name'},{header:'Room',accessor:'room'},{header:'Last Visit',accessor:'lastVisit'},{header:'Actions',accessor:'actions'}]} data={assigned} />
          </div>
          {patientDetails && (
            <div className="bg-white rounded p-4 shadow">
              <h3 className="font-semibold">Patient Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-gray-500">Name</div>
                  <div className="font-medium">{patientDetails.user?.name}</div>
                  <div className="text-sm text-gray-500">DOB</div>
                  <div>{patientDetails.user?.birthdate}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Contact</div>
                  <div className="font-medium">{patientDetails.user?.email} / {patientDetails.user?.phone}</div>
                  <div className="text-sm text-gray-500 mt-2">Allergies / Conditions</div>
                  <div>{(patientDetails.allergies||[]).join(', ') || 'None'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Consultations tab */}
      {activeTab === 'consultations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded p-4 shadow">
            <h3 className="font-semibold mb-2">Create Consultation Note</h3>
            <label className="text-sm text-gray-600">Select Appointment</label>
            <select className="input mb-2" value={selectedAppt} onChange={e=>setSelectedAppt(e.target.value)}>
              <option value="">-- Select appointment --</option>
              {upcoming.map(a=> (<option key={a.id} value={a.id}>{a.time} — {a.patient}</option>))}
            </select>
            <label className="text-sm text-gray-600">Notes / Diagnosis</label>
            <textarea className="input h-28 mb-2" value={notes} onChange={e=>setNotes(e.target.value)} />
            <div className="flex items-center gap-2">
              <button className="btn-brand" onClick={()=>saveConsultation(selectedAppt, notes, '')} disabled={savingConsult}>{savingConsult? 'Saving...':'Save Note'}</button>
              <button className="btn-outline" onClick={()=>requestLab(selectedAppt)}>Request Lab</button>
            </div>
          </div>

          <div className="bg-white rounded p-4 shadow">
            <h3 className="font-semibold mb-2">Recent Consultations</h3>
            <div className="space-y-2 text-sm">
              {(appointmentsRaw||[]).slice(0,6).map(a=> (
                <div key={a._id} className="p-2 bg-gray-50 rounded">{new Date(a.scheduledAt).toLocaleString()} — {a.patient?.user?.name || a.patient} — {a.status}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prescriptions tab */}
      {activeTab === 'prescriptions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded p-4 shadow">
            <h3 className="font-semibold mb-2">Add / Update Prescription</h3>
            <form onSubmit={savePrescription}>
              <label className="block text-sm text-gray-600 mb-1">Select Appointment</label>
              <select className="input mb-2" value={selectedAppt} onChange={e=>setSelectedAppt(e.target.value)}>
                <option value="">-- Select appointment --</option>
                {upcoming.map(a=> (<option key={a.id} value={a.id}>{a.time} — {a.patient}</option>))}
              </select>
              <label className="block text-sm text-gray-600 mb-1">Prescription details</label>
              <textarea value={prescriptionText} onChange={e=>setPrescriptionText(e.target.value)} className="input mb-2 h-20" placeholder="Prescription details" />
              <button className="btn-brand" type="submit">Save Prescription</button>
            </form>
          </div>

          <div className="bg-white rounded p-4 shadow">
            <h3 className="font-semibold mb-2">Pending Lab Requests</h3>
            <div className="text-sm text-gray-600 mb-2">Your recent lab requests</div>
            {myLabRequests.length === 0 ? (
              <div className="text-gray-500 text-sm">No lab requests</div>
            ) : (
              <div className="space-y-2 text-sm">
                {myLabRequests.map(r => (
                  <div key={r._id} className="p-2 border rounded flex items-center justify-between">
                    <div>
                      <div className="font-medium">{r.testType || r.details}</div>
                      <div className="text-xs text-gray-500">Patient: {r.patient?.user?.name || r.patient}</div>
                      <div className="text-xs text-gray-500">Status: {r.status}</div>
                    </div>
                    <div>
                      {r.status !== 'cancelled' && r.status !== 'completed' && (
                        <button className="btn-modern-outline" onClick={()=>cancelLabRequest(r._id)}>Cancel</button>
                      )}
                      <button className="btn-modern ml-2" onClick={()=>{ /* view details, open lab modal maybe */ }}>View</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Billing tab */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded p-4 shadow">
          <h3 className="font-semibold mb-2">Invoices</h3>
          <div className="text-sm mb-3">Total revenue: <span className="font-semibold">KES {revenueTotal}</span></div>
          <DataTable columns={[{header:'Invoice',accessor:'invoice'},{header:'Patient',accessor:'patient'},{header:'Amount',accessor:'amount'},{header:'Status',accessor:'status'}]} data={(invoices||[]).map(inv=>({ invoice: inv.invoiceNumber||inv._id, patient: inv.patient?.user?.name || inv.patient?.name || '-', amount: inv.amount||0, status: inv.status }))} />
        </div>
      )}

      {/* Analytics tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded p-4 shadow">
            <h3 className="font-semibold mb-2">Patients Seen</h3>
            <div className="text-2xl font-bold">{patientsSeenCount}</div>
            <div className="text-sm text-gray-500 mt-1">Completed consultations in selected period</div>
          </div>
          <div className="bg-white rounded p-4 shadow">
            <h3 className="font-semibold mb-2">Revenue</h3>
            <div className="text-2xl font-bold">KES {revenueTotal}</div>
            <div className="text-sm text-gray-500 mt-1">Total billed amount</div>
          </div>
        </div>
      )}

      {/* Messages tab (placeholder) */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded p-4 shadow">
          <h3 className="font-semibold mb-2">Messages</h3>
          <div className="text-sm text-gray-500">In-app messaging is not enabled. Use external communication channels.</div>
        </div>
      )}
      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white rounded shadow p-4 w-full max-w-md">
            <h3 className="font-semibold mb-2">Reschedule Appointment</h3>
            <form onSubmit={handleRescheduleSubmit}>
              <label className="text-sm text-gray-600">New date & time</label>
              <input type="datetime-local" className="input w-full mb-3" value={rescheduleDateValue} onChange={e=>setRescheduleDateValue(e.target.value)} />
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-modern-outline" onClick={closeRescheduleModal}>Cancel</button>
                <button type="submit" className="btn-modern-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Lab Request Modal */}
      {labModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-30 z-10" onClick={()=>setLabModalOpen(false)} />
        <div className="bg-white rounded shadow p-4 w-full max-w-md relative z-20" onClick={e=>e.stopPropagation()}>
            <h3 className="font-semibold mb-2">Create Lab Request</h3>
            <div>
              <label className="text-sm text-gray-600">Details / Test Type</label>
              <textarea className="input w-full mb-2" value={labRequestText} onChange={e=>setLabRequestText(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Assign to Technician (optional)</label>
              <select className="input w-full mb-2" value={selectedTech} onChange={e=>setSelectedTech(e.target.value)} onFocus={fetchTechnicians}>
                <option value="">-- Unassigned --</option>
                {technicians.map(t=> (<option key={t._id} value={t._id}>{t.name} — {t.email}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Reagents (optional)</label>
              <div className="mb-2">
                <div className="flex gap-2">
                  <select className="input flex-1" onFocus={fetchReagents} value={reagentSelect} onChange={e=>setReagentSelect(e.target.value)}>
                    <option value="">-- Select reagent --</option>
                    {reagentsList.map(r=> (<option key={r._id} value={r._id}>{r.name} (stock: {r.quantity})</option>))}
                  </select>
                  <input type="number" min="1" placeholder="Qty" value={reagentQtyInput} onChange={e=>setReagentQtyInput(e.target.value)} className="input w-24" />
                  <button type="button" className="btn-modern" onClick={(e)=>{
                    e.preventDefault();
                    const itemId = reagentSelect;
                    const q = Number(reagentQtyInput);
                    if (!itemId) return alert('Select a reagent');
                    if (!q || q <= 0) return alert('Enter a valid qty');
                    const existing = selectedReagents.find(r => String(r.itemId) === String(itemId));
                    const it = reagentsList.find(rr => String(rr._id) === String(itemId));
                    if (it && q > (Number(it.quantity)||0)) return alert(`Qty exceeds stock for ${it.name}`);
                    if (existing) {
                      setSelectedReagents(prev => prev.map(r => String(r.itemId) === String(itemId) ? { ...r, qty: r.qty + q } : r));
                    } else {
                      setSelectedReagents(prev => prev.concat([{ itemId, qty: q }]));
                    }
                    // reset inputs
                    setReagentSelect('');
                    setReagentQtyInput('');
                  }}>Add</button>
                </div>
                <div className="mt-2 text-sm">
                  {selectedReagents.length === 0 ? (<div className="text-gray-500">No reagents selected</div>) : (
                    <ul className="list-disc pl-5">
                      {selectedReagents.map((r, idx)=>{
                        const it = reagentsList.find(rr => String(rr._id) === String(r.itemId));
                        return (<li key={idx} className="flex items-center justify-between gap-2">
                          <span>{it ? it.name : r.itemId} — Qty: {r.qty}</span>
                          <div>
                            <button className="btn-modern mr-2" onClick={()=>{
                              setSelectedReagents(prev => prev.filter(x=>!(String(x.itemId)===String(r.itemId))));
                            }}>Remove</button>
                          </div>
                        </li>)
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Amount (optional)</label>
              <input className="input w-full mb-2" value={labAmount} onChange={e=>setLabAmount(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-modern-outline" onClick={()=>setLabModalOpen(false)}>Cancel</button>
              <button type="button" className="btn-modern-primary" onClick={submitLabRequest}>Send Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Nurse Modal */}
      {assignNurseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-30 z-10" onClick={()=>setAssignNurseModalOpen(false)} />
          <div className="bg-white rounded shadow p-4 w-full max-w-md relative z-20" onClick={e=>e.stopPropagation()}>
            <h3 className="font-semibold mb-2">Assign Nurse</h3>
            <div>
              <label className="text-sm text-gray-600">Select Nurse</label>
              <select className="input w-full mb-2" value={selectedNurse} onChange={e=>setSelectedNurse(e.target.value)}>
                <option value="">-- Select nurse --</option>
                {nursesList.map(n => (<option key={n._id} value={n._id}>{n.name} — {n.email}</option>))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-modern-outline" onClick={()=>setAssignNurseModalOpen(false)}>Cancel</button>
              <button type="button" className="btn-modern-primary" onClick={submitAssignNurse}>Assign</button>
            </div>
          </div>
        </div>
      )}
      {/* Availability success modal */}
      {availSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={()=>setAvailSuccess(false)}>
          <div className="absolute inset-0 bg-black opacity-30" />
          <div className="bg-white rounded shadow p-6 w-full max-w-sm text-center">
            <div className="w-24 h-24 mx-auto flex items-center justify-center bg-green-50 rounded-full mb-3">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="font-semibold">Availability updated</div>
          </div>
        </div>
      )}
      {/* Export modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={closeExportModal}>
          <div className="absolute inset-0 bg-black opacity-30" />
          <div className="bg-white rounded shadow p-4 w-full max-w-md" onClick={(e)=>e.stopPropagation()}>
            <h3 className="font-semibold mb-2">Send appointment PDF to (email)</h3>
            <input type="email" className="input mb-3" placeholder="recipient@example.com" value={exportRecipient} onChange={e=>setExportRecipient(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button className="btn-modern-outline" onClick={closeExportModal} disabled={exportLoading}>Cancel</button>
              <button className="btn-modern-primary" onClick={sendExportEmail} disabled={exportLoading}>{exportLoading? 'Sending...':'Send & Save'}</button>
            </div>
          </div>
        </div>
      )}

      {exportSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={()=>setExportSuccess(false)}>
          <div className="absolute inset-0 bg-black opacity-30" />
          <div className="bg-white rounded shadow p-6 w-full max-w-sm text-center">
            <div className="w-24 h-24 mx-auto flex items-center justify-center bg-green-50 rounded-full mb-3">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="font-semibold">Email sent</div>
          </div>
        </div>
      )}
    </>
  );
}