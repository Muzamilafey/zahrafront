import React, { useState, useEffect, useContext } from 'react';
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';

export default function LeavesPage() {
  const { axiosInstance } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ employeeId: '', type: 'Annual Leave', from: '', to: '', days: '', reason: '' });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/leaves');
      setLeaves(res.data.leaves || []);
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setLeaves([
        { _id: 1, employeeName: 'John Doe', type: 'Sick Leave', from: '2024-01-15', to: '2024-01-17', days: 3, status: 'Approved' },
        { _id: 2, employeeName: 'Jane Smith', type: 'Annual Leave', from: '2024-01-20', to: '2024-02-05', days: 17, status: 'Pending' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fromDate = new Date(formData.from);
      const toDate = new Date(formData.to);
      const days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
      
      await axiosInstance.post('/leaves', {
        ...formData,
        days,
        status: 'Pending'
      });
      setFormData({ employeeId: '', type: 'Annual Leave', from: '', to: '', days: '', reason: '' });
      setShowForm(false);
      fetchLeaves();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error submitting leave request');
    }
  };

  const handleApprove = async (id) => {
    try {
      await axiosInstance.put(`/leaves/${id}/approve`, { status: 'Approved' });
      fetchLeaves();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error approving leave');
    }
  };

  const handleReject = async (id) => {
    try {
      await axiosInstance.put(`/leaves/${id}/reject`, { status: 'Rejected' });
      fetchLeaves();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error rejecting leave');
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus size={20} /> Request Leave
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Request Leave</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <select name="employeeId" value={formData.employeeId} onChange={handleChange} className="border border-gray-300 rounded-lg px-4 py-2" required>
              <option value="">Select Employee</option>
              <option value="EMP001">John Doe</option>
              <option value="EMP002">Jane Smith</option>
              <option value="EMP003">Mike Johnson</option>
            </select>
            <select name="type" value={formData.type} onChange={handleChange} className="border border-gray-300 rounded-lg px-4 py-2">
              <option value="Annual Leave">Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Maternity Leave">Maternity Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
            </select>
            <input name="from" value={formData.from} onChange={handleChange} placeholder="From Date" type="date" className="border border-gray-300 rounded-lg px-4 py-2" required />
            <input name="to" value={formData.to} onChange={handleChange} placeholder="To Date" type="date" className="border border-gray-300 rounded-lg px-4 py-2" required />
            <textarea name="reason" value={formData.reason} onChange={handleChange} placeholder="Reason for leave" className="border border-gray-300 rounded-lg px-4 py-2 col-span-2" />
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Submit</button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-6 font-medium text-gray-700">Employee</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Leave Type</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">From - To</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Days</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
              <th className="text-center py-3 px-6 font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length > 0 ? leaves.map(leave => (
              <tr key={leave._id || leave.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-gray-900">{leave.employeeName}</td>
                <td className="py-4 px-6 text-gray-600">{leave.type}</td>
                <td className="py-4 px-6 text-gray-600">{leave.from} - {leave.to}</td>
                <td className="py-4 px-6 text-gray-600">{leave.days}</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${leave.status === 'Approved' ? 'bg-green-100 text-green-800' : leave.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {leave.status}
                  </span>
                </td>
                <td className="py-4 px-6 flex justify-center gap-2">
                  {leave.status === 'Pending' && (
                    <>
                      <button onClick={() => handleApprove(leave._id || leave.id)} className="p-2 hover:bg-green-100 rounded-lg text-green-600" title="Approve"><CheckCircle size={18} /></button>
                      <button onClick={() => handleReject(leave._id || leave.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-600" title="Reject"><XCircle size={18} /></button>
                    </>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="py-8 px-6 text-center text-gray-500">No leave requests</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
