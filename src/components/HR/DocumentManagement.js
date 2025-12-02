import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { FaPlus, FaDownload } from 'react-icons/fa';

export default function DocumentManagement() {
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    documentType: '',
    employeeId: '',
    title: '',
    expiryDate: '',
    status: 'active',
    fileName: '',
    issueDate: ''
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axiosInstance.get('/api/documents');
      setDocuments(res.data.data || []);
    } catch (err) {
      showToast('Failed to load documents', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/documents', formData);
      showToast('Document recorded', 'success');
      setShowForm(false);
      setFormData({ documentType: '', employeeId: '', title: '', expiryDate: '', status: 'active', fileName: '', issueDate: '' });
      fetchDocuments();
    } catch (err) {
      showToast('Failed to record document', 'error');
    }
  };

  const getStatusBadge = (status, expiryDate) => {
    const isExpired = new Date(expiryDate) < new Date();
    if (isExpired) return 'bg-red-100 text-red-800';
    if (status === 'active') return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const daysUntilExpiry = (expiryDate) => {
    const days = Math.floor((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Expired';
    if (days === 0) return 'Expires today';
    if (days <= 30) return `${days} days left`;
    return 'Valid';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
          <FaPlus /> Upload Document
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg mb-6 border border-gray-200">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={formData.documentType} onChange={e => setFormData({...formData, documentType: e.target.value})} className="border rounded px-3 py-2" required>
              <option value="">Select Document Type</option>
              <option value="contract">Employment Contract</option>
              <option value="passport">Passport</option>
              <option value="license">Professional License</option>
              <option value="certificate">Certificate</option>
              <option value="identity">Identity Card</option>
              <option value="insurance">Insurance Document</option>
            </select>
            <input type="text" placeholder="Employee ID" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="text" placeholder="Document Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="border rounded px-3 py-2 md:col-span-2" required />
            <input type="date" label="Issue Date" value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} className="border rounded px-3 py-2" />
            <input type="date" label="Expiry Date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="border rounded px-3 py-2" />
            <input type="text" placeholder="File Name" value={formData.fileName} onChange={e => setFormData({...formData, fileName: e.target.value})} className="border rounded px-3 py-2 md:col-span-2" />
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="border rounded px-3 py-2">
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700">Upload</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-900 px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-brand-600">{documents.length}</div>
          <div className="text-gray-600 text-sm">Total Documents</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{documents.filter(d => new Date(d.expiryDate) >= new Date()).length}</div>
          <div className="text-gray-600 text-sm">Valid Documents</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{documents.filter(d => new Date(d.expiryDate) < new Date()).length}</div>
          <div className="text-gray-600 text-sm">Expired</div>
        </div>
      </div>

      <div className="bg-white rounded-lg overflow-hidden shadow">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Employee</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Document Type</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Issue Date</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Expiry</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(doc => (
              <tr key={doc._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3">{doc.employeeId}</td>
                <td className="px-6 py-3">{doc.documentType}</td>
                <td className="px-6 py-3">{new Date(doc.issueDate).toLocaleDateString()}</td>
                <td className="px-6 py-3">{new Date(doc.expiryDate).toLocaleDateString()}</td>
                <td className="px-6 py-3">
                  <div className="flex flex-col">
                    <span className={`px-2 py-1 rounded text-xs font-bold inline-block w-fit ${getStatusBadge(doc.status, doc.expiryDate)}`}>
                      {daysUntilExpiry(doc.expiryDate)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <button className="text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    <FaDownload /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
