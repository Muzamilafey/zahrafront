import React, { useState, useEffect, useContext } from 'react';
// Sidebar and Topbar are handled by the global Layout
import DataTable from '../ui/DataTable';
import { AuthContext } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';

export default function ReceptionistDashboard() {
  const { axiosInstance, user, logout } = useContext(AuthContext);
  const [reg, setReg] = useState({ name:'', phone:'', email:'' });
  const [doctors, setDoctors] = useState([]);
  const [assignedDoctor, setAssignedDoctor] = useState('');
  const [recent, setRecent] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(()=>{
    const load = async ()=>{
      try {
        // try to load recent patients (receptionist/admin) or assigned patients (doctor)
        let pRes = { data: { patients: [] } };
        try {
          pRes = await axiosInstance.get('/patients/recent?limit=10');
        } catch (err) {
          if (err.response?.status !== 403) console.error(err);
        }
        const dRes = await axiosInstance.get('/doctors');

        setRecent((pRes.data.patients || []).map(p=>({ id: p._id, name: p.user?.name, phone: p.user?.phone || '-', date: new Date(p.createdAt).toLocaleDateString() })));
        const docs = dRes.data?.doctors || dRes.data || [];
        setDoctors(docs.map(d => ({ id: d._id, name: d.user?.name || (d.user && d.user.name) || 'Unknown' })));
        try{
          const aRes = await axiosInstance.get('/appointments');
          setAppointments((aRes.data.appointments || []).map(a=>({ id: a._id, time: new Date(a.scheduledAt).toLocaleString(), patient: a.patient?.user?.name || '-', status: a.status })));
        }catch(e){ /* ignore */ }
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  return (
    <>
  <div className="flex items-center justify-between mt-0 sm:mt-1 mb-0">
    <h1 className="text-2xl font-bold">Reception Dashboard</h1>
    <ThemeToggle />
  </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded p-4 shadow">
              <h3 className="font-semibold mb-2">Quick Patient Registration</h3>
              <form onSubmit={async (e)=>{
                e.preventDefault();
                try {
                  // Basic client-side validation
                  if (!reg.name || reg.name.trim().length === 0) {
                    return alert('Please enter patient name');
                  }

                  // Ensure we have a valid email; if not provided, try to create one from phone or timestamp
                  let email = (reg.email || '').trim();
                  if (!email) {
                    const digits = (reg.phone || '').replace(/\D/g, '');
                    if (digits.length >= 3) {
                      email = `${digits}@genzhospital.com`;
                    } else {
                      // fallback to timestamped placeholder
                      email = `patient_${Date.now()}@gezhospital.com`;
                    }
                  }

                  // Ensure password meets minimum length (server requires 6)
                  let password = Math.random().toString(36).substring(2, 10); // 8 chars
                  if (password.length < 6) password = password.padEnd(6, 'x');

                  const payload = {
                    name: reg.name,
                    email,
                    phone: reg.phone,
                    assignedDoctor: assignedDoctor || undefined,
                  };

                  const createRes = await axiosInstance.post('/patients/create', payload);
                  const temp = createRes.data?.tempPassword;
                  setReg({ name:'', phone:'', email:'' });
                  setAssignedDoctor('');
                  // attempt to reload recent patients list
                  try {
                    const res = await axiosInstance.get('/patients/recent?limit=10');
                    setRecent((res.data.patients || []).map(p=>({ id: p._id, name: p.user?.name, phone: p.user?.phone || '-', date: new Date(p.createdAt).toLocaleDateString() })));
                  } catch (e) { /* ignore */ }
                  alert(`Patient registered${temp ? '\nTemp password: ' + temp : ''}`);
                } catch (err) {
                  console.error('Registration error', err);
                  if (err.response) {
                    const data = err.response.data;
                    if (data.errors && Array.isArray(data.errors)) {
                      alert(data.errors.map(e => `${e.param}: ${e.msg}`).join('\n'));
                    } else if (data.message) {
                      alert(data.message);
                    } else {
                      alert(JSON.stringify(data));
                    }
                  } else {
                    alert(err.message || 'Registration failed');
                  }
                }
              }}>
                <input className="input mb-2" placeholder="Full name" value={reg.name} onChange={e=>setReg({...reg,name:e.target.value})} />
                <input className="input mb-2" placeholder="Phone" value={reg.phone} onChange={e=>setReg({...reg,phone:e.target.value})} />
                <input className="input mb-2" placeholder="Email (optional)" value={reg.email} onChange={e=>setReg({...reg,email:e.target.value})} />
                <label className="block text-sm text-gray-600 mb-2">Assign doctor</label>
                <select className="input mb-2" value={assignedDoctor} onChange={e=>setAssignedDoctor(e.target.value)}>
                  <option value="">-- Select doctor (optional) --</option>
                  {doctors.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <button className="btn-brand">Register Patient</button>
              </form>
            </div>

            <div className="bg-white rounded p-4 shadow">
              <h3 className="font-semibold mb-2">Upcoming Appointments</h3>
              <DataTable columns={[{header:'Time',accessor:'time'},{header:'Patient',accessor:'patient'},{header:'Status',accessor:'status'}]} data={appointments} />
            </div>
          </div>

          <div className="bg-white rounded p-4 shadow">
            <h3 className="font-semibold mb-2">Recent Registrations</h3>
            <DataTable columns={[{header:'Name',accessor:'name'},{header:'Phone',accessor:'phone'},{header:'Date',accessor:'date'}]} data={recent} />
          </div>
    </>
  );
}