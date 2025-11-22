import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function PatientDiagnosis(){
  const { id } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const [diagnoses, setDiagnoses] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(()=>{
    const load = async ()=>{
      try{
        setLoading(true);
        const [dRes, pRes] = await Promise.all([
          axiosInstance.get('/diagnoses').catch(()=>({ data: [] })),
          axiosInstance.get(`/patients/${id}`).catch(()=>({ data: {} }))
        ]);
        const available = dRes.data?.diagnoses || dRes.data || [];
        setDiagnoses(available);
        const patient = pRes.data?.patient || pRes.data || {};
        const existing = patient.diagnoses || patient.primaryDiagnosis ? (
          // patient may store diagnoses in different shapes
          (patient.diagnoses && Array.isArray(patient.diagnoses) ? patient.diagnoses.map(d=>d._id || d.id) : [])
        ) : [];
        setSelected(existing);
      }catch(e){ console.error(e); setError('Failed to load'); }
      finally{ setLoading(false); }
    };
    load();
  },[axiosInstance, id]);

  const toggle = (diagId) => {
    setSelected(prev => prev.includes(diagId) ? prev.filter(x=>x!==diagId) : [...prev, diagId]);
  };

  const save = async () => {
    try{
      setSaving(true); setError('');
      await axiosInstance.post(`/patients/${id}/diagnoses`, { diagnoses: selected });
      alert('Diagnoses saved');
    }catch(e){ console.error(e); setError('Failed to save'); }
    finally{ setSaving(false); }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Patient Diagnoses</h2>
      <div className="bg-white border rounded p-4">
        <p className="text-sm text-gray-600 mb-3">Select one or more diagnoses to attach to this patient.</p>
        {diagnoses.length === 0 ? (
          <div className="text-sm text-gray-600">No diagnoses available. Add diagnoses via the Diagnoses administration page.</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {diagnoses.map(d=> (
              <label key={d._id || d.id} className="flex items-center gap-2 p-2 border rounded">
                <input type="checkbox" checked={selected.includes(d._id || d.id)} onChange={()=>toggle(d._id || d.id)} />
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-gray-500">{d.code} {d.description ? ` - ${d.description}` : ''}</div>
                </div>
              </label>
            ))}
          </div>
        )}

        {error && <div className="text-sm text-red-600 mt-3">{error}</div>}

        <div className="mt-4 text-right">
          <button onClick={save} disabled={saving} className="px-3 py-1 bg-blue-600 text-white rounded">{saving ? 'Saving...' : 'Save Diagnoses'}</button>
        </div>
      </div>
    </div>
  );
}
