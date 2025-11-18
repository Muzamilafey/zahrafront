import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import Toast from '../../../components/ui/Toast';

export default function NewPharmacyBill() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [toast, setToast] = useState(null);
  const [drugs, setDrugs] = useState([]);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    drugs: [],
    totalAmount: 0,
    notes: ''
  });

  useEffect(() => {
    loadPatientDetails();
    loadAvailableDrugs();
  }, [patientId]);

  const loadPatientDetails = async () => {
    try {
      const res = await axiosInstance.get(`/patients/${patientId}`);
      setPatient(res.data.patient);
    } catch (error) {
      setToast({ message: 'Failed to load patient details', type: 'error' });
    }
  };

  const loadAvailableDrugs = async () => {
    try {
      const res = await axiosInstance.get('/drugs');
      setDrugs(res.data.drugs);
    } catch (error) {
      setToast({ message: 'Failed to load available drugs', type: 'error' });
    }
  };

  const calculateTotal = (drugs) => {
    return drugs.reduce((sum, drug) => sum + (drug.price * drug.quantity), 0);
  };

  const handleAddDrug = (drug) => {
    const existingDrug = form.drugs.find(d => d._id === drug._id);
    if (!existingDrug) {
      const newDrug = { ...drug, quantity: 1 };
      const updatedDrugs = [...form.drugs, newDrug];
      setForm(prev => ({
        ...prev,
        drugs: updatedDrugs,
        totalAmount: calculateTotal(updatedDrugs)
      }));
    }
  };

  const handleRemoveDrug = (drugId) => {
    const updatedDrugs = form.drugs.filter(drug => drug._id !== drugId);
    setForm(prev => ({
      ...prev,
      drugs: updatedDrugs,
      totalAmount: calculateTotal(updatedDrugs)
    }));
  };

  const handleQuantityChange = (drugId, quantity) => {
    const updatedDrugs = form.drugs.map(drug => {
      if (drug._id === drugId) {
        return { ...drug, quantity: parseInt(quantity) || 0 };
      }
      return drug;
    });

    setForm(prev => ({
      ...prev,
      drugs: updatedDrugs,
      totalAmount: calculateTotal(updatedDrugs)
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axiosInstance.post(`/patients/${patientId}/pharmacy-bills`, form);
      setToast({ message: 'Pharmacy bill recorded successfully', type: 'success' });
      navigate(`/admission/${patientId}/summary`);
    } catch (error) {
      setToast({
        message: error?.response?.data?.message || 'Failed to record pharmacy bill',
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
      <h2 className="text-2xl font-semibold mb-4">New Pharmacy Bill</h2>
      
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
          <div className="grid grid-cols-1 gap-6">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Medications</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Available Drugs</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {drugs.map(drug => (
                      <div key={drug._id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50">
                        <div>
                          <span>{drug.name}</span>
                          <span className="text-gray-500 ml-2">Ksh {drug.price}/unit</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddDrug(drug)}
                          className="text-brand hover:text-brand-dark"
                          disabled={form.drugs.some(d => d._id === drug._id)}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Selected Medications</h4>
                  <div className="space-y-2">
                    {form.drugs.map(drug => (
                      <div key={drug._id} className="flex items-center justify-between text-sm p-2 hover:bg-gray-50">
                        <div className="flex-1">
                          <span>{drug.name}</span>
                          <span className="text-gray-500 ml-2">Ksh {drug.price}/unit</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <input
                            type="number"
                            min="1"
                            value={drug.quantity}
                            onChange={(e) => handleQuantityChange(drug._id, e.target.value)}
                            className="input w-20"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveDrug(drug._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    {form.drugs.length === 0 && (
                      <p className="text-gray-500 text-sm">No medications selected</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
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

            <div className="border-t pt-4">
              <div className="text-xl font-medium flex justify-between">
                <span>Total Amount:</span>
                <span>Ksh {form.totalAmount}</span>
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
            disabled={loading || form.drugs.length === 0}
          >
            {loading ? 'Recording Bill...' : 'Record Pharmacy Bill'}
          </button>
        </div>
      </form>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}