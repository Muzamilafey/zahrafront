import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';

export default function CreateLabRequest() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { axiosInstance, user } = useContext(AuthContext);

  const [labTestsCatalog, setLabTestsCatalog] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('routine');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchLabTestsCatalog();
  }, []);

  const fetchLabTestsCatalog = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/lab/catalog');
      setLabTestsCatalog(response.data.catalog);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch lab test catalog');
      setToast({ type: 'error', message: error });
    } finally {
      setLoading(false);
    }
  };

  const handleTestSelection = (testId) => {
    setSelectedTests(prev =>
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedTests.length === 0) {
      setToast({ type: 'error', message: 'Please select at least one lab test.' });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // For simplicity, we'll create one lab request per selected test.
      // A more complex implementation might group them or allow multiple tests per request.
      for (const testId of selectedTests) {
        const selectedCatalogTest = labTestsCatalog.find(test => test._id === testId);
        if (!selectedCatalogTest) continue;

        const payload = {
          patientId,
          catalogId: testId,
          testType: selectedCatalogTest.name, // Use name from catalog as testType
          notes,
          priority,
          // doctorId will be resolved by the backend based on the logged-in user or patient's assigned doctor
        };
        await axiosInstance.post('/lab/requests', payload);
      }
      setToast({ type: 'success', message: 'Lab request(s) created successfully!' });
      navigate(`/patients/${patientId}`); // Go back to patient detail page
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create lab request(s).');
      setToast({ type: 'error', message: error });
    } finally {
      setLoading(false);
    }
  };

  if (loading && labTestsCatalog.length === 0) return <div className="p-6">Loading lab test catalog...</div>;
  if (error && !toast) return <div className="p-6 text-red-600">{error}</div>; // Display error if toast not yet shown

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Create New Lab Request for Patient {patientId}</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="labTests">
            Select Lab Tests:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border p-3 rounded">
            {labTestsCatalog.length > 0 ? (
              labTestsCatalog.map(test => (
                <div key={test._id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={test._id}
                    checked={selectedTests.includes(test._id)}
                    onChange={() => handleTestSelection(test._id)}
                    className="mr-2"
                  />
                  <label htmlFor={test._id} className="text-gray-900">
                    {test.name} ({test.price ? `$${test.price.toFixed(2)}` : 'Free'})
                  </label>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No lab tests available in catalog.</p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="priority">
            Priority:
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="stat">STAT</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
            Notes / Clinical Indications:
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="4"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter any relevant notes or clinical indications..."
          ></textarea>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading || selectedTests.length === 0}
          >
            {loading ? 'Creating...' : 'Create Lab Request'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/patients/${patientId}`)}
            className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
          >
            Cancel
          </button>
        </div>
      </form>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
