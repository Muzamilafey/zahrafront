import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

const ROLES = [
  'admin', 'doctor', 'pharmacist', 'finance', 'receptionist', 'nurse', 'lab_technician', 'cleaning', 'maintenance', 'patient', 'patient_registration', 'radiologist', 'mortician', 'hr'
];

export default function RegisterUser() {
  const { axiosInstance, user } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', name: '', role: '', password: '', specialties: '', phone: '', department: '', position: '', salary: '', employeeId: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!user || user.role !== 'admin') {
    return <div className="p-6">Access denied. Only admins can register users.</div>;
  }

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const payload = {
        email: form.email,
        name: form.name,
        role: form.role,
        password: form.password,
      };
      if (form.role === 'doctor' && form.specialties.trim()) {
        payload.specialties = form.specialties.split(',').map(s => s.trim());
      }
      // If creating an employee/staff record, call employee registration endpoint so we can save salary/position
      let res;
      if (form.role && !['patient', 'patient_registration'].includes(form.role)) {
        // include employee specific fields
        payload.phone = form.phone || undefined;
        payload.department = form.department || undefined;
        payload.position = form.position || undefined;
        if (form.salary) payload.salary = Number(form.salary);
        if (form.employeeId) payload.employeeId = form.employeeId;
        res = await axiosInstance.post('/employees/register', payload);
      } else {
        res = await axiosInstance.post('/users/register', payload);
      }
      setMessage('User registered successfully!');
      setForm({ email: '', name: '', role: '', password: '', specialties: '', phone: '', department: '', position: '', salary: '', employeeId: '' });
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Register New User</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm">Email</label>
          <input className="input w-full" name="email" value={form.email} onChange={handleChange} required type="email" />
        </div>
        <div>
          <label className="block text-sm">Name</label>
          <input className="input w-full" name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <label className="block text-sm">Role</label>
          <select className="input w-full" name="role" value={form.role} onChange={handleChange} required>
            <option value="">Select role</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {form.role === 'doctor' && (
          <div>
            <label className="block text-sm">Specialties (comma separated)</label>
            <input className="input w-full" name="specialties" value={form.specialties} onChange={handleChange} />
          </div>
        )}
        {/* Employee fields shown for staff roles */}
        {!['patient', 'patient_registration'].includes(form.role) && form.role && (
          <>
            <div>
              <label className="block text-sm">Phone</label>
              <input className="input w-full" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm">Employee ID (optional)</label>
              <input className="input w-full" name="employeeId" value={form.employeeId} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm">Position / Profession</label>
              <input className="input w-full" name="position" value={form.position} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm">Department</label>
              <input className="input w-full" name="department" value={form.department} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm">Salary</label>
              <input className="input w-full" name="salary" value={form.salary} onChange={handleChange} type="number" />
            </div>
          </>
        )}
        <div>
          <label className="block text-sm">Password</label>
          <input className="input w-full" name="password" value={form.password} onChange={handleChange} required type="password" />
        </div>
        <button className="btn-brand w-full" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register User'}</button>
      </form>
      {message && <div className="mt-4 text-sm text-center text-brand-700">{message}</div>}
    </div>
  );
}
