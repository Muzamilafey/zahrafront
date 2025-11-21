import React, { useEffect, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

function useQuery() { return new URLSearchParams(useLocation().search); }

const LabRequests = () => {
  const { axiosInstance } = useContext(AuthContext);
  const q = useQuery();
  const patientId = q.get('patientId');

  const [tests, setTests] = useState([]);
  const [technicians, setTechs] = useState([]);
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({ patientId: patientId || '', catalogId: '', testType: '', qty: 1, assignedTo: '', priority: 'routine' });
  const [message, setMessage] = useState('');

  useEffect(()=>{
    const load = async ()=>{
      try{
        const [cRes, tRes] = await Promise.all([axiosInstance.get('/lab/catalog'), axiosInstance.get('/lab/technicians')]);
        setTests(cRes.data.catalog || cRes.data.tests || []);
        setTechs(tRes.data.technicians || []);
        if (patientId) {
          const p = await axiosInstance.get(`/patients/${patientId}`);
          setPatient(p.data.patient);
          setForm(f=>({...f, patientId}));
        }
      }catch(err){console.error(err);}
    };
    load();
  }, [axiosInstance, patientId]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { patientId: form.patientId, catalogId: form.catalogId, testType: form.testType || undefined, qty: form.qty, assignedTo: form.assignedTo, priority: form.priority };
      const res = await axiosInstance.post('/lab/requests', payload);
      setMessage('Lab request created');
      setForm({ patientId: form.patientId, catalogId: '', testType: '', qty: 1, assignedTo: '', priority: 'routine' });
    } catch (err) { console.error(err); setMessage(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-center text-2xl font-bold mb-4">Create Lab Request</h1>
      <form onSubmit={submit} className="bg-white border rounded p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Patient</label>
            <select value={form.patientId} onChange={e=>setForm({...form, patientId: e.target.value})} className="border p-1 w-full">
              {patient ? <option value={patient._id}>{patient.user?.name || `${patient.firstName} ${patient.lastName}`}</option> : <option value="">Select patient</option>}
            </select>
          </div>
          <div>
            <label className="block text-sm">Select Test (Catalog)</label>
            <select value={form.catalogId} onChange={e=>setForm({...form, catalogId: e.target.value, testType: e.target.options[e.target.selectedIndex]?.text})} className="border p-1 w-full">
              <option value="">-- Select Test --</option>
              {tests.map(t=> <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm">Assign To (tech)</label>
            <select value={form.assignedTo} onChange={e=>setForm({...form, assignedTo: e.target.value})} className="border p-1 w-full">
              <option value="">-- None --</option>
              {technicians.map(t=> <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm">Quantity</label>
            <input type="number" value={form.qty} onChange={e=>setForm({...form, qty: Number(e.target.value)})} className="border p-1 w-full" />
          </div>

          <div>
            <label className="block text-sm">Priority</label>
            <select value={form.priority} onChange={e=>setForm({...form, priority: e.target.value})} className="border p-1 w-full">
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">Stat</option>
            </select>
          </div>
        </div>
        <div className="mt-4 text-right">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create Request</button>
        </div>
        {message && <div className="mt-2 text-sm">{message}</div>}
      </form>
    </div>
  );
};

export default LabRequests;
