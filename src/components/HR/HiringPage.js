import React, { useState, useEffect, useContext } from 'react';
import { Plus, Trash2, CheckCircle, Edit } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import ConfirmModal from '../ui/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import { useState as useLocalState } from 'react';

export default function HiringPage() {
  const { axiosInstance } = useContext(AuthContext);
  const [jobOpenings, setJobOpenings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', department: '', salaryRange: '', description: '' });

  useEffect(() => {
    fetchJobOpenings();
  }, []);

  const fetchJobOpenings = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/jobs');
      setJobOpenings(res.data.jobs || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setJobOpenings([]);
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
      await axiosInstance.post('/jobs', {
        ...formData,
        status: 'Open'
      });
      setFormData({ title: '', department: '', salaryRange: '', description: '' });
      setShowForm(false);
      fetchJobOpenings();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error posting job');
    }
  };

  const handleDeleteJob = async (id) => {
    setConfirm({ open: true, id, action: 'deleteJob' });
  };

  const handleEditJob = (job) => {
    setFormData({ title: job.title || '', department: job.department || '', salaryRange: job.salaryRange || '', description: job.description || '' });
    setShowForm(true);
  };

  const [confirm, setConfirm] = useLocalState({ open: false, id: null, action: null });
  const showToast = useToast();

  const runConfirm = async () => {
    try {
      if (confirm.action === 'deleteJob') {
        await axiosInstance.delete(`/jobs/${confirm.id}`);
        showToast('success', 'Job deleted');
      }
      fetchJobOpenings();
    } catch (err) {
      showToast('error', err?.response?.data?.message || 'Error processing request');
    }
    setConfirm({ open: false, id: null, action: null });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Recruitment & Hiring</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus size={20} /> Post Job Opening
        </button>
      </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-900">{jobOpenings.length}</div>
              <div className="text-sm text-gray-600">Job Openings</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-900">{jobOpenings.reduce((sum, j) => sum + (j.applicants || 0), 0)}</div>
              <div className="text-sm text-gray-600">Total Applicants</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-900">{jobOpenings.length ? Math.round(jobOpenings.reduce((sum, j) => sum + (j.applicants || 0), 0) / jobOpenings.length) : 0}</div>
              <div className="text-sm text-gray-600">Avg Applicants/Job</div>
            </div>
          </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Post New Job Opening</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input name="title" value={formData.title} onChange={handleChange} placeholder="Job Title" className="border border-gray-300 rounded-lg px-4 py-2 col-span-2" required />
            <select name="department" value={formData.department} onChange={handleChange} className="border border-gray-300 rounded-lg px-4 py-2">
              <option value="">Select Department</option>
              <option value="IT">IT</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="Medical">Medical</option>
            </select>
            <input name="salaryRange" value={formData.salaryRange} onChange={handleChange} placeholder="Salary Range" className="border border-gray-300 rounded-lg px-4 py-2" />
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Job Description" className="border border-gray-300 rounded-lg px-4 py-2 col-span-2" />
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Post Job</button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-6 font-medium text-gray-700">Job Title</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Department</th>
              <th className="text-center py-3 px-6 font-medium text-gray-700">Applicants</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Posted Date</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
              <th className="text-center py-3 px-6 font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {jobOpenings && jobOpenings.length > 0 ? jobOpenings.map(job => (
              <tr key={job._id || job.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-gray-900">{job.title}</td>
                <td className="py-4 px-6 text-gray-600">{job.department}</td>
                <td className="py-4 px-6 text-center font-medium">{job.applicants || 0}</td>
                <td className="py-4 px-6 text-gray-600">{job.posted}</td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle size={16} className="mr-1" /> {job.status}
                  </span>
                </td>
                <td className="py-4 px-6 flex justify-center gap-2">
                  <button onClick={() => handleEditJob(job)} className="p-2 hover:bg-blue-100 rounded-lg text-blue-600" title="Edit"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteJob(job._id || job.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-600" title="Delete"><Trash2 size={18} /></button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="py-8 px-6 text-center text-gray-500">No job openings</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ConfirmModal isOpen={confirm.open} title="Delete Job" message="Are you sure you want to delete this job posting?" onConfirm={runConfirm} onCancel={() => setConfirm({ open: false, id: null, action: null })} />
    </div>
  );
}
