import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function LabTestReview() {
  const { axiosInstance } = useContext(AuthContext);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [resultData, setResultData] = useState({
    value: '',
    notes: '',
  });

  useEffect(() => {
    const fetchPendingTests = async () => {
      try {
        const response = await axiosInstance.get('/lab/orders?status=pending');
        setTests(response.data.orders || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching pending tests:', error);
        setLoading(false);
      }
    };

    fetchPendingTests();
  }, [axiosInstance]);

  const handleTestSelect = (test) => {
    setSelectedTest(test);
    setResultData({
      value: '',
      notes: '',
    });
  };

  const handleSubmitResults = async () => {
    try {
      const form = new FormData();
      form.append('resultsText', `Value: ${resultData.value}\nNotes: ${resultData.notes}`);
      await axiosInstance.put(`/lab/${selectedTest._id}/results`, form, { headers: { 'Content-Type': 'multipart/form-data' } });

      const response = await axiosInstance.get('/lab/orders?status=pending');
      setTests(response.data.orders || []);
      setSelectedTest(null);
      setResultData({ value: '', notes: '' });
    } catch (error) {
      console.error('Error submitting results:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading tests...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Review Lab Tests</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Pending Tests</h2>
          <div className="space-y-4">
            {tests.map((test) => (
              <div 
                key={test._id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedTest?._id === test._id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'}`}
                onClick={() => handleTestSelect(test)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{test.catalog?.name || test.testType || (test.test && test.test.name) || 'N/A'}</h3>
                    <p className="text-sm text-gray-500">Patient: {test.patient?.name || test.patient?.user?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">ID: {test.patient?.hospitalId || test.patient?._id || '—'}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedTest && (
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Enter Test Results</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Test: {selectedTest.catalog?.name || selectedTest.testType || (selectedTest.test && selectedTest.test.name) || 'N/A'}</p>
                <p className="text-sm text-gray-500">Expected Range: {selectedTest.catalog?.normalValue || selectedTest.test?.normalValue || selectedTest.catalog?.normalValue || '—'}</p>
                <p className="text-sm text-gray-500">Start Value: {selectedTest.catalog?.startValue || selectedTest.test?.startValue || '—'}</p>
                <p className="text-sm text-gray-500">End Value: {selectedTest.catalog?.endValue || selectedTest.test?.endValue || '—'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Value Found</label>
                <input
                  type="text"
                  value={resultData.value}
                  onChange={(e) => setResultData({ ...resultData, value: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={resultData.notes}
                  onChange={(e) => setResultData({ ...resultData, notes: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                  placeholder="Add any relevant notes or observations..."
                />
              </div>

              <button
                onClick={handleSubmitResults}
                className="w-full bg-brand-600 text-white py-2 px-4 rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
              >
                Submit Results
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}