import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function LeavesPage() {
  const [leaves, setLeaves] = useState([
    { id: 1, name: 'John Doe', type: 'Sick Leave', from: '2024-01-15', to: '2024-01-17', days: 3, status: 'Approved' },
    { id: 2, name: 'Jane Smith', type: 'Annual Leave', from: '2024-01-20', to: '2024-02-05', days: 17, status: 'Pending' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ employeeName: '', type: 'Annual Leave', from: '', to: '', days: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLeaves([...leaves, { id: leaves.length + 1, ...formData, status: 'Pending' }]);
    setFormData({ employeeName: '', type: 'Annual Leave', from: '', to: '', days: '' });
    setShowForm(false);
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
            <input name="employeeName" value={formData.employeeName} onChange={handleChange} placeholder="Employee Name" className="border border-gray-300 rounded-lg px-4 py-2" required />
            <select name="type" value={formData.type} onChange={handleChange} className="border border-gray-300 rounded-lg px-4 py-2">
              <option value="Annual Leave">Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Maternity Leave">Maternity Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
            </select>
            <input name="from" value={formData.from} onChange={handleChange} placeholder="From Date" type="date" className="border border-gray-300 rounded-lg px-4 py-2" required />
            <input name="to" value={formData.to} onChange={handleChange} placeholder="To Date" type="date" className="border border-gray-300 rounded-lg px-4 py-2" required />
            <input name="days" value={formData.days} onChange={handleChange} placeholder="Number of Days" type="number" className="border border-gray-300 rounded-lg px-4 py-2" required />
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
            {leaves.map(leave => (
              <tr key={leave.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-gray-900">{leave.employeeName}</td>
                <td className="py-4 px-6 text-gray-600">{leave.type}</td>
                <td className="py-4 px-6 text-gray-600">{leave.from} - {leave.to}</td>
                <td className="py-4 px-6 text-gray-600">{leave.days}</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${leave.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {leave.status}
                  </span>
                </td>
                <td className="py-4 px-6 flex justify-center">
                  <button className="p-2 hover:bg-red-100 rounded-lg text-red-600"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
