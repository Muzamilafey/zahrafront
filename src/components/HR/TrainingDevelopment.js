import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { FaPlus, FaEye, FaEdit, FaTrash } from 'react-icons/fa';

export default function TrainingDevelopment() {
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useToast();
  const [trainings, setTrainings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', date: '', duration: '', instructor: '', participants: [], status: 'scheduled' });

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const res = await axiosInstance.get('/api/trainings');
      setTrainings(res.data.data || []);
    } catch (err) {
      showToast('Failed to load trainings', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/trainings', formData);
      showToast('Training recorded', 'success');
      setShowForm(false);
      setFormData({ title: '', date: '', duration: '', instructor: '', participants: [], status: 'scheduled' });
      fetchTrainings();
    } catch (err) {
      showToast('Failed to record training', 'error');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Training & Development</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
          <FaPlus /> Schedule Training
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg mb-6 border border-gray-200">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Training Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="number" placeholder="Duration (hours)" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="border rounded px-3 py-2" />
            <input type="text" placeholder="Instructor" value={formData.instructor} onChange={e => setFormData({...formData, instructor: e.target.value})} className="border rounded px-3 py-2" />
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="border rounded px-3 py-2">
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-900 px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg overflow-hidden shadow">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Title</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Date</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Instructor</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {trainings.map(t => (
              <tr key={t._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3">{t.title}</td>
                <td className="px-6 py-3">{t.date}</td>
                <td className="px-6 py-3">{t.instructor}</td>
                <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
