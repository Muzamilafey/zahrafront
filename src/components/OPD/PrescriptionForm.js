import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function PrescriptionForm() {
  const { axiosInstance } = useContext(AuthContext);
  const [visitId, setVisitId] = useState('');
  const [clinicianId, setClinicianId] = useState('');
  const [medications, setMedications] = useState([{ drugName: '', dosage: '', frequency: '', durationDays: 1 }]);
  const [saving, setSaving] = useState(false);
  const [warnings, setWarnings] = useState(null);

  const changeMed = (idx, key, val) => {
    const next = [...medications]; next[idx][key] = val; setMedications(next);
  };
  const addMed = () => setMedications([...medications, { drugName: '', dosage: '', frequency: '', durationDays: 1 }]);

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setWarnings(null);
    try {
      // check interactions first
      const names = medications.map(m => m.drugName).filter(Boolean);
      if (names.length) {
        const check = await axiosInstance.post('/api/opd/drug-interactions', { drugs: names });
        if (check.data && check.data.warnings && check.data.warnings.length) {
          setWarnings(check.data.warnings);
          // allow still to save after showing warnings
        }
      }
      await axiosInstance.post('/api/opd/prescriptions', { visit: visitId, clinician: clinicianId, medications });
      alert('Prescription saved');
    } catch (err) { console.error(err); alert(err.response?.data?.message || err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-3">Prescription</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="input" placeholder="Visit ID" value={visitId} onChange={e=>setVisitId(e.target.value)} />
        <input className="input" placeholder="Clinician ID" value={clinicianId} onChange={e=>setClinicianId(e.target.value)} />
        {medications.map((m, i) => (
          <div key={i} className="p-2 border rounded space-y-2">
            <input className="input" placeholder="Drug name" value={m.drugName} onChange={e=>changeMed(i,'drugName',e.target.value)} />
            <input className="input" placeholder="Dosage" value={m.dosage} onChange={e=>changeMed(i,'dosage',e.target.value)} />
            <input className="input" placeholder="Frequency" value={m.frequency} onChange={e=>changeMed(i,'frequency',e.target.value)} />
            <input className="input" type="number" placeholder="Duration days" value={m.durationDays} onChange={e=>changeMed(i,'durationDays',Number(e.target.value))} />
          </div>
        ))}
        <div>
          <button type="button" className="btn-outline" onClick={addMed}>Add Medication</button>
        </div>
        <div>
          <button className="btn" disabled={saving}>{saving ? 'Saving...' : 'Save Prescription'}</button>
        </div>
      </form>

      {warnings && warnings.length > 0 && (
        <div className="mt-3 p-3 border rounded bg-yellow-50">
          <h4 className="font-semibold">Interaction Warnings</h4>
          <ul className="list-disc ml-5">
            {warnings.map((w,i)=> <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
