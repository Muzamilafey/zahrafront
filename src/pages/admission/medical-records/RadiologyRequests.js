import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import Toast from '../../../components/ui/Toast';

export default function RadiologyRequests() {
  const { id: patientId } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    testName: '',
    notes: ''
  });

  useEffect(() => {
    loadRadiologyRequests();
    // eslint-disable-next-line
  }, [patientId]);

  const loadRadiologyRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/patients/${patientId}/radiology-requests`);
      setRequests(res.data.requests || []);
    } catch (error) {
      console.error('Failed to load radiology requests:', error);
      setToast({ message: error?.response?.data?.message || 'Failed to load radiology requests', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleNewRequestChange = (e) => {
    const { name, value } = e.target;
    setNewRequest(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewRequest = async (e) => {
    e.preventDefault();
    if (!newRequest.testName) {
      setToast({ message: 'Test name is a required field.', type: 'error' });
      return;
    }
    try {
      await axiosInstance.post(`/patients/${patientId}/radiology-requests`, newRequest);
      setToast({ message: 'Radiology request added successfully', type: 'success' });
      setShowForm(false);
      setNewRequest({ testName: '', notes: '' });
      loadRadiologyRequests();
    } catch (error) {
      console.error('Failed to add radiology request:', error);
      setToast({ message: error?.response?.data?.message || 'Failed to add radiology request', type: 'error' });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Radiology Requests</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-brand">
          {showForm ? 'Cancel' : 'Add New Request'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleAddNewRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
              <input
                type="text"
                name="testName"
                value={newRequest.testName}
                onChange={handleNewRequestChange}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={newRequest.notes}
                onChange={handleNewRequestChange}
                rows="3"
                className="input w-full"
              ></textarea>
            </div>
            <div className="text-right">
              <button type="submit" className="btn-brand">Save Request</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-4 text-gray-500">No radiology requests found for this patient.</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((r) => (
                <tr key={r._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{r.testName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{r.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(r.requestedAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{r.result || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
