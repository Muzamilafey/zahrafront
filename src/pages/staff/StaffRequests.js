import React, { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function StaffRequests(){
  const { axiosInstance } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingIds, setUpdatingIds] = useState(new Set());

  const load = useCallback(async ()=>{
    setLoading(true);
    try{
      const res = await axiosInstance.get('/requests/assigned/me');
      setRequests(res.data.requests || []);
    }catch(e){ console.error('Failed to load assigned requests', e); }
    setLoading(false);
  }, [axiosInstance]);

  useEffect(()=>{ load(); }, [load]);

  const updateStatus = async (id, status) => {
    // guard: don't update if already completed
    const current = requests.find(r => r._id === id);
    if (!current) return;
    if (current.status === 'completed') return;

    // prevent double submit
    setUpdatingIds(s => new Set([...s, id]));
    try{
      await axiosInstance.put(`/requests/${id}`, { status });
      await load();
    }catch(e){ console.error('Failed to update status', e); }
    setUpdatingIds(s => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">My Assigned Requests</h2>
      {loading ? <div>Loading...</div> : (
        <div className="space-y-3">
          {requests.length === 0 ? <div className="text-sm text-gray-500">No assigned requests</div> : (
            requests.map(r => (
              <div key={r._id} className="bg-white rounded p-3 shadow flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.type} — Requested by: {r.requestedBy?.name || r.requestedBy?.email}</div>
                  <div className="text-xs text-gray-500">{r.details || '-'} — {r.ward ? `Ward: ${r.ward}` : ''} {r.room ? `Room: ${r.room}` : ''}</div>
                  <div className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`text-xs px-2 py-1 rounded ${r.status==='pending'?'bg-yellow-100 text-yellow-800': r.status==='in_progress' ? 'bg-blue-100 text-blue-800' : r.status==='completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{r.status}</div>
                  <div className="flex items-center gap-2">
                    {r.status === 'pending' && (
                      <button
                        className="btn-outline text-xs"
                        onClick={()=>updateStatus(r._id, 'in_progress')}
                        disabled={updatingIds.has(r._id)}
                      >
                        Start
                      </button>
                    )}

                    {r.status === 'in_progress' && (
                      <button
                        className="btn-primary text-xs"
                        onClick={()=>updateStatus(r._id, 'completed')}
                        disabled={updatingIds.has(r._id)}
                      >
                        Complete
                      </button>
                    )}

                    {r.status === 'completed' && (
                      <div className="text-xs text-gray-500">Completed — not editable</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
