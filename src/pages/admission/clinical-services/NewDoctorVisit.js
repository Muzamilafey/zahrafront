import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import Toast from '../../../components/ui/Toast';

export default function NewDoctorVisit() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { axiosInstance, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({
    visitType: 'routine',
    diagnosis: {
      code: '',
      description: '',
      notes: ''
    },
    vitals: {
      temperature: '',
      bloodPressure: '',
      pulse: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      weight: '',
      height: ''
    },
    symptoms: '',
    clinicalNotes: '',
    prescription: '',
    recommendations: '',
    followUpDate: ''
  });

  useEffect(() => {
    loadPatientDetails();
  }, [patientId]);

  const loadPatientDetails = async () => {
    try {
      const res = await axiosInstance.get(`/patients/${patientId}`);
      setPatient(res.data.patient);
    } catch (error) {
      setToast({ message: 'Failed to load patient details', type: 'error' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setForm(prev => ({
        ...prev,
        [section]: { ...prev[section], [field]: value }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axiosInstance.post(`/patients/${patientId}/doctor-visits`, {
        ...form,
        doctorId: user.doctorId
      });
      
      setToast({ message: 'Doctor visit recorded successfully', type: 'success' });
      navigate(`/admission/${patientId}/summary`);
    } catch (error) {
      setToast({
        message: error?.response?.data?.message || 'Failed to record doctor visit',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!patient) {
    return <div className="p-4">Loading patient details...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">New Doctor Visit</h2>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium mb-2">Patient Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <p><span className="font-medium">Name:</span> {patient.user?.name}</p>
          <p><span className="font-medium">Hospital ID:</span> {patient.hospitalId}</p>
          <p><span className="font-medium">Age:</span> {patient.age}</p>
          <p><span className="font-medium">Gender:</span> {patient.gender}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
              <select
                name="visitType"
                value={form.visitType}
                onChange={handleChange}
                className="input w-full"
                required
              >
                <option value="routine">Routine Check</option>
                <option value="follow_up">Follow-up</option>
                <option value="emergency">Emergency</option>
                <option value="consultation">Consultation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
              <input
                type="date"
                name="followUpDate"
                value={form.followUpDate}
                onChange={handleChange}
                className="input w-full"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Vitals</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
                <input
                  type="number"
                  name="vitals.temperature"
                  value={form.vitals.temperature}
                  onChange={handleChange}
                  step="0.1"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
                <input
                  type="text"
                  name="vitals.bloodPressure"
                  value={form.vitals.bloodPressure}
                  onChange={handleChange}
                  placeholder="e.g. 120/80"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pulse (bpm)</label>
                <input
                  type="number"
                  name="vitals.pulse"
                  value={form.vitals.pulse}
                  onChange={handleChange}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate</label>
                <input
                  type="number"
                  name="vitals.respiratoryRate"
                  value={form.vitals.respiratoryRate}
                  onChange={handleChange}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">O₂ Saturation (%)</label>
                <input
                  type="number"
                  name="vitals.oxygenSaturation"
                  value={form.vitals.oxygenSaturation}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="input w-full"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Clinical Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                <textarea
                  name="symptoms"
                  value={form.symptoms}
                  onChange={handleChange}
                  rows="3"
                  className="input w-full"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
                <textarea
                  name="clinicalNotes"
                  value={form.clinicalNotes}
                  onChange={handleChange}
                  rows="3"
                  className="input w-full"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Code</label>
                <input
                  type="text"
                  name="diagnosis.code"
                  value={form.diagnosis.code}
                  onChange={handleChange}
                  placeholder="ICD-10 code"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Description</label>
                <textarea
                  name="diagnosis.description"
                  value={form.diagnosis.description}
                  onChange={handleChange}
                  rows="2"
                  className="input w-full"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Notes</label>
                <textarea
                  name="diagnosis.notes"
                  value={form.diagnosis.notes}
                  onChange={handleChange}
                  rows="2"
                  className="input w-full"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prescription</label>
                <textarea
                  name="prescription"
                  value={form.prescription}
                  onChange={handleChange}
                  rows="3"
                  className="input w-full"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
                <textarea
                  name="recommendations"
                  value={form.recommendations}
                  onChange={handleChange}
                  rows="3"
                  className="input w-full"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/admission/${patientId}/summary`)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-brand"
            disabled={loading}
          >
            {loading ? 'Recording Visit...' : 'Record Visit'}
          </button>
        </div>
      </form>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}