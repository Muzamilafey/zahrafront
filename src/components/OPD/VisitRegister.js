import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function VisitRegister() {
  const { axiosInstance } = useContext(AuthContext);
  const [patientId, setPatientId] = useState('');
  const [isNew, setIsNew] = useState(true);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axiosInstance.post('/api/opd/visits/register', { patient: patientId, isNewPatient: isNew, reason });
      setResult(res.data.visit);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">Register OPD Visit</h2>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm">Patient ID</label>
          <input value={patientId} onChange={e=>setPatientId(e.target.value)} className="input" placeholder="Patient ObjectId or ID" />
        </div>
        <div>
          <label className="inline-flex items-center"><input type="checkbox" checked={isNew} onChange={e=>setIsNew(e.target.checked)} className="mr-2"/> New Patient</label>
        </div>
        <div>
          <label className="block text-sm">Reason for visit</label>
          <input value={reason} onChange={e=>setReason(e.target.value)} className="input" />
        </div>
        <div>
          <button className="btn" disabled={saving}>{saving ? 'Saving...' : 'Register Visit'}</button>
        </div>
      </form>

      {result && (
        <div className="mt-4 p-3 border rounded">
          <div><strong>Visit Number:</strong> {result.visitNumber}</div>
          <div><strong>Status:</strong> {result.status}</div>
        </div>
      )}
    </div>
  );
}
