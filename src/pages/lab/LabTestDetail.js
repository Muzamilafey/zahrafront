import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
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

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get(`/lab/${id}`);
        setTest(res.data.labTest);
        setStatus(res.data.labTest?.status || '');
        setSampleStatus(res.data.labTest?.sampleStatus || '');
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
import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
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

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get(`/lab/${id}`);
        setTest(res.data.labTest);
        setStatus(res.data.labTest?.status || '');
        setSampleStatus(res.data.labTest?.sampleStatus || '');
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
*** End Patch
import { useParams, useNavigate } from 'react-router-dom';
