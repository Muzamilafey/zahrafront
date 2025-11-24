import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from './Toast';


export default function CreateAppointmentModal({ open, onClose, imageSrc, onToast }) {
  const { axiosInstance } = useContext(AuthContext);
  const [step, setStep] = useState('ask'); // 'ask' | 'search' | 'form'
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [consultationId, setConsultationId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Only reset state when modal is first opened
  useEffect(() => {
    if (open) {
      setStep('ask');
      setQuery('');
      setFilteredPatients([]);
      setSelectedPatient(null);
      // setDoctorId removed (no longer used)
      setAppointmentDate('');
      setAppointmentTime('');
      setToast(null);
    }
  }, [open]);

  useEffect(() => {
    if (open && step === 'search') {
      loadPatients();
    }
    if (open && step === 'form') {
      loadConsultations();
    }
  }, [open, step]);

  useEffect(() => {
    if (query && patients.length > 0) {
      const lower = query.toLowerCase();
      setFilteredPatients(
        patients.filter(p => {
          const fullName = `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.trim().toLowerCase();
          const hospitalId = String(p.hospitalId || p.mrn || '').toLowerCase();
          return fullName.includes(lower) || hospitalId.includes(lower);
        })
      );
    } else {
      setFilteredPatients(patients);
    }
  }, [query, patients]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/patients');
      const patientData = Array.isArray(res.data) ? res.data : (res.data.patients || []);
      setPatients(patientData);
      setFilteredPatients(patientData);
    } catch (e) {
      if (typeof onToast === 'function') {
        onToast({ message: 'Failed to load patients', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadConsultations = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/consultations');
      setConsultations(res.data.consultations || []);
    } catch (e) {
      setToast({ message: 'Failed to load consultations', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleYes = () => {
    setStep('search');
  };

  const handleNo = () => {
    onClose && onClose();
    window.location.href = '/patients/register';
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setStep('form');
    setToast({ message: `Patient selected: ${patient.firstName} ${patient.lastName}`, type: 'success', duration: 2000 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setToast(null);
    try {
      // Combine date and time to ISO string
      const scheduledAt = appointmentDate && appointmentTime
        ? new Date(`${appointmentDate}T${appointmentTime}`).toISOString()
        : null;
      await axiosInstance.post('/appointments', {
        patientId: selectedPatient._id,
        consultationId,
        scheduledAt,
      });
      setToast({ message: 'Appointment created successfully!', type: 'success' });
      setTimeout(() => {
        setSubmitting(false);
        onClose && onClose();
        if (onToast) onToast({ message: 'Appointment created!', type: 'success' });
      }, 1500);
    } catch (error) {
      setToast({ message: 'Failed to create appointment', type: 'error' });
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded shadow-lg max-w-2xl w-full mx-4 flex flex-col justify-center items-center" style={{ margin: 'auto' }}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {step === 'ask' ? 'Is patient already registered?' : 'Search for Patient'}
          </h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">Close</button>
        </div>
        {step === 'ask' ? (
          <div className="p-6 text-center">
            <p className="mb-6 text-sm text-gray-700"></p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={handleYes} className="px-6 py-3 rounded-full bg-green-500 text-white font-semibold">YES</button>
              <button onClick={handleNo} className="px-6 py-3 rounded-full bg-red-500 text-white font-semibold">NO</button>
            </div>
          </div>
        ) : step === 'search' ? (
          <div className="p-6">
            <div className="mb-4">
              <input
                type="text"
                className="w-full px-4 py-2 border rounded"
                placeholder="Search by name or hospital ID..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            {loading ? (
              <div className="text-center text-gray-500">Loading patients...</div>
            ) : (
              <ul className="max-h-64 overflow-y-auto divide-y">
                {filteredPatients.length === 0 ? (
                  <li className="py-2 text-center text-gray-400">No patients found.</li>
                ) : (
                  filteredPatients.slice(0, 10).map(patient => (
                    <li key={patient._id} className="py-2 px-2 flex items-center justify-between hover:bg-gray-100 cursor-pointer" onClick={() => handleSelectPatient(patient)}>
                      <span>{patient.firstName} {patient.lastName} <span className="text-xs text-gray-500">({patient.mrn || 'N/A'})</span></span>
                      <button className="px-3 py-1 rounded bg-blue-500 text-white text-xs">Select</button>
                    </li>
                  ))
                )}
              </ul>
            )}
            <div className="mt-4 text-xs text-gray-500 text-center">Select a patient to pre-fill appointment form.</div>
          </div>
        ) : step === 'form' && selectedPatient ? (
          <form className="p-6 w-full" onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="font-semibold mb-2">Patient: {selectedPatient.firstName} {selectedPatient.lastName} <span className="text-xs text-gray-500">({selectedPatient.mrn || 'N/A'})</span></div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Consultation/Service</label>
              <select
                name="consultationId"
                value={consultationId}
                onChange={e => setConsultationId(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">-- Select a Consultation/Service --</option>
                {consultations.map(c => (
                  <option key={c._id} value={c._id}>{c.name} {c.price ? `- ₦${c.price}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date</label>
              <input
                type="date"
                name="appointmentDate"
                value={appointmentDate}
                onChange={e => setAppointmentDate(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Time</label>
              <input
                type="time"
                name="appointmentTime"
                value={appointmentTime}
                onChange={e => setAppointmentTime(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                className="px-6 py-2 rounded bg-green-600 text-white font-semibold"
                disabled={submitting || !consultationId || !appointmentDate || !appointmentTime}
              >
                {submitting ? 'Creating...' : 'Create Appointment'}
              </button>
            </div>
            {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
          </form>
        ) : null}
        <div className="p-4 border-t text-center text-xs text-gray-500">
          <div className="mb-2"></div>
          
        </div>
        {/* Toast handled by parent */}
      </div>
    </div>
  );
}
