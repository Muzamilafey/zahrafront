import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function MortuaryDashboard() {
  const { axiosInstance, user } = useContext(AuthContext);
  const [stats, setStats] = useState({ current: 0, released: 0 });
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/mortuary/dashboard');
        // backend returns { admitted, released, recent }
        setStats({ current: res.data.admitted || 0, released: res.data.released || 0 });
        setAdmissions(res.data.recent || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to fetch mortuary dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [axiosInstance]);

  if (loading) return <div className="p-6">Loading mortuary dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mortuary Dashboard</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-sm text-gray-600">Current Cases</div>
          <div className="text-3xl font-bold text-red-600">{stats.current}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-gray-600">Released</div>
          <div className="text-3xl font-bold text-blue-600">{stats.released}</div>
        </div>
      </div>

      {/* Recent Admissions Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Mortuary Admissions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Patient</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cause of Death</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Next of Kin</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {admissions.length > 0 ? (
                admissions.map((admission) => (
                  <tr key={admission._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm">{admission.patientName}</td>
                    <td className="px-6 py-3 text-sm">{admission.causeOfDeath}</td>
                    <td className="px-6 py-3 text-sm">{admission.nextOfKin}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        admission.status === 'released' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {admission.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No mortuary admissions found
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
