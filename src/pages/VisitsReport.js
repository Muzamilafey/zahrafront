import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function VisitsReport(){
  const { axiosInstance } = useContext(AuthContext);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlyWalkIns, setOnlyWalkIns] = useState(false);

  useEffect(()=>{ load(); }, [onlyWalkIns]);
  const load = async () => {
    try{
      setLoading(true);
      // backend may offer aggregation endpoint, try with query param
      const res = await axiosInstance.get('/visits/report', { params: { walkins: onlyWalkIns } });
      setReport(res.data.report || res.data || []);
    }catch(e){
      console.error(e);
    }finally{ setLoading(false); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Visits Report (by Diagnosis)</h2>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={onlyWalkIns} onChange={e => setOnlyWalkIns(e.target.checked)} />
          <span className="text-sm">Show only Walk-ins</span>
        </label>
      </div>

      {loading ? (
        <div className="py-8 text-center">Loading report...</div>
      ) : (
        <div className="bg-white rounded shadow p-4">
          {report.length === 0 ? (
            <div className="text-center text-gray-500">No data</div>
          ) : (
            <div className="space-y-4">
              {report.map(item => (
                <div key={item.diagnosis || item._id} className="border rounded p-3">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{item.diagnosis || 'Unknown'}</div>
                    <div className="text-sm text-gray-600">{item.count || item.total || 0} visits</div>
                  </div>
                  {item.samples && (
                    <div className="mt-2 text-sm text-gray-600">Examples: {item.samples.join(', ')}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
