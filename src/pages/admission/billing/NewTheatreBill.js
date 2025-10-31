import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import Toast from '../../../components/ui/Toast';

export default function NewTheatreBill() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    procedure: '',
    surgeon: '',
    anesthetist: '',
    theatreCharges: '',
    surgeonFee: '',
    anesthetistFee: '',
    equipmentCharges: '',
    medicationCharges: '',
    otherCharges: '',
    totalAmount: 0,
    notes: ''
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

  // Calculate total amount whenever any fee/charge changes
  useEffect(() => {
    const total = [
      'theatreCharges',
      'surgeonFee',
      'anesthetistFee',
      'equipmentCharges',
      'medicationCharges',
      'otherCharges'
    ].reduce((sum, field) => {
      return sum + (parseFloat(form[field]) || 0);
    }, 0);

    setForm(prev => ({ ...prev, totalAmount: total }));
  }, [
    form.theatreCharges,
    form.surgeonFee,
    form.anesthetistFee,
    form.equipmentCharges,
    form.medicationCharges,
    form.otherCharges
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axiosInstance.post(`/patients/${patientId}/theatre-bills`, form);
      setToast({ message: 'Theatre bill recorded successfully', type: 'success' });
      navigate(`/admission/${patientId}/summary`);
    } catch (error) {
      setToast({
        message: error?.response?.data?.message || 'Failed to record theatre bill',
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
      <h2 className="text-2xl font-semibold mb-4">New Theatre Bill</h2>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium mb-2">Patient Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <p><span className="font-medium">Name:</span> {patient.user?.name}</p>
          <p><span className="font-medium">Hospital ID:</span> {patient.hospitalId}</p>
          <p><span className="font-medium">Ward:</span> {patient.admission?.ward?.name || 'N/A'}</p>
          <p><span className="font-medium">Room:</span> {patient.admission?.room?.name || 'N/A'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Procedure</label>
              <input
                type="text"
                name="procedure"
                value={form.procedure}
                onChange={handleChange}
                className="input w-full"
                required
                placeholder="Name of the procedure"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Surgeon</label>
              <input
                type="text"
                name="surgeon"
                value={form.surgeon}
                onChange={handleChange}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anesthetist</label>
              <input
                type="text"
                name="anesthetist"
                value={form.anesthetist}
                onChange={handleChange}
                className="input w-full"
                required
              />
            </div>

            {/* Charges and Fees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theatre Charges</label>
              <input
                type="number"
                name="theatreCharges"
                value={form.theatreCharges}
                onChange={handleChange}
                className="input w-full"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Surgeon's Fee</label>
              <input
                type="number"
                name="surgeonFee"
                value={form.surgeonFee}
                onChange={handleChange}
                className="input w-full"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anesthetist's Fee</label>
              <input
                type="number"
                name="anesthetistFee"
                value={form.anesthetistFee}
                onChange={handleChange}
                className="input w-full"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Charges</label>
              <input
                type="number"
                name="equipmentCharges"
                value={form.equipmentCharges}
                onChange={handleChange}
                className="input w-full"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medication Charges</label>
              <input
                type="number"
                name="medicationCharges"
                value={form.medicationCharges}
                onChange={handleChange}
                className="input w-full"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Other Charges</label>
              <input
                type="number"
                name="otherCharges"
                value={form.otherCharges}
                onChange={handleChange}
                className="input w-full"
                min="0"
                step="0.01"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows="3"
                className="input w-full"
                placeholder="Any additional notes..."
              ></textarea>
            </div>

            <div className="md:col-span-2 border-t pt-4">
              <div className="text-xl font-medium flex justify-between">
                <span>Total Amount:</span>
                <span>{form.totalAmount.toFixed(2)}</span>
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
            {loading ? 'Recording Bill...' : 'Record Theatre Bill'}
          </button>
        </div>
      </form>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}