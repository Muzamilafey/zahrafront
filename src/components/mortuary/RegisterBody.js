import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function RegisterBody() {
  const { axiosInstance } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ patientId: '', causeOfDeath: '', nextOfKin: '', notes: '', lineItems: [] });

  useEffect(() => {
    (async () => {
      try {
        const p = await axiosInstance.get('/patients?limit=50');
        setPatients(p.data.patients || []);
        const s = await axiosInstance.get('/mortuary/fees');
        setServices(s.data.services || []);
      } catch (e) { /* ignore */ }
    })();
  }, [axiosInstance]);

  const addItem = (svc) => {
    setForm(prev => ({ ...prev, lineItems: [...prev.lineItems, { description: svc.name, amount: svc.amount, qty: 1 }] }));
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const amount = form.lineItems.reduce((s, it) => s + ((it.amount || 0) * (it.qty || 1)), 0);
      const res = await axiosInstance.post('/mortuary/register', { ...form, amount });
      alert('Registered successfully');
      setForm({ patientId: '', causeOfDeath: '', nextOfKin: '', notes: '', lineItems: [] });
    } catch (err) {
      alert('Failed to register');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Register Body / Mortuary Admission</h2>
      <form onSubmit={submit} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm">Patient</label>
          <select required value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} className="w-full border p-2 rounded">
            <option value="">Select patient</option>
            {patients.map(p => <option key={p._id} value={p._id}>{p.name || p._id}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm">Cause of Death</label>
          <input required value={form.causeOfDeath} onChange={e => setForm({ ...form, causeOfDeath: e.target.value })} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">Next of Kin</label>
          <input value={form.nextOfKin} onChange={e => setForm({ ...form, nextOfKin: e.target.value })} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">Notes</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border p-2 rounded" />
        </div>

        <div>
          <h4 className="font-medium">Add Service Fees</h4>
          <div className="flex gap-2 my-2">
            {services.map(s => (
              <button type="button" key={s._id} onClick={() => addItem(s)} className="px-2 py-1 bg-gray-100 rounded">{s.name} ({s.amount})</button>
            ))}
          </div>
          <div className="border rounded p-2">
            {form.lineItems.length === 0 ? <div className="text-sm text-gray-500">No fees added</div> : (
              <ul>
                {form.lineItems.map((it, idx) => (
                  <li key={idx} className="flex items-center justify-between py-1">
                    <div>{it.description}</div>
                    <div>{it.qty} x {it.amount}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <button className="px-4 py-2 bg-brand-600 text-white rounded">Register</button>
        </div>
      </form>
    </div>
  );
}
