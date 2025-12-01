import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

const ROLES = [
  'admin', 'doctor', 'pharmacist', 'finance', 'receptionist', 'nurse', 'lab_technician', 'cleaning', 'maintenance', 'patient', 'patient_registration'
];

export default function RegisterUser() {
  const { axiosInstance, user } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', name: '', role: '', password: '', specialties: '' });
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
      const res = await axiosInstance.post('/users/register', payload);
      setMessage('User registered successfully!');
      setForm({ email: '', name: '', role: '', password: '', specialties: '' });
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
