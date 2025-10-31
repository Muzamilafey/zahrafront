import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';

export default function NewVisit() {
  const { axiosInstance } = useContext(AuthContext);
  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    type: '',
    visitDate: new Date().toISOString().split('T')[0],
    diagnosis: {
      code: '',
      description: '',
      notes: ''
    },
    treatmentNotes: ''
  });
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadPatients();
    loadDoctors();
  }, []);

  const loadPatients = async () => {
    try {
      setPatientsLoading(true);
      const res = await axiosInstance.get('/patients');
      setPatients(res.data.patients || []);
    } catch (e) {
      console.error(e);
      setToast({ message: 'Failed to load patients', type: 'error' });
    } finally {
      setPatientsLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      setDoctorsLoading(true);
      // Try /doctors/list first, fallback to /doctors if needed
      let res;
      try {
        res = await axiosInstance.get('/doctors/list');
      } catch (e) {
        // Fallback to /doctors endpoint
        res = await axiosInstance.get('/doctors');
      }
      
      // Normalize the response
      const doctorsList = res.data.doctors || [];
      if (doctorsList.length === 0) {
        setToast({ message: 'No doctors found in the system', type: 'warning' });
      }
      setDoctors(doctorsList);
    } catch (e) {
      console.error('Error loading doctors:', e);
      setToast({ 
        message: e?.response?.data?.message || 'Failed to load doctors. Please try again.',
        type: 'error'
      });
    } finally {
      setDoctorsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('diagnosis.')) {
      const field = name.split('.')[1];
      setForm(prev => ({
        ...prev,
        diagnosis: { ...prev.diagnosis, [field]: value }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post('/visits', form);
      setToast({ message: 'Visit created successfully', type: 'success' });
      setForm({
        patientId: '',
        doctorId: '',
        type: '',
        visitDate: new Date().toISOString().split('T')[0],
        diagnosis: { code: '', description: '', notes: '' },
        treatmentNotes: ''
      });
    } catch (e) {
      setToast({ message: e?.response?.data?.message || 'Failed to create visit', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">New Patient Visit</h2>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
            <select
              name="patientId"
              value={form.patientId}
              onChange={handleChange}
              className="input w-full"
              required
            >
              <option value="">{patientsLoading ? 'Loading patients...' : 'Select Patient'}</option>
              {!patientsLoading && patients.map(p => (
                <option key={p._id} value={p._id}>
                  {p.user?.name} ({p.hospitalId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <select
              name="doctorId"
              value={form.doctorId}
              onChange={handleChange}
              className="input w-full"
              required
              disabled={doctorsLoading}
            >
              <option value="">{doctorsLoading ? 'Loading doctors...' : 'Select Doctor'}</option>
              {!doctorsLoading && doctors.map(d => (
                <option key={d._id} value={d._id}>
                  {d.user?.name || d.user?.email || 'Doctor'}{d.specialties?.length ? ` - ${d.specialties.join(', ')}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="input w-full"
              required
            >
              <option value="">Select Type</option>
              <option value="walk-in">Walk-in</option>
              <option value="scheduled">Scheduled</option>
              <option value="follow-up">Follow-up</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
            <input
              type="date"
              name="visitDate"
              value={form.visitDate}
              onChange={handleChange}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Code</label>
            <input
              type="text"
              name="diagnosis.code"
              value={form.diagnosis.code}
              onChange={handleChange}
              placeholder="e.g., ICD-10 code"
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Description</label>
            <textarea
              name="diagnosis.description"
              value={form.diagnosis.description}
              onChange={handleChange}
              className="input w-full"
              rows="2"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Notes</label>
            <textarea
              name="diagnosis.notes"
              value={form.diagnosis.notes}
              onChange={handleChange}
              className="input w-full"
              rows="2"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Notes</label>
            <textarea
              name="treatmentNotes"
              value={form.treatmentNotes}
              onChange={handleChange}
              className="input w-full"
              rows="3"
            ></textarea>
          </div>

          <div>
            <button
              type="submit"
              className="btn-brand w-full"
              disabled={loading}
            >
              {loading ? 'Creating Visit...' : 'Create Visit'}
            </button>
          </div>
        </div>
      </form>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}