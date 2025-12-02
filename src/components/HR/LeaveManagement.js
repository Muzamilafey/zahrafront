import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { FaPlus, FaCalendar } from 'react-icons/fa';

export default function LeaveManagement() {
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].slice(0, 7));
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'pending'
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await axiosInstance.get('/api/leaves');
      setLeaves(res.data.data || []);
    } catch (err) {
      showToast('Failed to load leaves', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const days = Math.floor((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1;
      await axiosInstance.post('/api/leaves', { ...formData, daysRequested: days });
      showToast('Leave request submitted', 'success');
      setShowForm(false);
      setFormData({ employeeId: '', leaveType: 'annual', startDate: '', endDate: '', reason: '', status: 'pending' });
      fetchLeaves();
    } catch (err) {
      showToast('Failed to submit leave request', 'error');
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    return Math.floor((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
  };

  const leaveBalance = {
    annual: 20,
    sick: 10,
    maternity: 90,
    paternity: 14,
    compassionate: 3
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
          <FaPlus /> Request Leave
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg mb-6 border border-gray-200">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Employee ID" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="border rounded px-3 py-2" required />
            <select value={formData.leaveType} onChange={e => setFormData({...formData, leaveType: e.target.value})} className="border rounded px-3 py-2">
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="maternity">Maternity Leave</option>
              <option value="paternity">Paternity Leave</option>
              <option value="compassionate">Compassionate Leave</option>
            </select>
            <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="border rounded px-3 py-2" required />
            <div className="md:col-span-2 bg-blue-50 p-3 rounded border border-blue-200">
              Days Requested: <span className="font-bold text-lg">{calculateDays(formData.startDate, formData.endDate)}</span>
            </div>
            <textarea placeholder="Reason for leave" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="border rounded px-3 py-2 md:col-span-2"></textarea>
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700">Submit Request</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-900 px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(leaveBalance).map(([type, days]) => (
          <div key={type} className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-brand-600">{days}</div>
            <div className="text-gray-600 text-xs capitalize">{type} Leave</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FaCalendar /> Leave Calendar
        </h2>
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="border rounded px-3 py-2" />
      </div>

      <div className="bg-white rounded-lg overflow-hidden shadow">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Employee</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Leave Type</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Start Date</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">End Date</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Days</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave) => (
              <tr key={leave._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3">{leave.employeeId}</td>
                <td className="px-6 py-3 capitalize">{leave.leaveType}</td>
                <td className="px-6 py-3">{new Date(leave.startDate).toLocaleDateString()}</td>
                <td className="px-6 py-3">{new Date(leave.endDate).toLocaleDateString()}</td>
                <td className="px-6 py-3 font-bold">{leave.daysRequested || calculateDays(leave.startDate, leave.endDate)}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${getStatusBadge(leave.status)}`}>
                    {leave.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
