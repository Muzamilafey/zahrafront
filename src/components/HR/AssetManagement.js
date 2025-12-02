import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { FaPlus } from 'react-icons/fa';

export default function AssetManagement() {
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useToast();
  const [assets, setAssets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ assetName: '', serialNumber: '', employeeId: '', category: '', issuedDate: '', status: 'active' });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await axiosInstance.get('/api/assets');
      setAssets(res.data.data || []);
    } catch (err) {
      showToast('Failed to load assets', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/assets', formData);
      showToast('Asset recorded', 'success');
      setShowForm(false);
      setFormData({ assetName: '', serialNumber: '', employeeId: '', category: '', issuedDate: '', status: 'active' });
      fetchAssets();
    } catch (err) {
      showToast('Failed to record asset', 'error');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Asset Management</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
          <FaPlus /> Issue Asset
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg mb-6 border border-gray-200">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Asset Name" value={formData.assetName} onChange={e => setFormData({...formData, assetName: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="text" placeholder="Serial Number" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="text" placeholder="Employee ID" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="text" placeholder="Category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="border rounded px-3 py-2" />
            <input type="date" value={formData.issuedDate} onChange={e => setFormData({...formData, issuedDate: e.target.value})} className="border rounded px-3 py-2" required />
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="border rounded px-3 py-2">
              <option value="active">Active</option>
              <option value="returned">Returned</option>
              <option value="damaged">Damaged</option>
              <option value="lost">Lost</option>
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
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Asset</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Serial Number</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Employee</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(a => (
              <tr key={a._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3">{a.assetName}</td>
                <td className="px-6 py-3">{a.serialNumber}</td>
                <td className="px-6 py-3">{a.employeeId}</td>
                <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${a.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
