import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function NurseAdmissionHistory(){
  const { axiosInstance } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get('/notifications/admissions/me');
        setLogs(res.data.logs || []);
      }catch(e){
        console.error(e);
        setError('Failed to load admission logs');
      }
    };
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Admission History</h1>
      {error && <div className="text-red-600">{error}</div>}
      <div className="mt-4">
        {logs.length === 0 ? (
          <div className="text-sm text-gray-600">No admission logs</div>
        ) : (
          <div className="space-y-2">
            {logs.map(l => (
              <div key={l._id} className="p-3 bg-white rounded shadow-sm flex items-start gap-3">
                <div className="text-sm">
                  <div className="font-medium">{l.type === 'admit' ? 'Admitted' : 'Discharged'}</div>
                  <div className="text-xs text-gray-500">{new Date(l.createdAt).toLocaleString()}</div>
                  <div className="text-sm mt-1">Patient: {(
                    l.patient && typeof l.patient === 'object' ? (l.patient.user?.name || l.patient._id || String(l.patient)) : (typeof l.patient === 'string' ? l.patient : '-')
                  )}</div>
                  <div className="text-xs text-gray-500">Ward: {l.ward || '-'} • Room: {l.room || '-'} • Bed: {l.bed || '-'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
