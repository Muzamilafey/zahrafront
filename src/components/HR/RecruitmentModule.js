import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { FaPlus, FaCheck, FaTimes, FaEye } from 'react-icons/fa';

export default function RecruitmentModule() {
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showAppForm, setShowAppForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobFormData, setJobFormData] = useState({ title: '', department: '', salaryRange: '', description: '', status: 'open' });
  const [appFormData, setAppFormData] = useState({ applicantName: '', email: '', phone: '', jobId: '', status: 'pending' });

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axiosInstance.get('/api/jobs');
      setJobs(res.data.data || []);
    } catch (err) {
      showToast('Failed to load jobs', 'error');
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await axiosInstance.get('/api/applications');
      setApplications(res.data.data || []);
    } catch (err) {
      showToast('Failed to load applications', 'error');
    }
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/jobs', jobFormData);
      showToast('Job posted successfully', 'success');
      setShowJobForm(false);
      setJobFormData({ title: '', department: '', salaryRange: '', description: '', status: 'open' });
      fetchJobs();
    } catch (err) {
      showToast('Failed to post job', 'error');
    }
  };

  const handleAddApplication = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/applications', appFormData);
      showToast('Application recorded', 'success');
      setShowAppForm(false);
      setAppFormData({ applicantName: '', email: '', phone: '', jobId: '', status: 'pending' });
      fetchApplications();
    } catch (err) {
      showToast('Failed to record application', 'error');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Recruitment Module</h1>

      {/* Job Vacancies Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Job Vacancies</h2>
          <button onClick={() => setShowJobForm(true)} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
            <FaPlus /> Post Job
          </button>
        </div>

        {showJobForm && (
          <div className="bg-white p-6 rounded-lg mb-4 border border-gray-200">
            <form onSubmit={handleAddJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Job Title" value={jobFormData.title} onChange={e => setJobFormData({...jobFormData, title: e.target.value})} className="border rounded px-3 py-2" required />
              <input type="text" placeholder="Department" value={jobFormData.department} onChange={e => setJobFormData({...jobFormData, department: e.target.value})} className="border rounded px-3 py-2" required />
              <input type="text" placeholder="Salary Range" value={jobFormData.salaryRange} onChange={e => setJobFormData({...jobFormData, salaryRange: e.target.value})} className="border rounded px-3 py-2" />
              <select value={jobFormData.status} onChange={e => setJobFormData({...jobFormData, status: e.target.value})} className="border rounded px-3 py-2">
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
              <textarea placeholder="Description" value={jobFormData.description} onChange={e => setJobFormData({...jobFormData, description: e.target.value})} className="border rounded px-3 py-2 md:col-span-2"></textarea>
              <div className="flex gap-2 md:col-span-2">
                <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700">Post Job</button>
                <button type="button" onClick={() => setShowJobForm(false)} className="bg-gray-300 text-gray-900 px-4 py-2 rounded">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map(job => (
            <div key={job._id} className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
              <p className="text-sm text-gray-600">Department: {job.department}</p>
              <p className="text-sm text-gray-600">Salary: {job.salaryRange}</p>
              <p className="text-sm text-gray-600 mt-2">{job.description}</p>
              <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-bold ${job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{job.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Applications Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Applications</h2>
          <button onClick={() => setShowAppForm(true)} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
            <FaPlus /> Record Application
          </button>
        </div>

        {showAppForm && (
          <div className="bg-white p-6 rounded-lg mb-4 border border-gray-200">
            <form onSubmit={handleAddApplication} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Applicant Name" value={appFormData.applicantName} onChange={e => setAppFormData({...appFormData, applicantName: e.target.value})} className="border rounded px-3 py-2" required />
              <input type="email" placeholder="Email" value={appFormData.email} onChange={e => setAppFormData({...appFormData, email: e.target.value})} className="border rounded px-3 py-2" required />
              <input type="tel" placeholder="Phone" value={appFormData.phone} onChange={e => setAppFormData({...appFormData, phone: e.target.value})} className="border rounded px-3 py-2" />
              <select value={appFormData.jobId} onChange={e => setAppFormData({...appFormData, jobId: e.target.value})} className="border rounded px-3 py-2">
                <option value="">Select Job Position</option>
                {jobs.map(job => <option key={job._id} value={job._id}>{job.title}</option>)}
              </select>
              <select value={appFormData.status} onChange={e => setAppFormData({...appFormData, status: e.target.value})} className="border rounded px-3 py-2">
                <option value="pending">Pending</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interviewed">Interviewed</option>
                <option value="offered">Offered</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="flex gap-2 md:col-span-2">
                <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700">Record Application</button>
                <button type="button" onClick={() => setShowAppForm(false)} className="bg-gray-300 text-gray-900 px-4 py-2 rounded">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg overflow-hidden shadow">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">{app.applicantName}</td>
                  <td className="px-6 py-3">{app.email}</td>
                  <td className="px-6 py-3">{app.phone}</td>
                  <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : app.status === 'offered' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{app.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
