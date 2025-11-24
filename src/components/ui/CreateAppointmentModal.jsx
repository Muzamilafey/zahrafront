import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from './Toast';


export default function CreateAppointmentModal({ open, onClose, imageSrc, onToast }) {
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const [step, setStep] = useState('ask'); // 'ask' | 'search'
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && step === 'search') {
      loadPatients();
    }
    // Reset state when modal opens
    if (open) {
      setQuery('');
      setFilteredPatients([]);
      // Toast is handled by parent
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

  const handleYes = () => {
    setStep('search');
  };

  const handleNo = () => {
    onClose && onClose();
    navigate('/patients/register');
  };

  const handleSelectPatient = (patient) => {
    onClose && onClose();
    navigate(`/appointments/new?patientId=${patient._id}`);
    if (onToast) {
      setTimeout(() => {
        onToast({ message: `Patient selected: ${patient.firstName} ${patient.lastName}`, type: 'success', duration: 2500 });
      }, 500);
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
            <p className="mb-6 text-sm text-gray-700">If yes, search and select patient to create appointment. If no, navigate to Register Patient page.</p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={handleYes} className="px-6 py-3 rounded-full bg-green-500 text-white font-semibold">YES</button>
              <button onClick={handleNo} className="px-6 py-3 rounded-full bg-red-500 text-white font-semibold">NO</button>
            </div>
          </div>
        ) : (
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
        )}
        <div className="p-4 border-t text-center text-xs text-gray-500">
          <div className="mb-2">Or open the example/guide image below</div>
          {imageSrc ? (
            <img src={imageSrc} alt="Create Appointment" className="mx-auto max-h-48 object-contain" />
          ) : (
            <a href="/assets/create-appointment.png" target="_blank" rel="noreferrer" className="text-blue-600 underline">Open image</a>
          )}
        </div>
        {/* Toast handled by parent */}
      </div>
    </div>
  );
}
