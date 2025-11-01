import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function LabTemplates(){
  const { axiosInstance } = useContext(AuthContext);
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState('');
  const [testsCsv, setTestsCsv] = useState('');

  useEffect(()=>{ load(); },[]);
  async function load(){
    try{
      const res = await axiosInstance.get('/labs/templates');
      setTemplates(res.data.templates || []);
    }catch(e){ console.error(e); }
  }

  async function add(){
    const tests = testsCsv.split(',').map(s=>s.trim()).filter(Boolean);
    if(!name || tests.length===0) return;
    try{
      const res = await axiosInstance.post('/labs/templates', { name, tests });
      setTemplates(res.data.templates || []);
      setName(''); setTestsCsv('');
    }catch(e){ console.error(e); }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Lab Templates</h2>
      <div className="mb-4">
        <input placeholder="Template name" value={name} onChange={e=>setName(e.target.value)} className="p-2 border rounded mr-2" />
        <input placeholder="tests (comma separated)" value={testsCsv} onChange={e=>setTestsCsv(e.target.value)} className="p-2 border rounded mr-2 w-96" />
        <button onClick={add} className="px-3 py-1 bg-brand-600 text-white rounded">Add Template</button>
      </div>
      <div>
        {templates.length===0 ? <div className="text-sm text-gray-500">No templates yet</div> : (
          <ul className="space-y-2">
            {templates.map((t,idx)=> (
              <li key={idx} className="p-2 border rounded">
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-gray-700">{(t.tests||[]).join(', ')}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
