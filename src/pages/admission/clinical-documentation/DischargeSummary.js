import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from 'contexts/AuthContext';
import Toast from '../../../components/ui/Toast';

export default function DischargeSummary() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    admissionDate: '',
    dischargeDate: new Date().toISOString().split('T')[0],
    lengthOfStay: 0,
    admittingDiagnosis: '',
    finalDiagnosis: '',
    complications: '',
    procedures: '',
    investigations: '',
    treatmentGiven: '',
    condition: 'stable',
    followUpPlan: '',
    medications: '',
    dietaryAdvice: '',
    activityRestrictions: '',
    specialInstructions: '',
    reviewDate: ''
  });

  useEffect(() => {
    loadPatientDetails();
  }, [patientId]);

  const loadPatientDetails = async () => {
    try {
      const res = await axiosInstance.get(`/patients/${patientId}`);
      const patient = res.data.patient;
      setPatient(patient);
      
      if (patient.admission?.admittedAt) {
        const admissionDate = new Date(patient.admission.admittedAt);
        const today = new Date();
        const lengthOfStay = Math.ceil((today - admissionDate) / (1000 * 60 * 60 * 24));
        
        setForm(prev => ({
          ...prev,
          admissionDate: admissionDate.toISOString().split('T')[0],
          lengthOfStay
        }));
      }
    } catch (error) {
      setToast({ message: 'Failed to load patient details', type: 'error' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axiosInstance.post(`/patients/${patientId}/discharge-summary`, form);
      setToast({ message: 'Discharge summary created successfully', type: 'success' });
      navigate(`/admission/${patientId}/summary`);
    } catch (error) {
      setToast({
        message: error?.response?.data?.message || 'Failed to create discharge summary',
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
      <h2 className="text-2xl font-semibold mb-4">Discharge Summary</h2>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium mb-2">Patient Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <p><span className="font-medium">Name:</span> {patient.user?.name}</p>
          <p><span className="font-medium">Hospital ID:</span> {patient.hospitalId}</p>
          <p><span className="font-medium">Age:</span> {patient.age}</p>
          <p><span className="font-medium">Gender:</span> {patient.gender}</p>
          <p><span className="font-medium">Ward:</span> {patient.admission?.ward?.name || 'N/A'}</p>
          <p><span className="font-medium">Doctor:</span> {patient.admission?.doctor?.user?.name || 'N/A'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dates and Length of Stay */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
              <input
                type="date"
                name="admissionDate"
                value={form.admissionDate}
                onChange={handleChange}
                className="input w-full"
                required
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Date</label>
              <input
                type="date"
                name="dischargeDate"
                value={form.dischargeDate}
                onChange={handleChange}
                className="input w-full"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Length of Stay</label>
              <input
                type="number"
                name="lengthOfStay"
                value={form.lengthOfStay}
                readOnly
                className="input w-full bg-gray-50"
              />
            </div>

            {/* Diagnoses */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admitting Diagnosis</label>
              <textarea
                name="admittingDiagnosis"
                value={form.admittingDiagnosis}
                onChange={handleChange}
                rows="2"
                className="input w-full"
                required
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Final Diagnosis</label>
              <textarea
                name="finalDiagnosis"
                value={form.finalDiagnosis}
                onChange={handleChange}
                rows="2"
                className="input w-full"
                required
              ></textarea>
            </div>

            {/* Clinical Course */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Complications (if any)</label>
              <textarea
                name="complications"
                value={form.complications}
                onChange={handleChange}
                rows="2"
                className="input w-full"
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Procedures Performed</label>
              <textarea
                name="procedures"
                value={form.procedures}
                onChange={handleChange}
                rows="2"
                className="input w-full"
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Investigations</label>
              <textarea
                name="investigations"
                value={form.investigations}
                onChange={handleChange}
                rows="2"
                className="input w-full"
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Given</label>
              <textarea
                name="treatmentGiven"
                value={form.treatmentGiven}
                onChange={handleChange}
                rows="3"
                className="input w-full"
                required
              ></textarea>
            </div>

            {/* Discharge Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition at Discharge</label>
              <select
                name="condition"
                value={form.condition}
                onChange={handleChange}
                className="input w-full"
                required
              >
                <option value="stable">Stable</option>
                <option value="improved">Improved</option>
                <option value="unchanged">Unchanged</option>
                <option value="deteriorated">Deteriorated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Date</label>
              <input
                type="date"
                name="reviewDate"
                value={form.reviewDate}
                onChange={handleChange}
                className="input w-full"
                min={form.dischargeDate}
              />
            </div>

            {/* Discharge Instructions */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Medications at Discharge</label>
              <textarea
                name="medications"
                value={form.medications}
                onChange={handleChange}
                rows="3"
                className="input w-full"
                required
                placeholder="List all medications with dosage and duration..."
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Plan</label>
              <textarea
                name="followUpPlan"
                value={form.followUpPlan}
                onChange={handleChange}
                rows="2"
                className="input w-full"
                required
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Advice</label>
              <textarea
                name="dietaryAdvice"
                value={form.dietaryAdvice}
                onChange={handleChange}
                rows="2"
                className="input w-full"
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Restrictions</label>
              <textarea
                name="activityRestrictions"
                value={form.activityRestrictions}
                onChange={handleChange}
                rows="2"
                className="input w-full"
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
              <textarea
                name="specialInstructions"
                value={form.specialInstructions}
                onChange={handleChange}
                rows="2"
                className="input w-full"
              ></textarea>
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
            {loading ? 'Creating Summary...' : 'Create Discharge Summary'}
          </button>
        </div>
      </form>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}