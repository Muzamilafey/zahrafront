import React, { useState, useEffect, useContext } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import AttachResultsModal from '../../components/lab/AttachResultsModal'; // Import the modal

export default function LabQueue() {
  const { axiosInstance } = useContext(AuthContext);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [showAttachResultsModal, setShowAttachResultsModal] = useState(false);
  const [selectedLabTestId, setSelectedLabTestId] = useState(null);

  const fetchQueue = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/lab/orders');
      setQueue(response.data.orders || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching lab queue:', error);
      setLoading(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const updateStatus = async (requestId, status) => {
    try {
      await axiosInstance.put(`/lab/${requestId}/status`, { status });
      fetchQueue(); // Refresh queue after status update
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const updateSampleStatus = async (requestId, sampleStatus) => {
    try {
      await axiosInstance.put(`/lab/${requestId}/sample-status`, { sampleStatus });
      fetchQueue(); // Refresh queue after sample status update
    } catch (error) {
      console.error('Error updating sample status:', error);
    }
  };

  const handleResultsAttached = () => {
    fetchQueue(); // Refresh queue after results are attached
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'stat': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      case 'routine': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-4">Loading queue...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Laboratory Queue</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sample Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {queue.map((request) => (
              <tr key={request._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {format(new Date(request.createdAt), 'HH:mm')}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{request.patient?.user?.name || request.patient?.name || '—'}</div>
                  <div className="text-sm text-gray-500">ID: {request.patient?.hospitalId || request.patient?._id || '—'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{request.catalog?.name || request.testType || (request.test && request.test.name) || 'N/A'}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(request.priority)}`}>
                    {request.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={request.sampleStatus}
                    onChange={(e) => updateSampleStatus(request._id, e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="not_collected">Not Collected</option>
                    <option value="collected">Collected</option>
                    <option value="sent_to_lab">Sent to Lab</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${request.status === 'requested' || request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      request.status === 'processing' || request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'}`}>
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/labtests/${request._id}`)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </button>
                    {request.status === 'requested' && (
                      <button
                        onClick={() => updateStatus(request._id, 'processing')}
                        className="text-brand-600 hover:text-brand-900"
                      >
                        Start Test
                      </button>
                    )}
                    {request.status === 'processing' && (
                      <button
                        onClick={() => updateStatus(request._id, 'completed')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAttachResultsModal && (
        <AttachResultsModal
          labTestId={selectedLabTestId}
          onClose={() => setShowAttachResultsModal(false)}
          onResultsAttached={handleResultsAttached}
        />
      )}
    </div>
  );
}