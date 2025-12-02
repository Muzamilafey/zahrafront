import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { FaPlus } from 'react-icons/fa';

export default function DisciplinaryActions() {
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useToast();
  const [cases, setCases] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ employeeId: '', incident: '', warningType: '', date: '', status: 'pending' });

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await axiosInstance.get('/api/disciplinary');
      setCases(res.data.data || []);
    } catch (err) {
      showToast('Failed to load cases', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/disciplinary', formData);
      showToast('Disciplinary case recorded', 'success');
      setShowForm(false);
      setFormData({ employeeId: '', incident: '', warningType: '', date: '', status: 'pending' });
      fetchCases();
    } catch (err) {
      showToast('Failed to record case', 'error');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Disciplinary Actions</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
          <FaPlus /> New Case
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg mb-6 border border-gray-200">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Employee ID" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="border rounded px-3 py-2" required />
            <textarea placeholder="Incident Description" value={formData.incident} onChange={e => setFormData({...formData, incident: e.target.value})} className="border rounded px-3 py-2 md:col-span-2"></textarea>
            <select value={formData.warningType} onChange={e => setFormData({...formData, warningType: e.target.value})} className="border rounded px-3 py-2">
              <option value="">Select Warning Type</option>
              <option value="verbal">Verbal Warning</option>
              <option value="written">Written Warning</option>
              <option value="suspension">Suspension</option>
              <option value="termination">Termination</option>
            </select>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="border rounded px-3 py-2">
              <option value="pending">Pending</option>
              <option value="under_investigation">Under Investigation</option>
              <option value="hearing_scheduled">Hearing Scheduled</option>
              <option value="resolved">Resolved</option>
            </select>
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700">Record Case</button>
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
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Incident</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Warning Type</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {cases.map(c => (
              <tr key={c._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3">{c.employeeId}</td>
                <td className="px-6 py-3">{c.incident.substring(0, 50)}...</td>
                <td className="px-6 py-3">{c.warningType}</td>
                <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${c.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
