import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function ConsultationForm() {
  const { axiosInstance } = useContext(AuthContext);
  const [visitId, setVisitId] = useState('');
  const [clinicianId, setClinicianId] = useState('');
  const [presenting, setPresenting] = useState('');
  const [provisional, setProvisional] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.post('/api/opd/consultations', { visit: visitId, clinician: clinicianId, presentingComplaints: presenting, provisionalDiagnosis: provisional, treatmentPlan });
      alert('Saved');
    } catch (err) { console.error(err); alert(err.response?.data?.message || err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-3">Consultation / Doctor Notes</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="input" placeholder="Visit ID" value={visitId} onChange={e=>setVisitId(e.target.value)} />
        <input className="input" placeholder="Clinician ID" value={clinicianId} onChange={e=>setClinicianId(e.target.value)} />
        <textarea className="input" placeholder="Presenting complaints" value={presenting} onChange={e=>setPresenting(e.target.value)} />
        <input className="input" placeholder="Provisional diagnosis (ICD-10)" value={provisional} onChange={e=>setProvisional(e.target.value)} />
        <textarea className="input" placeholder="Treatment plan" value={treatmentPlan} onChange={e=>setTreatmentPlan(e.target.value)} />
        <div>
          <button className="btn" disabled={saving}>{saving ? 'Saving...' : 'Save Consultation'}</button>
        </div>
      </form>
    </div>
  );
}
