import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', position: '', department: '', salary: '', employeeId: '', gender: '', employmentType: 'full-time', startDate: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/employees');
      setEmployees(res.data.employees || []);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch employees');
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
      const payload = { ...formData };
      if (payload.salary) payload.salary = Number(payload.salary);
      
      if (editingId) {
        await axiosInstance.put(`/employees/${editingId}`, payload);
      } else {
        await axiosInstance.post('/employees/register', payload);
      }
      
      setFormData({ name: '', email: '', phone: '', position: '', department: '', salary: '', employeeId: '', gender: '', employmentType: 'full-time', startDate: '' });
      setShowForm(false);
      setEditingId(null);
      fetchEmployees();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error saving employee');
    }
  };

  const handleEdit = (emp) => {
    setFormData(emp);
    setEditingId(emp._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await axiosInstance.delete(`/employees/${id}`);
        fetchEmployees();
      } catch (err) {
        alert(err?.response?.data?.message || 'Error deleting employee');
      }
    }
  };

  const filtered = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Loading employees...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
        <button 
          onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: '', email: '', phone: '', position: '', department: '', salary: '', employeeId: '', gender: '', employmentType: 'full-time', startDate: '' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus size={20} /> Add Employee
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Employee' : 'Add New Employee'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="border border-gray-300 rounded-lg px-4 py-2" required />
            <input name="employeeId" value={formData.employeeId} onChange={handleChange} placeholder="Employee ID" className="border border-gray-300 rounded-lg px-4 py-2" />
            <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="border border-gray-300 rounded-lg px-4 py-2" required />
            <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="border border-gray-300 rounded-lg px-4 py-2" />
            <input name="position" value={formData.position} onChange={handleChange} placeholder="Position" className="border border-gray-300 rounded-lg px-4 py-2" required />
            <input name="department" value={formData.department} onChange={handleChange} placeholder="Department" className="border border-gray-300 rounded-lg px-4 py-2" required />
            <input name="salary" value={formData.salary} onChange={handleChange} placeholder="Salary" type="number" className="border border-gray-300 rounded-lg px-4 py-2" />
            <select name="gender" value={formData.gender} onChange={handleChange} className="border border-gray-300 rounded-lg px-4 py-2">
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <select name="employmentType" value={formData.employmentType} onChange={handleChange} className="border border-gray-300 rounded-lg px-4 py-2">
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="temp">Temporary</option>
            </select>
            <input name="startDate" value={formData.startDate} onChange={handleChange} placeholder="Start Date" type="date" className="border border-gray-300 rounded-lg px-4 py-2" />
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex items-center gap-2">
          <Search size={20} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search employees..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-gray-700"
          />
        </div>
        
        {error && <div className="p-6 text-red-600">{error}</div>}
        
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-6 font-medium text-gray-700">Name</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Position</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Department</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Email</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
              <th className="text-center py-3 px-6 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(emp => (
              <tr key={emp._id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-gray-900">{emp.name}</td>
                <td className="py-4 px-6 text-gray-600">{emp.position}</td>
                <td className="py-4 px-6 text-gray-600">{emp.department}</td>
                <td className="py-4 px-6 text-gray-600">{emp.email}</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {emp.status}
                  </span>
                </td>
                <td className="py-4 px-6 flex justify-center gap-2">
                  <button onClick={() => handleEdit(emp)} className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(emp._id)} className="p-2 hover:bg-red-100 rounded-lg text-red-600"><Trash2 size={18} /></button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="py-8 px-6 text-center text-gray-500">No employees found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
