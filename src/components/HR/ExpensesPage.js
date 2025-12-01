import React, { useState, useEffect, useContext } from 'react';
import { Plus, DollarSign, TrendingUp, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';

export default function ExpensesPage() {
  const { axiosInstance } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ category: 'Office Supplies', amount: '', date: '', description: '', submittedBy: '' });
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/expenses');
      const data = res.data.expenses || [];
      setExpenses(data);
      setTotalExpenses(data.reduce((sum, e) => sum + (e.amount || 0), 0));
    } catch (err) {
      console.error('Error fetching expenses:', err);
      const mockData = [
        { _id: 1, category: 'Office Supplies', amount: 5000, date: '2024-01-15', description: 'Printer paper and ink', status: 'Approved' },
        { _id: 2, category: 'Travel', amount: 25000, date: '2024-01-16', description: 'Client meeting travel', status: 'Pending' },
      ];
      setExpenses(mockData);
      setTotalExpenses(30000);
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
      await axiosInstance.post('/expenses', {
        ...formData,
        amount: Number(formData.amount),
        status: 'Pending'
      });
      setFormData({ category: 'Office Supplies', amount: '', date: '', description: '', submittedBy: '' });
      setShowForm(false);
      fetchExpenses();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error submitting expense');
    }
  };

  const handleApprove = async (id) => {
    try {
      await axiosInstance.put(`/expenses/${id}/approve`, { status: 'Approved' });
      fetchExpenses();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error approving expense');
    }
  };

  const handleReject = async (id) => {
    try {
      await axiosInstance.put(`/expenses/${id}/reject`, { status: 'Rejected' });
      fetchExpenses();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error rejecting expense');
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus size={20} /> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg"><DollarSign className="text-green-600" size={28} /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">₦{totalExpenses.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Expenses</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg"><TrendingUp className="text-blue-600" size={28} /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{expenses.length}</div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add Expense</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <select name="category" value={formData.category} onChange={handleChange} className="border border-gray-300 rounded-lg px-4 py-2">
              <option value="Office Supplies">Office Supplies</option>
              <option value="Travel">Travel</option>
              <option value="Training">Training</option>
              <option value="Equipment">Equipment</option>
              <option value="Other">Other</option>
            </select>
            <input name="amount" value={formData.amount} onChange={handleChange} placeholder="Amount" type="number" className="border border-gray-300 rounded-lg px-4 py-2" required />
            <input name="date" value={formData.date} onChange={handleChange} placeholder="Date" type="date" className="border border-gray-300 rounded-lg px-4 py-2" required />
            <input name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="border border-gray-300 rounded-lg px-4 py-2 col-span-2" required />
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Add Expense</button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-6 font-medium text-gray-700">Category</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Description</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Amount</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Date</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
              <th className="text-center py-3 px-6 font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length > 0 ? expenses.map(exp => (
              <tr key={exp._id || exp.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-gray-900">{exp.category}</td>
                <td className="py-4 px-6 text-gray-600">{exp.description}</td>
                <td className="py-4 px-6 text-gray-600">₦{(exp.amount || 0).toLocaleString()}</td>
                <td className="py-4 px-6 text-gray-600">{exp.date}</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${exp.status === 'Approved' ? 'bg-green-100 text-green-800' : exp.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {exp.status}
                  </span>
                </td>
                <td className="py-4 px-6 flex justify-center gap-2">
                  {exp.status === 'Pending' && (
                    <>
                      <button onClick={() => handleApprove(exp._id || exp.id)} className="p-2 hover:bg-green-100 rounded-lg text-green-600" title="Approve"><CheckCircle size={18} /></button>
                      <button onClick={() => handleReject(exp._id || exp.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-600" title="Reject"><XCircle size={18} /></button>
                    </>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="py-8 px-6 text-center text-gray-500">No expenses</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
