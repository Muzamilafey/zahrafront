import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import DataTable from '../../components/ui/DataTable';

export default function AdminPatient(){
  const { id } = useParams();
  const { axiosInstance, user } = useContext(AuthContext);
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [modalDoctors, setModalDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [loading, setLoading] = useState(true);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportRecipient, setExportRecipient] = useState('');
  const [exportInvoiceId, setExportInvoiceId] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState('');
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [invoiceSuccess, setInvoiceSuccess] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summarySuccess, setSummarySuccess] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [dischargeSummary, setDischargeSummary] = useState(null);

  useEffect(()=>{ try{ const saved = localStorage.getItem('notificationRecipient'); if (saved) setExportRecipient(saved); }catch(e){} },[]);

  const openExportModal = (id)=>{ setExportInvoiceId(id); setExportModalOpen(true); };
  const closeExportModal = ()=>{ setExportInvoiceId(null); setExportModalOpen(false); };
  
  const openDischargeModal = () => setShowDischargeModal(true);
  const closeDischargeModal = () => {
    setShowDischargeModal(false);
    setInvoiceSuccess(false);
    setInvoiceError('');
    setSummarySuccess(false);
    setSummaryError('');
    setDischargeSummary(null);
  };

  const generateInvoice = async () => {
    setGeneratingInvoice(true);
    setInvoiceSuccess(false);
    setInvoiceError('');
    try {
      await axiosInstance.post(`/discharge/${id}/generate-invoice`);
      setInvoiceSuccess(true);
      // Refresh invoices
      const res = await axiosInstance.get(`/patients/${id}`);
      setInvoices(res.data.invoices || []);
    } catch (error) {
      console.error(error);
      setInvoiceError('Failed to generate invoice.');
    }
    setGeneratingInvoice(false);
  };

  const generateDischargeSummary = async () => {
    setGeneratingSummary(true);
    setSummarySuccess(false);
    setSummaryError('');
    setDischargeSummary(null);
    try {
      // We need admissionId and dischargingDoctorId
      const admissionId = patient.admission?._id || id;
      const dischargingDoctorId = user._id;

      if (!patient.admission?.isAdmitted) {
        setSummaryError('Patient is not currently admitted.');
        setGeneratingSummary(false);
        return;
      }

      const response = await axiosInstance.post('/discharge/create', {
        patientId: id,
        admissionId,
        dischargingDoctorId,
      });

      setDischargeSummary(response.data.dischargeSummary);
      setSummarySuccess(true);
      // Refresh patient data
      const res = await axiosInstance.get(`/patients/${id}`);
      setPatient(res.data.patient || null);
    } catch (error) {
      console.error(error);
      setSummaryError('Failed to generate discharge summary.');
    }
    setGeneratingSummary(false);
  };
  
  const sendExportEmail = async ()=>{
    if (!exportRecipient) { setExportError('Enter recipient'); setTimeout(()=>setExportError(''),3000); return; }
    setExportLoading(true);
    try{
      await axiosInstance.post(`/billing/${exportInvoiceId}/export-email`, { to: exportRecipient });
      try{ localStorage.setItem('notificationRecipient', exportRecipient); }catch(e){}
      setExportSuccess(true); setTimeout(()=>setExportSuccess(false),2000);
      closeExportModal();
    }catch(e){ console.error(e); setExportError('Failed to send'); setTimeout(()=>setExportError(''),3000); }
    setExportLoading(false);
  };

  const printInvoice = (inv) => {
    const w = window.open('', '_blank'); if(!w) return;
    const html = `
      <html><head><title>Invoice${inv.invoiceNumber ? ' #' + inv.invoiceNumber : ''}</title>
      <style>body{font-family: Arial; padding:20px;} .h{font-weight:700; font-size:18px; margin-bottom:10px;} .row{display:flex; justify-content:space-between;}</style>
      </head><body>
        <div class="h">Genz Community Hospital</div>
        <div><strong>Invoice:</strong> ${inv.invoiceNumber || inv._id}</div>
        <div class="row"><div><strong>To:</strong> ${inv.patient?.user?.name || '-'}</div><div><strong>Date:</strong> ${new Date(inv.createdAt).toLocaleString()}</div></div>
        <hr/>
        <div class="row"><div>${inv.type || 'Charge'}</div><div>${(inv.amount||0).toFixed(2)}</div></div>
        <hr/>
        <div class="row"><div><strong>Total</strong></div><div><strong>${(inv.amount||0).toFixed(2)}</strong></div></div>
      </body></html>`;
    w.document.write(html); w.document.close(); w.focus(); setTimeout(()=>{ w.print(); w.close(); }, 300);
  };

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get(`/patients/${id}`);
        setPatient(res.data.patient || null);
        setAppointments(res.data.appointments || []);
        setInvoices(res.data.invoices || []);
        setLabTests(res.data.labTests || []);
        setPrescriptions(res.data.prescriptions || []);
      }catch(e){ console.error(e); }
      finally{ setLoading(false); }
    };
    load();
  },[id]);

  // load doctors for modal when it's opened
  useEffect(()=>{
    if (!showAssignModal) return;
    const loadDoctors = async ()=>{
      try{
        const res = await axiosInstance.get('/doctors');
        const docs = res.data?.doctors || res.data || [];
        setModalDoctors(docs);
      }catch(e){ console.error(e); }
    };
    loadDoctors();
  }, [showAssignModal]);

  if(loading) return <div className="p-6">Loading...</div>;
  if(!patient) return <div className="p-6">Patient not found</div>;

  const appointmentsColumns = [
    { header: 'When', accessor: 'when' },
    { header: 'Doctor', accessor: 'doctor' },
    { header: 'Status', accessor: 'status' },
  ];

  const appointmentsData = appointments.map(a=>({
    when: a.scheduledAt ? new Date(a.scheduledAt).toLocaleString() : '-',
    doctor: a.doctor?.user?.name || a.doctor?.name || '-',
    status: a.status || '-',
  }));

  const invoiceColumns = [
    { header: 'Invoice #', accessor: 'num' },
    { header: 'Amount', accessor: 'amount' },
    { header: 'Status', accessor: 'status' },
    { header: 'Actions', accessor: 'actions' },
  ];

  const invoiceData = invoices.map(inv=>({ num: inv.invoiceNumber || '-', amount: inv.amount || '-', status: inv.status || '-', actions: (
    user?.role === 'receptionist' ? null : (
      <div className="flex items-center gap-2">
        <button className="btn-outline text-sm" onClick={()=>printInvoice(inv)}>Print</button>
        <button className="btn-primary text-sm" onClick={()=>openExportModal(inv._id)}>Export to Email</button>
      </div>
    )
  ) }));

  const labColumns = [ { header: 'Test', accessor: 'test' }, { header: 'Doctor', accessor: 'doctor' }, { header: 'Status', accessor: 'status' } ];
  const labData = labTests.map(l=>({ test: l.testType || '-', doctor: l.doctor?.user?.name || '-', status: l.status || '-' }));

  const presColumns = [ { header: '#', accessor: 'num' }, { header: 'Created', accessor: 'created' }, { header: 'Status', accessor: 'status' } ];
  const presData = prescriptions.map(p=>({ num: p.prescriptionNumber || '-', created: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-', status: p.status || '-' }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-brand-700">Patient: {patient.user?.name || '-'}</h2>
        <Link to="/dashboard/admin/patients" className="btn-outline">Back to patients</Link>
      </div>
      {/* export modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={closeExportModal}>
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="relative bg-white rounded p-4 w-full max-w-md mx-4" onClick={(e)=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Send invoice PDF to (email)</h3>
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

      <div className="bg-white rounded p-4 shadow mb-6">
        <h3 className="text-lg font-semibold mb-2">Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex items-center">
            <div className="w-28 h-28 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
              {patient.logo ? (
                <img src={`${process.env.REACT_APP_API_BASE?.replace('/api','') || ''}${patient.logo}`} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <div className="text-sm text-gray-500">No logo</div>
              )}
            </div>
            <div className="ml-4">
              <form onSubmit={async (e)=>{
                e.preventDefault();
                const file = e.target.logo.files[0];
                if (!file) return alert('Select a file');
                const fd = new FormData(); fd.append('logo', file);
                try {
                  const res = await axiosInstance.post(`/patients/${id}/logo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                  alert('Logo uploaded');
                  setPatient({...patient, logo: res.data.logo});
                } catch (err) { console.error(err); alert(err.response?.data?.message || 'Upload failed'); }
              }}>
                <input type="file" name="logo" accept="image/*" />
                <div className="mt-2">
                  <button className="btn-brand" type="submit">Upload logo</button>
                </div>
              </form>
              <div className="mt-3">
                <button className="btn-outline" onClick={()=>setShowAssignModal(true)}>Assign doctor</button>
                <button className="btn-outline ml-2" onClick={openDischargeModal}>Discharge</button>
              </div>
              {/* Discharge modal */}
              {showDischargeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded shadow max-w-lg w-full">
                    <h3 className="text-lg font-semibold mb-3">Discharge Patient</h3>
                    {invoiceSuccess && <div className="text-green-500 mb-2">Invoice generated successfully.</div>}
                    {invoiceError && <div className="text-red-500 mb-2">{invoiceError}</div>}
                    {summarySuccess && <div className="text-green-500 mb-2">Discharge summary generated successfully.</div>}
                    {summaryError && <div className="text-red-500 mb-2">{summaryError}</div>}
                    <div className="flex gap-2 justify-end">
                      <button className="btn-outline" onClick={closeDischargeModal}>Cancel</button>
                      {dischargeSummary && (
                        <Link to={`/discharge/${dischargeSummary._id}`} target="_blank" className="btn-outline">View Summary</Link>
                      )}
                      <button className="btn-brand" onClick={generateDischargeSummary} disabled={generatingSummary}>
                        {generatingSummary ? 'Generating...' : 'Generate Discharge Summary'}
                      </button>
                      <button className="btn-brand" onClick={generateInvoice} disabled={generatingInvoice}>
                        {generatingInvoice ? 'Generating...' : 'Generate Invoice'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Assign doctor modal */}
              {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded shadow max-w-lg w-full">
                    <h3 className="text-lg font-semibold mb-3">Assign Doctor</h3>
                    <label className="block text-sm mb-2">Select Doctor</label>
                    <select className="input mb-4 w-full" value={selectedDoctor} onChange={e=>setSelectedDoctor(e.target.value)}>
                      <option value="">-- Select --</option>
                      {modalDoctors.map(d=> (
                        <option key={d._id} value={d._id}>{d.user?.name || d.user?.email || 'Doctor'}</option>
                      ))}
                    </select>
                    <div className="flex gap-2 justify-end">
                      <button className="btn-outline" onClick={()=>setShowAssignModal(false)}>Cancel</button>
                      <button className="btn-brand" onClick={async ()=>{
                        if(!selectedDoctor) return alert('Select a doctor');
                        try{
                          await axiosInstance.put(`/patients/${id}/assign`, { doctorId: selectedDoctor });
                          alert('Doctor assigned');
                          // refresh patient data
                          const res = await axiosInstance.get(`/patients/${id}`);
                          setPatient(res.data.patient || null);
                          setShowAssignModal(false);
                        }catch(err){ console.error(err); alert(err?.response?.data?.message || 'Assign failed'); }
                      }}>Assign</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div><strong>Name:</strong> {patient.user?.name}</div>
          <div><strong>Email:</strong> {patient.user?.email}</div>
          <div><strong>Hospital ID:</strong> {patient.hospitalId}</div>
          <div><strong>Medical History:</strong> {patient.medicalHistory || '-'}</div>
          <div><strong>Allergies:</strong> {(patient.allergies||[]).join(', ') || '-'}</div>
          <div><strong>Emergency:</strong> {patient.emergencyContact?.name || '-'} {patient.emergencyContact?.phone ? `(${patient.emergencyContact.phone})` : ''}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded p-4 shadow">
          <h3 className="text-lg font-semibold mb-2">Appointments</h3>
          <DataTable columns={appointmentsColumns} data={appointmentsData} />
        </div>

        <div className="bg-white rounded p-4 shadow">
          <h3 className="text-lg font-semibold mb-2">Invoices</h3>
          <DataTable columns={invoiceColumns} data={invoiceData} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded p-4 shadow">
          <h3 className="text-lg font-semibold mb-2">Lab Tests</h3>
          <DataTable columns={labColumns} data={labData} />
        </div>

        <div className="bg-white rounded p-4 shadow">
          <h3 className="text-lg font-semibold mb-2">Prescriptions</h3>
          <DataTable columns={presColumns} data={presData} />
        </div>
      </div>
    </div>
  );
}
