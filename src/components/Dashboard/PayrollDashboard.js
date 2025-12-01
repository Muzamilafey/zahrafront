import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function PayrollDashboard() {
  const { axiosInstance, user } = useContext(AuthContext);
  const [stats, setStats] = useState({ processed: 0, pending: 0, totalPaid: 0 });
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/payroll/dashboard');
        setStats(res.data.stats);
        setPayrolls(res.data.recentPayrolls);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to fetch payroll dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [axiosInstance]);

  if (loading) return <div className="p-6">Loading payroll dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Payroll Dashboard</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-gray-600">Processed</div>
          <div className="text-3xl font-bold text-green-600">{stats.processed}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-sm text-gray-600">Pending Approval</div>
          <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-gray-600">Total Paid</div>
          <div className="text-3xl font-bold text-blue-600">₹{stats.totalPaid.toLocaleString()}</div>
        </div>
      </div>

      {/* Recent Payrolls Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Payroll Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Employee</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Month/Year</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Net Salary</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.length > 0 ? (
                payrolls.map((payroll) => (
                  <tr key={payroll._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm">{payroll.employeeName}</td>
                    <td className="px-6 py-3 text-sm">{payroll.month}/{payroll.year}</td>
                    <td className="px-6 py-3 text-sm">₹{payroll.netSalary.toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        payroll.status === 'approved' ? 'bg-green-100 text-green-800' :
                        payroll.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payroll.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No payroll records found
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
