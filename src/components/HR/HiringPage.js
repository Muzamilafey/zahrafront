import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle } from 'lucide-react';

export default function HiringPage() {
  const [jobOpenings, setJobOpenings] = useState([
    { id: 1, title: 'Senior Developer', department: 'IT', applicants: 12, status: 'Open', posted: '2024-01-10' },
    { id: 2, title: 'HR Manager', department: 'Human Resources', applicants: 8, status: 'Open', posted: '2024-01-15' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', department: '', salary: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    setJobOpenings([...jobOpenings, { id: jobOpenings.length + 1, ...formData, applicants: 0, status: 'Open', posted: today }]);
    setFormData({ title: '', department: '', salary: '' });
    setShowForm(false);
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
          <div className="text-2xl font-bold text-gray-900">{jobOpenings.reduce((sum, j) => sum + j.applicants, 0)}</div>
          <div className="text-sm text-gray-600">Total Applicants</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-gray-900">{Math.round(jobOpenings.reduce((sum, j) => sum + j.applicants, 0) / jobOpenings.length)}</div>
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
              <option value="Sales">Sales</option>
            </select>
            <input name="salary" value={formData.salary} onChange={handleChange} placeholder="Salary Range" className="border border-gray-300 rounded-lg px-4 py-2" />
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
            {jobOpenings.map(job => (
              <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-gray-900">{job.title}</td>
                <td className="py-4 px-6 text-gray-600">{job.department}</td>
                <td className="py-4 px-6 text-center font-medium">{job.applicants}</td>
                <td className="py-4 px-6 text-gray-600">{job.posted}</td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle size={16} className="mr-1" /> {job.status}
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
