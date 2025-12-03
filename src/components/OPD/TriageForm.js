import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function TriageForm() {
  const { axiosInstance } = useContext(AuthContext);
  const [visitId, setVisitId] = useState('');
  const [temperature, setTemperature] = useState('');
  const [bpSys, setBpSys] = useState('');
  const [bpDia, setBpDia] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [pulse, setPulse] = useState('');
  const [resp, setResp] = useState('');
  const [rbs, setRbs] = useState('');
  const [triageCategory, setTriageCategory] = useState('Normal');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.post('/api/opd/triage', { visit: visitId, temperature: parseFloat(temperature) || undefined, bloodPressureSystolic: bpSys?Number(bpSys):undefined, bloodPressureDiastolic: bpDia?Number(bpDia):undefined, heightCm: height?Number(height):undefined, weightKg: weight?Number(weight):undefined, pulseRate: pulse?Number(pulse):undefined, respiratoryRate: resp?Number(resp):undefined, rbs: rbs?Number(rbs):undefined, triageCategory });
      alert('Saved');
    } catch (err) { console.error(err); alert(err.response?.data?.message || err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-3">Triage / Vitals</h2>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="input" placeholder="Visit ID" value={visitId} onChange={e=>setVisitId(e.target.value)} />
        <input className="input" placeholder="Temperature (°C)" value={temperature} onChange={e=>setTemperature(e.target.value)} />
        <input className="input" placeholder="BP Systolic" value={bpSys} onChange={e=>setBpSys(e.target.value)} />
        <input className="input" placeholder="BP Diastolic" value={bpDia} onChange={e=>setBpDia(e.target.value)} />
        <input className="input" placeholder="Height (cm)" value={height} onChange={e=>setHeight(e.target.value)} />
        <input className="input" placeholder="Weight (kg)" value={weight} onChange={e=>setWeight(e.target.value)} />
        <input className="input" placeholder="Pulse rate" value={pulse} onChange={e=>setPulse(e.target.value)} />
        <input className="input" placeholder="Respiratory rate" value={resp} onChange={e=>setResp(e.target.value)} />
        <input className="input" placeholder="Random blood sugar (RBS)" value={rbs} onChange={e=>setRbs(e.target.value)} />
        <select className="input" value={triageCategory} onChange={e=>setTriageCategory(e.target.value)}>
          <option>Normal</option>
          <option>Priority</option>
          <option>Emergency</option>
        </select>
        <div className="col-span-full">
          <button className="btn" disabled={saving}>{saving ? 'Saving...' : 'Save Triage'}</button>
        </div>
      </form>
    </div>
  );
}
