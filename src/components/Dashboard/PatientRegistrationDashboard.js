import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import DataTable from '../ui/DataTable';

export default function PatientRegistrationDashboard() {
  const { axiosInstance } = useContext(AuthContext);
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '', gender: '', phonePrimary: '', email: '', nationalId: '', maritalStatus: '', bloodGroup: '', paymentMode: '', insuranceProvider: '', nextOfKinName: '', nextOfKinPhone: '', sendToConsultation: false, doctorId: '', consultationId: '' });
  const [recent, setRecent] = useState([]);
  const [stats, setStats] = useState({ totalPatients: 0, todayRegistrations: 0 });
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' });
  const [doctors, setDoctors] = useState([]);
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get('/patient-registration/dashboard');
        setStats({ totalPatients: res.data.totalPatients, todayRegistrations: res.data.todayRegistrations });
        setRecent((res.data.recentRegistrations || []).map(p => ({
          id: p._id,
          name: p.user?.name || `${p.firstName} ${p.lastName}`,
          phone: p.user?.phone || p.phonePrimary || '-',
          date: new Date(p.createdAt).toLocaleString()
        })));
        // also fetch doctors and consultations for quick assignment
        try {
          const dRes = await axiosInstance.get('/doctors');
          setDoctors(dRes.data.doctors || dRes.data || []);
        } catch (e) { /* ignore */ }
        try {
          const cRes = await axiosInstance.get('/consultations');
          setConsultations(cRes.data.consultations || cRes.data || []);
        } catch (e) { /* ignore */ }
      } catch (e) {
        console.error('Failed loading registration dashboard', e);
      }
    };
    load();
  }, [axiosInstance]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      // minimal client-side validation
      if (!payload.firstName || !payload.lastName || !payload.dob || !payload.gender || !payload.phonePrimary) {
        setModal({ show: true, title: 'Missing fields', message: 'Please fill required fields (first name, last name, dob, gender, phone)', type: 'error' });
        return;
      }

      // basic phone validation
      const phoneOnly = payload.phonePrimary.replace(/\D/g,'');
      if (phoneOnly.length < 7) {
        setModal({ show: true, title: 'Invalid phone', message: 'Please provide a valid phone number', type: 'error' });
        return;
      }

      const res = await axiosInstance.post('/patient-registration/register', payload);
      // show temp password if provided
      let successMsg = res.data.message || 'Patient registered';
      if (res.data.tempPassword) successMsg += `\nTemp password: ${res.data.tempPassword}`;
      setModal({ show: true, title: 'Success', message: successMsg, type: 'success' });
      setForm({ firstName: '', lastName: '', dob: '', gender: '', phonePrimary: '', email: '', nationalId: '', maritalStatus: '', bloodGroup: '', paymentMode: '', insuranceProvider: '', nextOfKinName: '', nextOfKinPhone: '', sendToConsultation: false, doctorId: '', consultationId: '' });

      // refresh dashboard data
      try {
        const r = await axiosInstance.get('/patient-registration/dashboard');
        setStats({ totalPatients: r.data.totalPatients, todayRegistrations: r.data.todayRegistrations });
        setRecent((r.data.recentRegistrations || []).map(p => ({
          id: p._id,
          name: p.user?.name || `${p.firstName} ${p.lastName}`,
          phone: p.user?.phone || p.phonePrimary || '-',
          date: new Date(p.createdAt).toLocaleString()
        })));
      } catch (e) { /* ignore */ }
    } catch (err) {
      console.error(err);
      let msg = 'Registration failed';
      if (err.response && err.response.data && err.response.data.message) msg = err.response.data.message;
      setModal({ show: true, title: 'Error', message: msg, type: 'error' });
    }
  };

  return (
    <>
      {modal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
            <h2 className={`text-xl font-semibold mb-2 ${modal.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>{modal.title}</h2>
            <p className="whitespace-pre-line mb-4">{modal.message}</p>
            <button className="btn-brand w-full" onClick={() => setModal({ ...modal, show: false })}>Close</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-0 sm:mt-1 mb-0">
        <h1 className="text-2xl font-bold">Registration Dashboard</h1>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
        <div className="bg-white rounded p-4 shadow">
          <h3 className="font-semibold mb-2">Stats</h3>
          <div className="text-lg">Total Patients: <strong>{stats.totalPatients}</strong></div>
          <div className="text-lg">Today: <strong>{stats.todayRegistrations}</strong></div>
        </div>

        <div className="bg-white rounded p-4 shadow col-span-2">
          <h3 className="font-semibold mb-2">Quick Register</h3>
          <form onSubmit={submit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input className="input" placeholder="First name" value={form.firstName} onChange={(e)=>setForm({...form, firstName: e.target.value})} />
              <input className="input" placeholder="Last name" value={form.lastName} onChange={(e)=>setForm({...form, lastName: e.target.value})} />
              <input className="input" type="date" placeholder="DOB" value={form.dob} onChange={(e)=>setForm({...form, dob: e.target.value})} />
              <select className="input" value={form.gender} onChange={(e)=>setForm({...form, gender: e.target.value})}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <input className="input" placeholder="Phone" value={form.phonePrimary} onChange={(e)=>setForm({...form, phonePrimary: e.target.value})} />
              <input className="input" placeholder="Email (optional)" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} />
              <input className="input" placeholder="National ID (optional)" value={form.nationalId} onChange={(e)=>setForm({...form, nationalId: e.target.value})} />
              <input className="input" placeholder="Marital status (optional)" value={form.maritalStatus} onChange={(e)=>setForm({...form, maritalStatus: e.target.value})} />
              <input className="input" placeholder="Blood group (optional)" value={form.bloodGroup} onChange={(e)=>setForm({...form, bloodGroup: e.target.value})} />
              <input className="input" placeholder="Payment mode (cash/insurance)" value={form.paymentMode} onChange={(e)=>setForm({...form, paymentMode: e.target.value})} />
              <input className="input" placeholder="Insurance provider (optional)" value={form.insuranceProvider} onChange={(e)=>setForm({...form, insuranceProvider: e.target.value})} />
              <input className="input" placeholder="Next of kin name (optional)" value={form.nextOfKinName} onChange={(e)=>setForm({...form, nextOfKinName: e.target.value})} />
              <input className="input" placeholder="Next of kin phone (optional)" value={form.nextOfKinPhone} onChange={(e)=>setForm({...form, nextOfKinPhone: e.target.value})} />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <label className="flex items-center space-x-2"><input type="checkbox" checked={form.sendToConsultation} onChange={(e)=>setForm({...form, sendToConsultation: e.target.checked})} /> <span>Send to consultation</span></label>
              {form.sendToConsultation && (
                <>
                  <select className="input" value={form.consultationId} onChange={(e)=>setForm({...form, consultationId: e.target.value})}>
                    <option value="">Select consultation (optional)</option>
                    {consultations.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  <select className="input" value={form.doctorId} onChange={(e)=>setForm({...form, doctorId: e.target.value})}>
                    <option value="">Select doctor (optional)</option>
                    {doctors.map(d => <option key={d._id} value={d._id}>{d.user?.name || d.user}</option>)}
                  </select>
                </>
              )}
            </div>
            <div className="mt-3">
              <button className="btn-brand">Register Patient</button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded p-4 shadow">
        <h3 className="font-semibold mb-2">Recent Registrations</h3>
        <DataTable
          columns={[{ header: 'Name', accessor: 'name' }, { header: 'Phone', accessor: 'phone' }, { header: 'Date', accessor: 'date' }]}
          data={recent}
        />
      </div>
    </>
  );
}
