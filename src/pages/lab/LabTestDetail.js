import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const LabTestDetail = () => {
  const { id } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [sampleStatus, setSampleStatus] = useState('');
  const [resultsText, setResultsText] = useState('');
  const [files, setFiles] = useState(null);
  const [structuredResults, setStructuredResults] = useState([]);

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get(`/lab/${id}`);
        setTest(res.data.labTest);
        setStatus(res.data.labTest?.status || '');
        setSampleStatus(res.data.labTest?.sampleStatus || '');
        // initialize structured results if subtests exist
        const t = res.data.labTest;
        const subs = t?.subTests || t?.tests || t?.items || [];
        if (Array.isArray(subs) && subs.length) {
          setStructuredResults(subs.map(s => ({
            id: s._id || s.id || s.subTestId || s._id,
            name: s.name || s.testName || s.label || '',
            input: s.input || s.resultValue || '',
            normal: s.normal || s.normalValue || s.normal_range || '',
            flag: s.flag || ''
          })));
        }
        setLoading(false);
      }catch(err){console.error(err); setLoading(false);}    };
    if (id) load();
  },[id, axiosInstance]);

  const updateStatus = async (newStatus) => {
    try{
      await axiosInstance.put(`/lab/${id}/status`, { status: newStatus });
      setStatus(newStatus);
    }catch(err){console.error(err);}
  };

  const attachResults = async (e) => {
    e.preventDefault();
    try{
      const form = new FormData();
      form.append('resultsText', resultsText);
      if (files && files.length) {
        for (let i=0;i<files.length;i++) form.append('files', files[i]);
      }
      const res = await axiosInstance.put(`/lab/${id}/results`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setTest(res.data.labTest);
      alert('Results attached');
    }catch(err){console.error(err); alert('Failed to attach results');}
  };

  const saveStructuredResults = async () => {
    try{
      // send JSON structured results first
      const payload = { results: structuredResults.map(r => ({ subTestId: r.id, value: r.input, flag: r.flag })) };
      const res = await axiosInstance.put(`/lab/${id}/results`, payload);
      if (res.data && res.data.labTest) setTest(res.data.labTest);
      alert('Structured results saved');
      // Best-effort: also add these results to the patient's discharge investigations
      try {
        const patientId = test?.patient?._id || test?.patient?.id || test?.patient?.user?._id;
        if (patientId) {
          const investigations = structuredResults.map(r => ({
            name: r.name,
            date: new Date().toISOString(),
            resultsText: r.input,
            status: 'completed',
            flag: r.flag,
            source: 'lab',
            labTestId: id
          }));
          await axiosInstance.post(`/discharge/patient/${patientId}/investigations`, { investigations }).catch(()=>{});
        }
      } catch(e) { console.warn('Failed to push results to discharge investigations', e); }
    }catch(err){
      console.error('structured save failed', err);
      // fallback to sending as text
      try{
        const form = new FormData();
        form.append('resultsText', resultsText || JSON.stringify(structuredResults));
        if (files && files.length) for (let i=0;i<files.length;i++) form.append('files', files[i]);
        const res2 = await axiosInstance.put(`/lab/${id}/results`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res2.data && res2.data.labTest) setTest(res2.data.labTest);
        alert('Results saved (fallback)');
        // best-effort: push fallback results to discharge investigations as well
        try {
          const patientId = test?.patient?._id || test?.patient?.id || test?.patient?.user?._id;
          if (patientId) {
            const investigations = structuredResults.length ? structuredResults.map(r => ({
              name: r.name,
              date: new Date().toISOString(),
              resultsText: r.input || resultsText || '',
              status: 'completed',
              flag: r.flag,
              source: 'lab',
              labTestId: id
            })) : [{ name: test.testType || 'Lab result', date: new Date().toISOString(), resultsText: resultsText || '', status: 'completed', source: 'lab', labTestId: id }];
            await axiosInstance.post(`/discharge/patient/${patientId}/investigations`, { investigations }).catch(()=>{});
          }
        } catch(e) { console.warn('Failed to push fallback results to discharge investigations', e); }
      }catch(e){ console.error(e); alert('Failed to save results'); }
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!test) return <div className="p-6">Not found</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Lab Request: {test.labTestNumber || test._id}</h1>
      <div className="bg-white border rounded p-4 mb-4">
        <div><strong>Patient:</strong> {test.patient?.user?.name || '-'}</div>
        <div><strong>Doctor:</strong> {test.doctor?.user?.name || '-'}</div>
        <div><strong>Test:</strong> {test.testType}</div>
        <div><strong>Status:</strong> {status}</div>
      </div>

      <div className="bg-white border rounded p-4 mb-4">
        <h2 className="font-semibold">Update Status</h2>
        <div className="flex gap-2 mt-2">
          <button onClick={()=>updateStatus('processing')} className="px-3 py-1 bg-gray-200 rounded">Processing</button>
          <button onClick={()=>updateStatus('ready_for_collection')} className="px-3 py-1 bg-gray-200 rounded">Ready For Collection</button>
          <button onClick={()=>updateStatus('collected')} className="px-3 py-1 bg-gray-200 rounded">Collected</button>
          <button onClick={()=>updateStatus('completed')} className="px-3 py-1 bg-green-600 text-white rounded">Complete</button>
        </div>
      </div>

      {/* Structured results entry table matching classic lab report */}
      <div className="bg-white border rounded p-4 mb-4">
        <h2 className="font-semibold mb-2">Investigations / Sub-tests</h2>
        {structuredResults.length === 0 ? (
          <div className="text-sm text-gray-600">No structured sub-tests available. Use free-text entry below.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="bg-gray-100 text-left"><th className="px-2 py-1">Test</th><th className="px-2 py-1">Input</th><th className="px-2 py-1">Normal Values</th><th className="px-2 py-1">Flag</th></tr>
              </thead>
              <tbody>
                {structuredResults.map((r, idx)=> (
                  <tr key={r.id || idx} className="border-t">
                    <td className="px-2 py-1">{r.name}</td>
                    <td className="px-2 py-1"><input className="border p-1 w-full" value={r.input} onChange={e=>setStructuredResults(prev=>{ const copy=[...prev]; copy[idx]={...copy[idx], input: e.target.value}; return copy; })} /></td>
                    <td className="px-2 py-1">{r.normal}</td>
                    <td className="px-2 py-1">
                      <select value={r.flag} onChange={e=>setStructuredResults(prev=>{ const copy=[...prev]; copy[idx]={...copy[idx], flag: e.target.value}; return copy; })} className="border p-1">
                        <option value="">N</option>
                        <option value="H">H</option>
                        <option value="L">L</option>
                        <option value="A">A</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-right">
              <button onClick={saveStructuredResults} className="px-3 py-1 bg-blue-600 text-white rounded">Save Results</button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={attachResults} className="bg-white border rounded p-4">
        <h2 className="font-semibold">Attach Results</h2>
        <textarea rows={6} value={resultsText} onChange={e=>setResultsText(e.target.value)} className="w-full border p-2 mb-2" placeholder="Enter results summary" />
        <input type="file" multiple onChange={e=>setFiles(e.target.files)} className="mb-2" />
        <div className="text-right">
          <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Upload Results</button>
        </div>
      </form>
    </div>
  );
};

export default LabTestDetail;
