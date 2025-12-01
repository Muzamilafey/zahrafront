import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function OutpatientDashboard() {
  const { axiosInstance, user } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, today: 0 });
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/outpatient/dashboard');
        // backend returns { total, recent }
        setStats({ total: res.data.total || 0, today: 0 });
        setVisits(res.data.recent || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to fetch outpatient dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [axiosInstance]);

  if (loading) return <div className="p-6">Loading outpatient dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Outpatient Dashboard</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-gray-600">Total Visits</div>
          <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-gray-600">Today's Visits</div>
          <div className="text-3xl font-bold text-green-600">{stats.today}</div>
        </div>
      </div>

      {/* Recent Visits Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Outpatient Visits</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Patient</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">MRN</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Registered</th>
              </tr>
            </thead>
            <tbody>
              {visits.length > 0 ? (
                visits.map((p) => (
                  <tr key={p._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm">{p.user?.name || `${p.firstName} ${p.lastName}`}</td>
                    <td className="px-6 py-3 text-sm">{p.mrn}</td>
                    <td className="px-6 py-3 text-sm">{p.phonePrimary}</td>
                    <td className="px-6 py-3 text-sm">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No outpatient patients found
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
