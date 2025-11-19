import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import DischargeWithInvoice from '../components/DischargeWithInvoice';

export default function Profile() {
  const { user, axiosInstance } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [patientRecords, setPatientRecords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        // If the logged-in user is a patient, fetch the patient profile and related records
        if (user.role === 'patient') {
          const res = await axiosInstance.get('/patients/me');
          // response: { patient, appointments, invoices, labTests, prescriptions }
          setProfile(res.data.patient || null);
          setPatientRecords({
            appointments: res.data.appointments || [],
            invoices: res.data.invoices || [],
            labTests: res.data.labTests || [],
            prescriptions: res.data.prescriptions || [],
          });
        } else {
          // non-patient users (staff) - use /users/me which returns { user }
          const res = await axiosInstance.get('/users/me');
          setProfile(res.data.user || res.data);
          setPatientRecords(null);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user) return <div className="p-8 text-gray-600">Please login to view profile.</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
      <div>
        <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md overflow-hidden mx-auto">
        {/* Header with hospital branding */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-6 text-white text-center">
          <div className="flex justify-center mb-3">
            <img
              src={`https://ui-avatars.com/api/?name=${profile?.name || 'User'}&background=0D8ABC&color=fff&size=100`}
              alt="avatar"
              className="rounded-full border-4 border-white shadow-lg w-24 h-24"
            />
          </div>
          <h2 className="text-2xl font-bold">{profile?.name || 'Loading...'}</h2>
          <p className="text-sm opacity-90">{profile?.role || 'User Role'}</p>
        </div>

        {/* Profile info section */}
        <div className="p-6 space-y-4">
          {loading && <p className="text-gray-500">Loading...</p>}
          {error && <p className="text-red-600">{error}</p>}

          {profile && (
            <>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium text-gray-600">Full Name</span>
                <span className="text-gray-800">{profile.name}</span>
              </div>

              {profile.email && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium text-gray-600">Email</span>
                  <span className="text-gray-800">{profile.email}</span>
                </div>
              )}

              {profile.role && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium text-gray-600">Role</span>
                  <span className="text-gray-800">{profile.role}</span>
                </div>
              )}

              {/* If this is a patient profile, show hospital-specific fields */}
              {user.role === 'patient' && profile && (
                <div className="space-y-2 mt-3">
                  {profile.hospitalId && (
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium text-gray-600">Hospital ID</span>
                      <span className="text-gray-800">{profile.hospitalId}</span>
                    </div>
                  )}

                  {profile.assignedDoctor && (
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium text-gray-600">Assigned Doctor</span>
                      <span className="text-gray-800">{profile.assignedDoctor.name || profile.assignedDoctor.user?.name || profile.assignedDoctor}</span>
                    </div>
                  )}

                  {profile.allergies && profile.allergies.length > 0 && (
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium text-gray-600">Allergies</span>
                      <span className="text-gray-800">{profile.allergies.join(', ')}</span>
                    </div>
                  )}

                  {profile.emergencyContact && profile.emergencyContact.name && (
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium text-gray-600">Emergency Contact</span>
                      <span className="text-gray-800">{profile.emergencyContact.name} — {profile.emergencyContact.phone} ({profile.emergencyContact.relation})</span>
                    </div>
                  )}

                  {profile.admission && profile.admission.isAdmitted && (
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium text-gray-600">Admission</span>
                      <span className="text-gray-800">{profile.admission.ward} / Bed {profile.admission.bed} (Admitted: {new Date(profile.admission.admittedAt).toLocaleString()})</span>
                    </div>
                  )}

                  {profile.medicalHistory && (
                    <div className="pt-2">
                      <div className="font-medium text-gray-600">Medical History</div>
                      <div className="text-gray-800 text-sm mt-1">{profile.medicalHistory}</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-4 text-center text-sm text-gray-500">
          CoreCare • Hospital Management Informatio System
        </div>
      </div>
      {patientRecords && (
        <div className="mt-8">
          <ProfileRecords records={patientRecords} profile={profile} />
        </div>
      )}
      </div>
    </div>
  );
}

// Below the main card, render patient records if available
export function ProfileRecords({ records, profile }) {
  // Hooks must be called unconditionally
  const { axiosInstance, user } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [recipient, setRecipient] = React.useState('');
  const [currentAppointmentId, setCurrentAppointmentId] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [successVisible, setSuccessVisible] = React.useState(false);
  const [successText, setSuccessText] = React.useState('');
  const [errorVisible, setErrorVisible] = React.useState(false);
  const [errorText, setErrorText] = React.useState('');

  // Discharge summary section state (moved up so hooks run unconditionally)
  const [dischargeOpen, setDischargeOpen] = React.useState(false);
  const [dischargeLoading, setDischargeLoading] = React.useState(false);
  const [dischargeError, setDischargeError] = React.useState(null);
  const [dischargeSummary, setDischargeSummary] = React.useState(null);
  const [dischargeInvoice, setDischargeInvoice] = React.useState(null);

  React.useEffect(()=>{
    try{ const saved = localStorage.getItem('notificationRecipient'); if (saved) setRecipient(saved); }catch(e){}
  },[]);

  const openModal = (appointmentId)=>{ setCurrentAppointmentId(appointmentId); setModalOpen(true); };
  const closeModal = ()=>{ setModalOpen(false); setCurrentAppointmentId(null); };

  if (!records) return null;
  const { appointments = [], invoices = [], labTests = [], prescriptions = [] } = records;

  const sendEmail = async ()=>{
    if (!recipient) { setErrorText('Please enter an email'); setErrorVisible(true); setTimeout(()=>setErrorVisible(false),3000); return; }
    setLoading(true);
    try{
      await axiosInstance.post(`/appointments/${currentAppointmentId}/export-email`, { to: recipient });
      try{ localStorage.setItem('notificationRecipient', recipient); }catch(e){}
      setSuccessText('Email sent successfully'); setSuccessVisible(true); setTimeout(()=>setSuccessVisible(false),2000);
      closeModal();
    }catch(e){ console.error(e); setErrorText('Failed to send email'); setErrorVisible(true); setTimeout(()=>setErrorVisible(false),3000); }
    setLoading(false);
  };

  const printAppointment = (appointment) => {
    // Open a new window and write the appointment details for printing
    const w = window.open('', '_blank');
    if (!w) return;
    const html = `
      <html><head><title>Appointment${appointment.appointmentNumber ? ' #' + appointment.appointmentNumber : ''}</title>
      <style>body{font-family: Arial; padding:20px;} .h{font-weight:700; font-size:18px; margin-bottom:10px;}</style>
      </head><body>
        <div class="h">Appointment${appointment.appointmentNumber ? ' #' + appointment.appointmentNumber : ''}</div>
        <div><strong>Patient:</strong> ${appointment.patient?.user?.name || appointment.patient?.name || '—'}</div>
        <div><strong>Doctor:</strong> ${appointment.doctor?.user?.name || appointment.doctor?.name || '—'}</div>
        <div><strong>Scheduled:</strong> ${new Date(appointment.scheduledAt).toLocaleString()}</div>
        <div><strong>Status:</strong> ${appointment.status}</div>
      </body></html>`;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(()=>{ w.print(); w.close(); }, 300);
  };

  const toggleDischarge = async () => {
    setDischargeOpen(s => !s);
    if (!dischargeSummary && !dischargeLoading && profile) {
      setDischargeLoading(true);
      setDischargeError(null);
      try {
        // Try discharge summary by patient id
        const res = await axiosInstance.get(`/discharge/patient/${profile._id}`);
        const data = res.data || {};
        // normalize: could be array or { summaries: [...] } or single object
        let summary = null;
        if (Array.isArray(data)) summary = data[0] || null;
        else if (Array.isArray(data.summaries)) summary = data.summaries[0] || null;
        else if (data.summary) summary = data.summary;
        else summary = data;
        setDischargeSummary(summary || null);
      } catch (e) {
        console.warn('Failed to load discharge summary', e);
        setDischargeError(e?.response?.data?.message || 'No discharge summary available');
      } finally {
        // choose an invoice from records if available
        try {
          const inv = (records?.invoices || []).find(i => i.type === 'admission' || i.type === 'discharge') || (records?.invoices || [])[0] || null;
          setDischargeInvoice(inv);
        } catch(_) {
          setDischargeInvoice(null);
        }
        setDischargeLoading(false);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <section className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-3">Appointments ({appointments.length})</h3>
          {appointments.length === 0 && <p className="text-sm text-gray-500">No appointments found.</p>}
          {appointments.map(a => (
            <div key={a._id} className="flex justify-between items-center border-b py-2">
              <div>
                <div className="font-medium">With Dr. {a.doctor?.name || a.doctor?.user?.name || '—'}</div>
                <div className="text-sm text-gray-500">{new Date(a.scheduledAt).toLocaleString()} • {a.status}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600 mr-4">#{a.appointmentNumber || ''}</div>
                {user?.role !== 'receptionist' && (
                  <>
                    <button className="btn-outline text-sm" onClick={()=>printAppointment(a)}>Print</button>
                    <button className="btn-primary text-sm" onClick={()=>openModal(a._id)}>Export to Email</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Export modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={closeModal}>
            <div className="absolute inset-0 bg-black opacity-40" />
            <div className="relative bg-white rounded p-4 w-full max-w-md mx-4" onClick={(e)=>e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-2">Send appointment PDF to (email)</h3>
              <input
                type="email"
                className="w-full border rounded p-2 mb-3"
                placeholder="recipient@example.com"
                value={recipient}
                onChange={(e)=>setRecipient(e.target.value)}
              />
              <div className="flex justify-end space-x-2">
                <button className="btn-outline" onClick={closeModal} disabled={loading}>Cancel</button>
                <button className="btn-primary" onClick={sendEmail} disabled={loading}>
                  {loading ? 'Sending...' : 'Send & Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success / Error popups */}
        {successVisible && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={()=>setSuccessVisible(false)}>
            <div className="absolute inset-0 bg-black opacity-40" />
            <div className="relative bg-white rounded p-6 w-full max-w-sm mx-4 text-center" onClick={(e)=>e.stopPropagation()}>
              <div className="flex items-center justify-center mb-4">
                <div className="w-24 h-24 flex items-center justify-center bg-green-50 rounded-full">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
              <div className="font-semibold text-lg mb-2">{successText}</div>
              <div className="text-sm text-gray-600">This window will close automatically.</div>
            </div>
          </div>
        )}

        {errorVisible && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={()=>setErrorVisible(false)}>
            <div className="absolute inset-0 bg-black opacity-40" />
            <div className="relative bg-white rounded p-6 w-full max-w-sm mx-4 text-center" onClick={(e)=>e.stopPropagation()}>
              <div className="flex items-center justify-center mb-4">
                <div className="w-24 h-24 flex items-center justify-center bg-red-50 rounded-full">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8v4" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 17h.01" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
              <div className="font-semibold text-lg mb-2">{errorText}</div>
              <div className="text-sm text-gray-600">Please try again or check server logs.</div>
            </div>
          </div>
        )}

        <section className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-3">Invoices ({invoices.length})</h3>
          {invoices.length === 0 && <p className="text-sm text-gray-500">No invoices found.</p>}
          {invoices.map(inv => (
            <div key={inv._id} className="flex justify-between items-center border-b py-2">
              <div>
                <div className="font-medium">{inv.type}</div>
                <div className="text-sm text-gray-500">{new Date(inv.createdAt).toLocaleDateString()} • {inv.status}</div>
              </div>
              <div className="text-sm font-semibold">${inv.amount?.toFixed?.(2) ?? inv.amount}</div>
            </div>
          ))}
        </section>

        <section className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-3">Lab Tests ({labTests.length})</h3>
          {labTests.length === 0 && <p className="text-sm text-gray-500">No lab tests found.</p>}
          {labTests.map(l => (
            <div key={l._id} className="flex justify-between items-center border-b py-2">
              <div>
                <div className="font-medium">{l.testType}</div>
                <div className="text-sm text-gray-500">Requested {new Date(l.createdAt).toLocaleDateString()} • {l.status}</div>
              </div>
              <div className="text-sm text-gray-600">#{l.labTestNumber || ''}</div>
            </div>
          ))}
        </section>

        <section className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-3">Prescriptions ({prescriptions.length})</h3>
          {prescriptions.length === 0 && <p className="text-sm text-gray-500">No prescriptions found.</p>}
          {prescriptions.map(p => (
            <div key={p._id} className="flex justify-between items-center border-b py-2">
              <div>
                <div className="font-medium">For appointment #{p.appointment?.appointmentNumber || ''}</div>
                <div className="text-sm text-gray-500">Created {new Date(p.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="text-sm text-gray-600">Status: {p.status}</div>
            </div>
          ))}
        </section>

        {/* Discharge Summary (collapsible) */}
        <section className="bg-white shadow rounded p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Discharge Summary</h3>
            <div className="flex items-center gap-2">
              <button className="btn-outline text-sm" onClick={toggleDischarge}>{dischargeOpen ? 'Hide' : 'Show'}</button>
              <button className="btn-primary text-sm" onClick={()=>navigate(`/patients/${profile?._id}/discharge-summary`)}>Open Full</button>
            </div>
          </div>
          {dischargeOpen && (
            <div className="mt-3">
              {dischargeLoading && <div className="text-sm text-gray-500">Loading discharge summary...</div>}
              {dischargeError && <div className="text-sm text-red-600">{dischargeError}</div>}
              {!dischargeLoading && !dischargeError && !dischargeSummary && (
                <div className="text-sm text-gray-600">No discharge summary found for this patient.</div>
              )}
              {dischargeSummary && (
                <div className="mt-2">
                  <DischargeWithInvoice patient={profile} summary={dischargeSummary} invoice={dischargeInvoice} />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
