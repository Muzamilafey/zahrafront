import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function MaternityDashboard() {
  const { axiosInstance, user } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, inProgress: 0 });
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/maternity/dashboard');
        setStats(res.data.stats);
        setCases(res.data.recentCases);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to fetch maternity dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [axiosInstance]);

  if (loading) return <div className="p-6">Loading maternity dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Maternity Dashboard</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
          <div className="text-sm text-gray-600">Total Cases</div>
          <div className="text-3xl font-bold text-pink-600">{stats.total}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="text-sm text-gray-600">In Progress</div>
          <div className="text-3xl font-bold text-orange-600">{stats.inProgress}</div>
        </div>
      </div>

      {/* Recent Cases Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Maternity Cases</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Patient</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Expected Delivery</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trimester</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Registration Date</th>
              </tr>
            </thead>
            <tbody>
              {cases.length > 0 ? (
                cases.map((matCase) => (
                  <tr key={matCase._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm">{matCase.patientName}</td>
                    <td className="px-6 py-3 text-sm">{new Date(matCase.expectedDeliveryDate).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-sm">{matCase.trimester}</td>
                    <td className="px-6 py-3 text-sm">{new Date(matCase.registrationDate).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No maternity cases found
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
