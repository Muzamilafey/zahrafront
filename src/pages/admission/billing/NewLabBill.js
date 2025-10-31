import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import Toast from '../../../components/ui/Toast';

export default function NewLabBill() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [toast, setToast] = useState(null);
  const [tests, setTests] = useState([]);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    tests: [],
    totalAmount: 0,
    notes: ''
  });

  useEffect(() => {
    loadPatientDetails();
    loadAvailableTests();
  }, [patientId]);

  const loadPatientDetails = async () => {
    try {
      const res = await axiosInstance.get(`/patients/${patientId}`);
      setPatient(res.data.patient);
    } catch (error) {
      setToast({ message: 'Failed to load patient details', type: 'error' });
    }
  };

  const loadAvailableTests = async () => {
    try {
      const res = await axiosInstance.get('/lab-tests');
      setTests(res.data.tests);
    } catch (error) {
      setToast({ message: 'Failed to load available tests', type: 'error' });
    }
  };

  // Calculate total amount whenever tests change
  useEffect(() => {
    const total = form.tests.reduce((sum, test) => sum + (test.price || 0), 0);
    setForm(prev => ({ ...prev, totalAmount: total }));
  }, [form.tests]);

  const handleAddTest = (test) => {
    if (!form.tests.find(t => t._id === test._id)) {
      setForm(prev => ({
        ...prev,
        tests: [...prev.tests, test]
      }));
    }
  };

  const handleRemoveTest = (testId) => {
    setForm(prev => ({
      ...prev,
      tests: prev.tests.filter(test => test._id !== testId)
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
      await axiosInstance.post(`/patients/${patientId}/lab-bills`, form);
      setToast({ message: 'Lab bill recorded successfully', type: 'success' });
      navigate(`/admission/${patientId}/summary`);
    } catch (error) {
      setToast({
        message: error?.response?.data?.message || 'Failed to record lab bill',
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
      <h2 className="text-2xl font-semibold mb-4">New Laboratory Bill</h2>
      
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Laboratory Tests</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Available Tests</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {tests.map(test => (
                      <div key={test._id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50">
                        <span>{test.name}</span>
                        <button
                          type="button"
                          onClick={() => handleAddTest(test)}
                          className="text-brand hover:text-brand-dark"
                          disabled={form.tests.some(t => t._id === test._id)}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Selected Tests</h4>
                  <div className="space-y-2">
                    {form.tests.map(test => (
                      <div key={test._id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50">
                        <div>
                          <span>{test.name}</span>
                          <span className="text-gray-500 ml-2">Ksh {test.price}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTest(test._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {form.tests.length === 0 && (
                      <p className="text-gray-500 text-sm">No tests selected</p>
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
            disabled={loading || form.tests.length === 0}
          >
            {loading ? 'Recording Bill...' : 'Record Lab Bill'}
          </button>
        </div>
      </form>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}