import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';

// Lab dashboard: allow quick actions on lab orders (start, complete, attach results, edit, history)

export default function LabDashboard(){
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const { socket } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [resultsModalId, setResultsModalId] = useState(null);
  // removed upload-related state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ testType: '', notes: '', status: '', assignedTo: '' });
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  useEffect(()=>{
    const load = async ()=>{
      setLoading(true);
      try{
        const res = await axiosInstance.get('/labs/orders');
        setOrders(res.data.orders || []);
      }catch(e){ console.error('Failed to load lab orders', e); }
      setLoading(false);
    };
    load();
  }, [axiosInstance]);

  // refresh when socket notifies of changes
  useEffect(()=>{
    if (!socket) return;
    // handlers check latest modal-open flags because they are included in deps
    const onUpdated = (p) => {
      // don't auto-reload if any edit/history modal is open (preserve in-progress input)
      if (editModalOpen || historyModalOpen) return;
      axiosInstance.get('/labs/orders').then(r=>setOrders(r.data.orders||[])).catch(()=>{});
    };
    const onCreated = (p) => {
      if (editModalOpen || historyModalOpen) return;
      axiosInstance.get('/labs/orders').then(r=>setOrders(r.data.orders||[])).catch(()=>{});
    };
    socket.on('lab:updated', onUpdated);
    socket.on('lab:created', onCreated);
    socket.on('lab:completed', onUpdated);
    return ()=>{ socket.off('lab:updated', onUpdated); socket.off('lab:created', onCreated); socket.off('lab:completed', onUpdated); };
  }, [socket, axiosInstance, editModalOpen, historyModalOpen]);

  const load = async ()=>{
    setLoading(true);
    try{ const res = await axiosInstance.get('/labs/orders'); setOrders(res.data.orders || []); }catch(e){ console.error(e); }
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    try{
      await axiosInstance.put(`/labs/${id}/status`, { status });
      await load();
    }catch(e){ console.error(e); }
  };


  const openEdit = (o) => {
    setEditId(o._id);
    setEditData({ testType: o.testType || '', notes: o.notes || '', status: o.status || '', assignedTo: o.assignedTo || '' });
    setEditModalOpen(true);
  };

  const submitEdit = async () => {
    if (!editId) return;
    try{
      await axiosInstance.put(`/labs/${editId}`, editData);
      setEditModalOpen(false);
      await load();
    }catch(e){ console.error(e); }
  };

  const openHistory = async (o) => {
    try{
      const res = await axiosInstance.get(`/labs/${o._id}`);
      const lt = res.data.labTest || res.data;
      setHistoryEntries(lt.history || []);
      setHistoryModalOpen(true);
    }catch(e){ console.error(e); }
  };

  const openView = async (o) => {
    try{
      const res = await axiosInstance.get(`/labs/${o._id}`);
      const lt = res.data.labTest || res.data;
      setViewData(lt);
      setViewModalOpen(true);
    }catch(e){ console.error(e); }
  };

  const downloadReport = async (id) => {
    try{
      const resp = await axiosInstance.get(`/labs/${id}/report`, { responseType: 'blob' });
      if (resp.status === 200) {
        const blob = new Blob([resp.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(()=> URL.revokeObjectURL(url), 60*1000);
      }
    }catch(e){ console.error(e); }
  };
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mt-0 mb-0">
        <h1 className="text-2xl font-bold mt-0 mb-0">Lab Technician Dashboard</h1>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2 bg-white rounded p-4 shadow"> 
          <h3 className="font-semibold mb-2">Pending Lab Orders</h3>
          {loading ? (<div>Loading...</div>) : (orders.length === 0 ? (
            <div className="text-sm text-gray-600">No pending lab orders.</div>
          ) : (
            <div className="space-y-2">
              {orders.map(o => (
                <div key={o._id} className="p-3 border rounded">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium">{o.testType}</div>
                      <div className="text-xs text-gray-500">Patient: {o.patient?.user?.name || o.patient}</div>
                      <div className="text-xs text-gray-500">Requested by: {o.doctor?.user?.name || '-'}</div>
                      {o.notes && <div className="mt-1 text-sm text-gray-700">Notes: {o.notes}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* status selector to allow changing to any status */}
                      <select className="input" value={o.status || ''} onChange={e=>updateStatus(o._id, e.target.value)}>
                        <option value="requested">requested</option>
                        <option value="processing">processing</option>
                        <option value="ready_for_collection">ready_for_collection</option>
                        <option value="collected">collected</option>
                        <option value="completed">completed</option>
                        <option value="validated">validated</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                      <button type="button" className="btn-outline" onClick={()=>openEdit(o)}>Edit</button>
                      <button type="button" className="btn-outline" onClick={()=>openView(o)}>View</button>
                      <button type="button" className="btn-outline" onClick={()=>openHistory(o)}>History</button>
                      <button type="button" className="btn-outline" onClick={()=>downloadReport(o._id)}>Report</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="bg-white rounded p-4 shadow">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="btn-modern w-full">Record Result</button>
            <button className="btn-modern w-full">Assign Sample</button>
          </div>
          <hr className="my-4" />
          <h3 className="font-semibold mb-3">Lab Pages</h3>
          <div className="space-y-2 text-sm">
            <button onClick={() => navigate('/dashboard/lab/queue')} className="btn-outline w-full text-left">Lab Queue</button>
            <button onClick={() => navigate('/dashboard/lab/requests')} className="btn-outline w-full text-left">Lab Requests</button>
            <button onClick={() => navigate('/dashboard/lab/tests')} className="btn-outline w-full text-left">Lab Tests Catalog</button>
            <button onClick={() => navigate('/dashboard/lab/prices')} className="btn-outline w-full text-left">Lab Tests Prices</button>
            <button onClick={() => navigate('/dashboard/lab/patient-report')} className="btn-outline w-full text-left">Lab Visits Report</button>
            <button onClick={() => navigate('/dashboard/lab/templates')} className="btn-outline w-full text-left">Lab Templates</button>
          </div>
        </div>
      </div>
        {/* Results modal removed - uploads disabled */}

      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={()=>setEditModalOpen(false)}>
          <div className="absolute inset-0 bg-black opacity-50 z-40" />
          <div className="bg-white rounded p-6 relative z-50 w-full max-w-lg" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Edit Lab Request</h3>
            <div className="mb-2">
              <label className="block text-sm text-gray-600">Test Type</label>
              <input className="input w-full" value={editData.testType} onChange={e=>setEditData(prev=>({...prev, testType: e.target.value}))} />
            </div>
            <div className="mb-2">
              <label className="block text-sm text-gray-600">Notes</label>
              <textarea className="input w-full" rows={4} value={editData.notes} onChange={e=>setEditData(prev=>({...prev, notes: e.target.value}))} />
            </div>
            <div className="mb-2">
              <label className="block text-sm text-gray-600">Status</label>
              <select className="input w-full" value={editData.status} onChange={e=>setEditData(prev=>({...prev, status: e.target.value}))}>
                <option value="requested">requested</option>
                <option value="processing">processing</option>
                <option value="ready_for_collection">ready_for_collection</option>
                <option value="collected">collected</option>
                <option value="completed">completed</option>
                <option value="validated">validated</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600">Assign Technician (optional)</label>
              <input className="input w-full" value={editData.assignedTo} onChange={e=>setEditData(prev=>({...prev, assignedTo: e.target.value}))} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={()=>setEditModalOpen(false)}>Cancel</button>
              <button type="button" className="btn-brand" onClick={submitEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={()=>setHistoryModalOpen(false)}>
          <div className="absolute inset-0 bg-black opacity-50 z-40" />
          <div className="bg-white rounded p-6 relative z-50 w-full max-w-lg" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Lab Request History</h3>
            <div className="space-y-2 text-sm">
              {historyEntries.length === 0 ? <div className="text-gray-500">No history</div> : historyEntries.map((h, idx)=> (
                <div key={idx} className="p-2 border rounded">
                  <div className="text-xs text-gray-600">{new Date(h.createdAt).toLocaleString()} — {h.role || ''}</div>
                  <div className="text-sm">{h.action} {h.note ? ` — ${h.note}` : ''} {h.fromStatus? ` (${h.fromStatus} → ${h.toStatus})`: ''}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-right"><button type="button" className="btn-outline" onClick={()=>setHistoryModalOpen(false)}>Close</button></div>
          </div>
        </div>
      )}
      {/* View modal */}
      {viewModalOpen && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={()=>setViewModalOpen(false)}>
          <div className="absolute inset-0 bg-black opacity-50 z-40" />
          <div className="bg-white rounded p-6 relative z-50 w-full max-w-lg text-sm" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Lab Test Details</h3>
            <div className="mb-2"><strong>Test:</strong> {viewData.testType}</div>
            <div className="mb-2"><strong>Status:</strong> {viewData.status}</div>
            <div className="mb-2"><strong>Notes:</strong><div className="p-2 bg-gray-50 rounded mt-1">{viewData.notes || '—'}</div></div>
            <div className="mb-2"><strong>Results:</strong><div className="p-2 bg-gray-50 rounded mt-1">{viewData.resultsText || '—'}</div></div>
            {viewData.resultsFiles && viewData.resultsFiles.length > 0 && (
              <div className="mb-2"><strong>Files:</strong>
                <ul className="list-disc ml-6 mt-1">
                  {viewData.resultsFiles.map((f, i)=> (<li key={i}><a className="text-blue-600" href={f.path} target="_blank" rel="noreferrer">{f.filename || f.path}</a></li>))}
                </ul>
              </div>
            )}
            <div className="mt-3">
              <strong>Recent History</strong>
              <div className="space-y-1 mt-2">
                {(viewData.history || []).slice(-5).reverse().map((h, idx)=>(
                  <div key={idx} className="p-2 border rounded bg-gray-50">
                    <div className="text-xs text-gray-600">{new Date(h.createdAt).toLocaleString()} {h.role? `— ${h.role}` : ''}</div>
                    <div className="text-sm">{h.action} {h.note? `— ${h.note}` : ''} {h.fromStatus? `(${h.fromStatus} → ${h.toStatus})` : ''}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 text-right"><button type="button" className="btn-outline" onClick={()=>setViewModalOpen(false)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
