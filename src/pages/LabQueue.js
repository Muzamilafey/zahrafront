import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function LabQueue(){
  const { axiosInstance } = useContext(AuthContext);
  const { socket } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [filterTech, setFilterTech] = useState('');
  const [technicians, setTechnicians] = useState([]);
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

  const load = async ()=>{
    setLoading(true);
    try{
      const q = filterTech ? `?assignedTo=${filterTech}` : '';
      const res = await axiosInstance.get('/labs/orders' + q);
      setOrders(res.data.orders || []);
    }catch(e){ console.error(e); }
    setLoading(false);
  };

  const loadTechnicians = async ()=>{
    try{
      const res = await axiosInstance.get('/labs/technicians');
      setTechnicians(res.data.technicians || []);
    }catch(e){ console.error(e); }
  };

  useEffect(()=>{ load(); }, []);
  useEffect(()=>{ loadTechnicians(); }, []);
    // subscribe to socket events
    useEffect(()=>{
      if (!socket) return;
      const onCompleted = (payload) => { console.log('lab:completed', payload); load(); };
      const onCreated = (payload) => { console.log('lab:created', payload); load(); };
      socket.on('lab:completed', onCompleted);
      socket.on('lab:created', onCreated);
      return () => { socket.off('lab:completed', onCompleted); socket.off('lab:created', onCreated); };
    }, [socket]);

  const updateStatus = async (id, status)=>{
    try{
      await axiosInstance.put(`/labs/${id}/status`, { status });
      load();
    }catch(e){ console.error(e); }
  };

  // results/upload UI removed

  const openEdit = (o) => {
    setEditId(o._id);
    setEditData({ testType: o.testType || '', notes: o.notes || '', status: o.status || '', assignedTo: o.assignedTo || '' });
    setEditModalOpen(true);
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

  const submitEdit = async () => {
    if (!editId) return;
    try{
      await axiosInstance.put(`/labs/${editId}`, editData);
      setEditModalOpen(false);
      load();
    }catch(e){ console.error(e); }
  };

  const submitResults = async () => {
    // removed: file upload flow. Instead, we expect status dropdown to be used for state changes or
    // edits to carry results text via edit modal if needed.
    setResultsModalOpen(false);
    load();
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
    <div>
      <h1 className="text-2xl font-bold mb-4">Lab Queue</h1>
      {loading ? <div>Loading...</div> : (
        <div className="bg-white rounded p-4 shadow">
          <table className="table-auto w-full text-sm">
            <thead>
              <tr><th>#</th><th>Patient</th><th>Test</th><th>Status</th><th>Sample</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {orders.map(o=> (
                <tr key={o._id} className="border-t">
                  <td className="px-2 py-1">{o.labTestNumber}</td>
                  <td className="px-2 py-1">{o.patient?.user?.name || o.patient}</td>
                  <td className="px-2 py-1">{o.testType}</td>
                  <td className="px-2 py-1">{o.assignedToUser?.name || (o.assignedTo?.name || '-')}</td>
                  <td className="px-2 py-1">
                    <select className="input" value={o.status || ''} onChange={e=>updateStatus(o._id, e.target.value)}>
                      <option value="requested">requested</option>
                      <option value="processing">processing</option>
                      <option value="ready_for_collection">ready_for_collection</option>
                      <option value="collected">collected</option>
                      <option value="completed">completed</option>
                      <option value="validated">validated</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                  <td className="px-2 py-1">{o.sampleStatus}</td>
                  <td className="px-2 py-1">
                    {/* manual action buttons removed in favor of the status selector */}
                    {o.status === 'requested' && (<button className="btn-outline mr-2" onClick={()=>updateStatus(o._id,'processing')}>Start</button>)}
                    {o.status === 'processing' && (<button className="btn-brand mr-2" onClick={()=>updateStatus(o._id,'completed')}>Complete</button>)}
                    <button className="btn-outline mr-2" onClick={()=>openEdit(o)}>Edit</button>
                    <button className="btn-outline mr-2" onClick={()=>openView(o)}>View</button>
                    <button className="btn-outline mr-2" onClick={()=>openHistory(o)}>History</button>
                    <button className="btn-outline" onClick={()=>downloadReport(o._id)}>Download Report</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Results modal removed - uploads disabled */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={()=>setEditModalOpen(false)}>
          <div className="absolute inset-0 bg-black opacity-50" />
          <div className="bg-white rounded p-6 z-60 w-full max-w-lg" onClick={e=>e.stopPropagation()}>
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
              <select className="input w-full" value={editData.assignedTo} onChange={e=>setEditData(prev=>({...prev, assignedTo: e.target.value}))}>
                <option value="">-- Unassigned --</option>
                {technicians.map(t=> (<option key={t._id} value={t._id}>{t.name} — {t.email}</option>))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={()=>setEditModalOpen(false)}>Cancel</button>
              <button className="btn-brand" onClick={submitEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={()=>setHistoryModalOpen(false)}>
          <div className="absolute inset-0 bg-black opacity-50" />
          <div className="bg-white rounded p-6 z-60 w-full max-w-lg" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Lab Request History</h3>
            <div className="space-y-2 text-sm">
              {historyEntries.length === 0 ? <div className="text-gray-500">No history</div> : historyEntries.map((h, idx)=> (
                <div key={idx} className="p-2 border rounded">
                  <div className="text-xs text-gray-600">{new Date(h.createdAt).toLocaleString()} — {h.role || ''}</div>
                  <div className="text-sm">{h.action} {h.note ? ` — ${h.note}` : ''} {h.fromStatus? ` (${h.fromStatus} → ${h.toStatus})`: ''}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-right"><button className="btn-outline" onClick={()=>setHistoryModalOpen(false)}>Close</button></div>
          </div>
        </div>
      )}
      {/* View modal */}
      {viewModalOpen && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={()=>setViewModalOpen(false)}>
          <div className="absolute inset-0 bg-black opacity-50" />
          <div className="bg-white rounded p-6 z-60 w-full max-w-lg" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Lab Test Details</h3>
            <div className="mb-2"><strong>Test:</strong> {viewData.testType}</div>
            <div className="mb-2"><strong>Status:</strong> {viewData.status}</div>
            <div className="mb-2"><strong>Notes:</strong><div className="p-2 bg-gray-50 rounded mt-1">{viewData.notes || '—'}</div></div>
            <div className="mb-2"><strong>Results:</strong><div className="p-2 bg-gray-50 rounded mt-1">{viewData.resultsText || '—'}</div></div>
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
            <div className="mt-4 text-right"><button className="btn-outline" onClick={()=>setViewModalOpen(false)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
