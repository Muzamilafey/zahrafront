import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://zahra-7bi2.onrender.com/api';

const SPECIALTIES = [
  'General',
  'Cardiology',
  'Pediatrics',
  'Dermatology',
  'Gynecology',
  'Orthopedics',
  'ENT',
  'Neurology',
];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient', specialties: [] });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  

  const onChange = e => {
    if (e.target.name === 'specialties') {
      const options = Array.from(e.target.selectedOptions || []);
      return setForm({ ...form, specialties: options.map(o => o.value) });
    }
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, form);
      const msg = res.data.message || 'Registration successful. Please check your email to verify.';
      setMessage(msg);
      // redirect to login after successful registration
      setTimeout(() => navigate('/login'), 700);
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
  return (
    <div className="min-h-screen flex items-center justify-center page-hero">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animated-logo {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
      <div className="w-full max-w-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="hidden md:flex flex-col items-center justify-center p-6 rounded-xl floating">
            <img src="/logo3.png" alt="Hospital Logo" className="animated-logo w-32 h-32 mb-6 object-contain" />
            <div className="bg-gradient-to-br from-brand-100 to-brand-50 rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-brand-700 mb-2">Join Muzamilafey HMIS</h3>
              <p className="text-gray-600">Create your account to book appointments, request prescriptions and view invoices.</p>
            </div>
          </div>

          <form onSubmit={submit} className="card">
            <h2 className="text-2xl mb-4 font-bold text-center text-brand-700">Create an account</h2>
            {message && <p className="text-green-600 mb-3">{message}</p>}
            {error && <p className="text-red-600 mb-3">{error}</p>}

            <input name="name" value={form.name} onChange={onChange} placeholder="Full name" className="input mb-3" required />
            <input name="email" value={form.email} onChange={onChange} placeholder="Email" type="email" className="input mb-3" required />
            <input name="password" value={form.password} onChange={onChange} placeholder="Password" type="password" className="input mb-4" minLength={6} required />

            <select name="role" value={form.role} onChange={onChange} className="w-full p-3 mb-4 border rounded">
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="finance">Finance</option>
              <option value="receptionist">Receptionist</option>
              <option value="nurse">Nurse</option>
              <option value="lab_technician">Lab Technician</option>
              
            </select>

            {form.role === 'doctor' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Specialties (select one or more)</label>
                <select name="specialties" multiple value={form.specialties} onChange={onChange} className="w-full p-3 border rounded h-32">
                  {SPECIALTIES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {(form.role === 'nurse' || form.role === 'lab_technician') && (
              <>
                <input name="employeeId" value={form.employeeId || ''} onChange={onChange} placeholder="Employee ID" className="input mb-3" />
                <input name="licenseNumber" value={form.licenseNumber || ''} onChange={onChange} placeholder="License Number" className="input mb-3" />
              </>
            )}

            <button type="submit" className="btn-brand w-full" disabled={loading || (form.role === 'doctor' && (!form.specialties || form.specialties.length === 0))}>{loading ? 'Creating...' : 'Create Account'}</button>

            <div className="my-4 text-center">or</div>
            

            <div className="mt-4 text-center">
              <Link to="/login" className="text-brand-600 hover:underline">Already have an account? Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}