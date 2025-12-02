import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import ConfirmModal from '../ui/ConfirmModal';
import { FaEdit, FaTrash, FaPlus, FaDownload, FaUpload } from 'react-icons/fa';

export default function EmployeeManagement() {
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'Male',
    dateOfBirth: '',
    idNumber: '',
    department: '',
    jobTitle: '',
    employmentType: 'Full-time',
    supervisor: '',
    status: 'active',
    emergencyContact: '',
    emergencyPhone: '',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/employees');
      setEmployees(res.data.data || []);
    } catch (err) {
      showToast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axiosInstance.put(`/api/employees/${editingId}`, formData);
        showToast('Employee updated successfully', 'success');
      } else {
        await axiosInstance.post('/api/employees', formData);
        showToast('Employee created successfully', 'success');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: 'Male',
        dateOfBirth: '',
        idNumber: '',
        department: '',
        jobTitle: '',
        employmentType: 'Full-time',
        supervisor: '',
        status: 'active',
        emergencyContact: '',
        emergencyPhone: '',
      });
      fetchEmployees();
    } catch (err) {
      showToast('Failed to save employee', 'error');
    }
  };

  const handleEdit = (employee) => {
    setFormData(employee);
    setEditingId(employee._id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/api/employees/${confirmDelete}`);
      showToast('Employee deleted successfully', 'success');
      fetchEmployees();
      setConfirmDelete(null);
    } catch (err) {
      showToast('Failed to delete employee', 'error');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
        >
          <FaPlus /> Add Employee
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg mb-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Employee' : 'Add New Employee'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="text" placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="tel" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="border rounded px-3 py-2" />
            <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="border rounded px-3 py-2">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <input type="date" placeholder="Date of Birth" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="border rounded px-3 py-2" />
            <input type="text" placeholder="ID Number" value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} className="border rounded px-3 py-2" />
            <input type="text" placeholder="Department" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="border rounded px-3 py-2" />
            <input type="text" placeholder="Job Title" value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} className="border rounded px-3 py-2" required />
            <select value={formData.employmentType} onChange={e => setFormData({...formData, employmentType: e.target.value})} className="border rounded px-3 py-2">
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
            </select>
            <input type="text" placeholder="Supervisor" value={formData.supervisor} onChange={e => setFormData({...formData, supervisor: e.target.value})} className="border rounded px-3 py-2" />
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="border rounded px-3 py-2">
              <option value="active">Active</option>
              <option value="terminated">Terminated</option>
              <option value="resigned">Resigned</option>
              <option value="suspended">Suspended</option>
            </select>
            <input type="text" placeholder="Emergency Contact" value={formData.emergencyContact} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} className="border rounded px-3 py-2" />
            <input type="tel" placeholder="Emergency Phone" value={formData.emergencyPhone} onChange={e => setFormData({...formData, emergencyPhone: e.target.value})} className="border rounded px-3 py-2" />
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-900 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden shadow">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Department</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Job Title</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">{emp.firstName} {emp.lastName}</td>
                  <td className="px-6 py-3">{emp.email}</td>
                  <td className="px-6 py-3">{emp.department}</td>
                  <td className="px-6 py-3">{emp.jobTitle}</td>
                  <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{emp.status}</span></td>
                  <td className="px-6 py-3 flex gap-2">
                    <button onClick={() => handleEdit(emp)} className="text-blue-600 hover:text-blue-800"><FaEdit /></button>
                    <button onClick={() => setConfirmDelete(emp._id)} className="text-red-600 hover:text-red-800"><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Delete Employee"
        message="Are you sure you want to delete this employee?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
