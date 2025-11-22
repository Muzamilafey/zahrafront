import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function DiagnosisList(){
  const { axiosInstance } = useContext(AuthContext);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(()=>{
    const load = async ()=>{
      try{
        setLoading(true);
        const res = await axiosInstance.get('/diagnoses');
        setList(res.data.diagnoses || res.data || []);
      }catch(e){ console.error(e); setError('Failed to load'); }
      finally{ setLoading(false); }
    };
    load();
  },[axiosInstance]);

  if (loading) return <div className="p-6 text-center">Loading diagnoses...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Diagnoses</h2>
        <Link to="/lab/tests/new" className="btn-brand">New Diagnosis</Link>
      </div>
      <div className="bg-white border rounded p-4">
        {list.length === 0 ? (
          <div className="text-sm text-gray-600">No diagnoses registered.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Code</th><th className="p-2 text-left">Description</th></tr>
            </thead>
            <tbody>
              {list.map(d => (
                <tr key={d._id || d.id} className="border-t"><td className="p-2">{d.name}</td><td className="p-2">{d.code}</td><td className="p-2">{d.description}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
