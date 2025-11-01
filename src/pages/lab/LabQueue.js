import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { format } from 'date-fns';

export default function LabQueue() {
  const { axiosInstance } = useContext(AuthContext);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const response = await axiosInstance.get('/api/lab/queue');
        setQueue(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching lab queue:', error);
        setLoading(false);
      }
    };

    fetchQueue();
    // Refresh every minute
    const interval = setInterval(fetchQueue, 60 * 1000);
    return () => clearInterval(interval);
  }, [axiosInstance]);

  const updateStatus = async (requestId, status) => {
    try {
      await axiosInstance.patch(`/api/lab/requests/${requestId}/status`, { status });
      // Refresh queue
      const response = await axiosInstance.get('/api/lab/queue');
      setQueue(response.data);
    } catch (error) {
      console.error('Error updating status:', error);
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
                  <div className="text-sm font-medium text-gray-900">{request.patient.name}</div>
                  <div className="text-sm text-gray-500">ID: {request.patient.hospitalId}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{request.test.name}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${request.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {request.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'}`}>
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {request.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(request._id, 'in-progress')}
                      className="text-brand-600 hover:text-brand-900"
                    >
                      Start Test
                    </button>
                  )}
                  {request.status === 'in-progress' && (
                    <button
                      onClick={() => updateStatus(request._id, 'completed')}
                      className="text-green-600 hover:text-green-900"
                    >
                      Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}