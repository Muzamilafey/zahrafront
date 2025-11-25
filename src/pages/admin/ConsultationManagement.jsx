import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function ConsultationManagement() {
  const { user, axiosInstance } = useContext(AuthContext);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Check if user has access
  if (!user || !['admin', 'doctor', 'nurse'].includes(user.role)) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          <h2 className="font-bold">Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchConsultations();
  }, [activeTab]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      setError('');
      // This endpoint will be created in backend
      const response = await axiosInstance.get('/consultations');
      setConsultations(response.data.consultations || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load consultations');
      console.error('Error fetching consultations:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consultations</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage patient consultations and medical records
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeTab === 'all'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All Consultations
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeTab === 'pending'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeTab === 'completed'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Content */}
      <div className="rounded-lg bg-white shadow">
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
              <p className="mt-4 text-gray-600">Loading consultations...</p>
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No consultations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Patient</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Doctor</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((consultation) => (
                    <tr key={consultation._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{consultation.patient?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{consultation.doctor?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(consultation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            consultation.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {consultation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button className="text-brand-600 hover:text-brand-700">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
