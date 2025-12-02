import React, { useState, useEffect, useContext } from 'react';
import { Clock, Users, DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function HRDashboard() {
  const { axiosInstance } = useContext(AuthContext);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/employees/dashboard');
        setDashboard(res.data);

        const empRes = await axiosInstance.get('/employees?limit=10');
        setEmployees(empRes.data.employees || []);

        setError(null);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to fetch HR dashboard');
        console.error('HR Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading HR Dashboard...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Hello, {dashboard?.user?.name || 'HR'}</h2>
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{dashboard?.total || 0}</div>
                <div className="text-sm text-gray-600">Total Employees</div>
                <div className="text-xs text-green-600 mt-1">+1 from last day</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{dashboard?.attendanceRate ? `${dashboard.attendanceRate}%` : '—'}</div>
                <div className="text-sm text-gray-600">Attendance Rate</div>
                <div className="text-xs text-red-600 mt-1">{dashboard?.attendanceDeltaText || ''}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{dashboard?.expensesTotal ? `₦${Number(dashboard.expensesTotal).toLocaleString()}` : '—'}</div>
                <div className="text-sm text-gray-600">Expenses</div>
                <div className="text-xs text-green-600 mt-1">{dashboard?.expensesDeltaText || ''}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{dashboard?.newHiresThisMonth || 0}</div>
                <div className="text-sm text-gray-600">Hiring Applicant</div>
                <div className="text-xs text-green-600 mt-1">+10 from last day</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Check In</h3>
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-600 mb-2">{dayOfWeek} {dateStr}</div>
            <div className="text-sm text-gray-500">09:00 - 18:00</div>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
              Check Out
            </button>
            <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">
              Check In
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b border-gray-200">
          <button className="px-6 py-4 font-medium text-purple-600 border-b-2 border-purple-600">Attendance</button>
          <button className="px-6 py-4 font-medium text-gray-600 hover:text-gray-900">Leaves</button>
          <button className="px-6 py-4 font-medium text-gray-600 hover:text-gray-900">Expenses</button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <input type="text" placeholder="Search" className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="text-sm text-gray-600">Today - Unit/Division</div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Periode</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
              </tr>
            </thead>
            <tbody>
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4"><div className="font-medium text-gray-900">{emp.name}</div></td>
                    <td className="py-4 px-4 text-gray-600">{emp.position || emp.department || 'N/A'}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {emp.status === 'active' ? 'Approve' : emp.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">2 Days</td>
                    <td className="py-4 px-4 text-gray-600">{emp.employmentType === 'full-time' ? 'Annual Leaves' : 'Sick Leaves'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 px-4 text-center text-gray-500">No employees found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-6 gap-4">
        <Link to="/hr/employees" className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition">
          <Users size={32} className="mx-auto mb-3 text-purple-600" />
          <div className="font-medium text-gray-900">Employees</div>
        </Link>
        <Link to="/hr/attendance" className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition">
          <Clock size={32} className="mx-auto mb-3 text-blue-600" />
          <div className="font-medium text-gray-900">Attendance</div>
        </Link>
        <Link to="/hr/leaves" className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition">
          <AlertCircle size={32} className="mx-auto mb-3 text-orange-600" />
          <div className="font-medium text-gray-900">Leaves</div>
        </Link>
        <Link to="/hr/expenses" className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition">
          <DollarSign size={32} className="mx-auto mb-3 text-green-600" />
          <div className="font-medium text-gray-900">Expenses</div>
        </Link>
        <Link to="/hr/payroll" className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition">
          <TrendingUp size={32} className="mx-auto mb-3 text-red-600" />
          <div className="font-medium text-gray-900">Payroll</div>
        </Link>
        <Link to="/hr/hiring" className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition">
          <CheckCircle size={32} className="mx-auto mb-3 text-indigo-600" />
          <div className="font-medium text-gray-900">Hiring</div>
        </Link>
      </div>
    </div>
  );
}
