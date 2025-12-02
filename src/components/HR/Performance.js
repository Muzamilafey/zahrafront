import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { FaPlus } from 'react-icons/fa';

export default function Performance() {
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ employeeId: '', period: 'quarterly', kpis: '', score: '', feedback: '', status: 'draft' });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await axiosInstance.get('/api/performance');
      setReviews(res.data.data || []);
    } catch (err) {
      showToast('Failed to load reviews', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/performance', formData);
      showToast('Performance review saved', 'success');
      setShowForm(false);
      setFormData({ employeeId: '', period: 'quarterly', kpis: '', score: '', feedback: '', status: 'draft' });
      fetchReviews();
    } catch (err) {
      showToast('Failed to save review', 'error');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Performance Management</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
          <FaPlus /> New Review
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg mb-6 border border-gray-200">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Employee ID" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="border rounded px-3 py-2" required />
            <select value={formData.period} onChange={e => setFormData({...formData, period: e.target.value})} className="border rounded px-3 py-2">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
            <textarea placeholder="KPIs" value={formData.kpis} onChange={e => setFormData({...formData, kpis: e.target.value})} className="border rounded px-3 py-2"></textarea>
            <input type="number" placeholder="Score (0-100)" value={formData.score} onChange={e => setFormData({...formData, score: e.target.value})} className="border rounded px-3 py-2" max="100" />
            <textarea placeholder="Feedback" value={formData.feedback} onChange={e => setFormData({...formData, feedback: e.target.value})} className="border rounded px-3 py-2 md:col-span-2"></textarea>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="border rounded px-3 py-2">
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="approved">Approved</option>
            </select>
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700">Save Review</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-900 px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg overflow-hidden shadow">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Employee</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Period</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Score</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3">{r.employeeId}</td>
                <td className="px-6 py-3">{r.period}</td>
                <td className="px-6 py-3">{r.score}/100</td>
                <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
