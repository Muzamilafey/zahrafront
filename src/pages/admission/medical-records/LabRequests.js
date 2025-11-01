import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import Toast from '../../../components/ui/Toast';

export default function LabRequests() {
  const { id: patientId } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadLabRequests();
    // eslint-disable-next-line
  }, [patientId]);

  const loadLabRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/patients/${patientId}/lab-requests`);
      setRequests(res.data.requests || []);
    } catch (error) {
      setToast({ message: error?.response?.data?.message || 'Failed to load lab requests', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Lab Requests</h2>
      {loading ? (
        <div>Loading...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-4 text-gray-500">No lab requests found for this patient.</div>
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
