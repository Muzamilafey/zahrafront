import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function LabRequests() {
  const { axiosInstance } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const params = new URLSearchParams({ 
          status: filters.status,
          date: filters.date 
        }).toString();
        
        const response = await axiosInstance.get(`/api/lab/requests?${params}`);
        setRequests(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching lab requests:', error);
        setLoading(false);
      }
    };

    fetchRequests();
  }, [axiosInstance, filters]);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-4">Loading requests...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Laboratory Requests</h1>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Results</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {request._id}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{request.patient.name}</div>
                  <div className="text-sm text-gray-500">ID: {request.patient.hospitalId}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{request.doctor.name}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {request.test.name}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(request.status)}`}>
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {request.results ? (
                    <div>
                      <div className="text-gray-900">Value: {request.results.value}</div>
                      <div className="text-gray-500">Range: {request.results.range}</div>
                    </div>
                  ) : (
                    <span className="text-gray-500">Pending</span>
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