import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import Toast from '../../../components/ui/Toast';

export default function NewMealBill() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [patient, setPatient] = useState(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    meals: [
      { type: 'breakfast', description: '', amount: '' },
      { type: 'lunch', description: '', amount: '' },
      { type: 'dinner', description: '', amount: '' },
      { type: 'snacks', description: '', amount: '' }
    ],
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
      console.error('Failed to load patient details:', error);
      setToast({ message: 'Failed to load patient details', type: 'error' });
    }
  };

  const handleMealChange = (index, field, value) => {
    setForm(prev => {
      const newMeals = [...prev.meals];
      newMeals[index] = { ...newMeals[index], [field]: value };
      
      // Recalculate total amount
      const total = newMeals.reduce((sum, meal) => {
        return sum + (parseFloat(meal.amount) || 0);
      }, 0);

      return { ...prev, meals: newMeals, totalAmount: total };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axiosInstance.post(`/patients/${patientId}/meal-bills`, form);
      setToast({ message: 'Meal bill recorded successfully', type: 'success' });
      navigate(`/admission/${patientId}/summary`);
    } catch (error) {
      console.error('Failed to record meal bill:', error);
      setToast({
        message: error?.response?.data?.message || 'Failed to record meal bill',
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
      <h2 className="text-2xl font-semibold mb-4">New Meal Bill</h2>
      
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
                value={form.date}
                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                className="input w-full"
                required
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Meals</h3>
              {form.meals.map((meal, index) => (
                <div key={meal.type} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {meal.type}
                    </label>
                    <input
                      type="text"
                      value={meal.description}
                      onChange={(e) => handleMealChange(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input
                      type="number"
                      value={meal.amount}
                      onChange={(e) => handleMealChange(index, 'amount', e.target.value)}
                      placeholder="0.00"
                      className="input w-full"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                className="input w-full"
                rows="3"
                placeholder="Any additional notes..."
              ></textarea>
            </div>

            <div className="border-t pt-4">
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
            {loading ? 'Recording Bill...' : 'Record Bill'}
          </button>
        </div>
      </form>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}