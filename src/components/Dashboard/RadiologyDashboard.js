import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function RadiologyDashboard() {
  const { axiosInstance, user } = useContext(AuthContext);
  const [stats, setStats] = useState({ pending: 0, completed: 0 });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/radiology/dashboard');
        // backend returns { pending, completed, recent }
        setStats({ pending: res.data.pending || 0, completed: res.data.completed || 0 });
        setRequests(res.data.recent || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to fetch radiology dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [axiosInstance]);

  if (loading) return <div className="p-6">Loading radiology dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Radiology Dashboard</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-sm text-gray-600">Pending Tests</div>
          <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-gray-600">Completed Tests</div>
          <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
        </div>
      </div>

      {/* Recent Requests Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Radiology Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Patient</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Test Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Urgency</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm">{req.patient?.user?.name || `${req.patient?.firstName || ''} ${req.patient?.lastName || ''}`.trim() || '—'}</td>
                    <td className="px-6 py-3 text-sm">{req.testName}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        req.status === 'completed' ? 'bg-green-100 text-green-800' :
                        req.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">{req.urgency}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No radiology requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
