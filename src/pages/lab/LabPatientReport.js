import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function LabPatientReport(){
  const { axiosInstance } = useContext(AuthContext);
  const [patientId, setPatientId] = useState('');
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load(){
    if(!patientId) return;
    setLoading(true);
    try{
      const res = await axiosInstance.get(`/patients/${patientId}`);
      setPatient(res.data.patient);
    }catch(e){ console.error(e); setPatient(null); }
    setLoading(false);
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Lab Visits Report (Per Patient)</h2>
      <div className="mb-4 flex items-center gap-2">
        <input placeholder="Enter patient id (or mrn)" value={patientId} onChange={e=>setPatientId(e.target.value)} className="p-2 border rounded w-64" />
        <button onClick={load} className="px-3 py-1 bg-brand-600 text-white rounded">Load</button>
      </div>

      {loading && <div>Loading...</div>}
      {patient && (
        <div>
          <div className="mb-2 font-semibold">{patient.name || patient.firstName + ' ' + patient.lastName}</div>
          <div className="mb-4 text-sm text-gray-600">MRN: {patient.hospitalId || patient.mrn || '-'}</div>
          <h3 className="font-medium mb-2">Lab Requests</h3>
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left"><th>Date</th><th>Test</th><th>Status</th><th>Doctor</th></tr>
            </thead>
            <tbody>
              {(patient.labTests || []).map(l => (
                <tr key={l._id} className="border-t">
                  <td>{new Date(l.createdAt).toLocaleString()}</td>
                  <td>{l.testType}</td>
                  <td>{l.status}</td>
                  <td>{l.doctor?.name || l.doctor?.firstName || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
