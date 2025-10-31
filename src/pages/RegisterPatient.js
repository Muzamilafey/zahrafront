import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Toast from '../components/ui/Toast';

export default function RegisterPatient() {
  const { axiosInstance } = useContext(AuthContext);
  const [form, setForm] = useState({ name: '', phone: '', email: '', gender: '', dob: '' });
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createdPatient, setCreatedPatient] = useState(null);

  useEffect(() => { loadDoctors(); }, []);
  const loadDoctors = async () => {
    try {
      const res = await axiosInstance.get('/doctors/list');
      setDoctors(res.data.doctors || []);
    } catch (e) { console.error(e); }
  };

  const onChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      const payload = { ...form, assignedDoctor: doctorId };
      const res = await axiosInstance.post('/patients/create', payload);
      setCreatedPatient(res.data.patient);
      setToast({ message: 'Patient registered successfully', type: 'success' });
      setForm({ name: '', phone: '', email: '', gender: '', dob: '' });
      setDoctorId('');
    } catch (e) {
      setToast({ message: e?.response?.data?.message || 'Failed to register patient', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Register New Patient</h2>
      <form className="bg-white p-4 rounded shadow flex flex-col gap-4" onSubmit={handleSubmit}>
        <input name="name" value={form.name} onChange={onChange} placeholder="Full Name" className="input" required />
        <input name="phone" value={form.phone} onChange={onChange} placeholder="Phone Number" className="input" required />
        <input name="email" value={form.email} onChange={onChange} placeholder="Email (optional)" className="input" type="email" />
        <select name="gender" value={form.gender} onChange={onChange} className="input" required>
          <option value="">-- select gender --</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <input name="dob" value={form.dob} onChange={onChange} placeholder="Date of Birth" className="input" type="date" required />
        <select value={doctorId} onChange={e => setDoctorId(e.target.value)} className="input" required>
          <option value="">-- assign doctor --</option>
          {doctors.map(d => (
            <option key={d._id} value={d._id}>{d.user?.name} ({d.user?.email})</option>
          ))}
        </select>
        <button className="btn-brand w-full" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register Patient'}</button>
      </form>
      {createdPatient && (
        <div className="mt-4 p-4 bg-green-50 rounded shadow">
          <div className="font-semibold">Patient Registered:</div>
          <div>Name: {createdPatient.user?.name}</div>
          <div>Patient Number: {createdPatient.hospitalId}</div>
          <div>MRN: {createdPatient.mrn}</div>
        </div>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
