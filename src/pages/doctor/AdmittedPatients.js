import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Toast from '../../components/ui/Toast';

export default function AdmittedPatients(){
  const { axiosInstance, user } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [nurses, setNurses] = useState([]);
  // map patientId -> selected nurseId
  const [selection, setSelection] = useState({});
  const [statusMap, setStatusMap] = useState({}); // map patientId -> {loading, error, success}

  useEffect(()=>{ load(); loadNurses(); }, []);
  const load = async ()=>{ try{ const res = await axiosInstance.get('/patients/admitted'); setPatients(res.data.patients||[]); }catch(e){console.error(e);} };
  const loadNurses = async ()=>{ try{ const res = await axiosInstance.get('/nurses/list'); setNurses(res.data.nurses||[]); }catch(e){console.error(e);} };

  const assign = async (patientId)=>{
    const nurseId = selection[patientId];
    if(!nurseId) return alert('Select a nurse for this patient');
  // open confirm dialog (replaced window.confirm)
  setConfirm({ open: true, title: 'Confirm Assignment', message: 'Confirm assigning this nurse to the patient?', onConfirm: async ()=>{
    setConfirm(null);
    await doAssignConfirmed(patientId, nurseId);
  }, onCancel: ()=> setConfirm(null) });
  return;
  };

  const doAssignConfirmed = async (patientId, nurseId) => {
    setStatusMap(s=>({ ...s, [patientId]: { loading: true } }));
    try{
      await axiosInstance.put(`/nurses/assign/${patientId}`, { nurseId });
      setStatusMap(s=>({ ...s, [patientId]: { success: 'Assigned' } }));
      await load();
      setSelection(s=>{ const copy = { ...s }; delete copy[patientId]; return copy; });
      setToast({ message: 'Nurse assigned', type: 'success' });
    }catch(e){
      console.error(e);
      const msg = e?.response?.data?.message || 'Failed to assign';
      setStatusMap(s=>({ ...s, [patientId]: { error: msg } }));
      setToast({ message: msg, type: 'error' });
    }finally{
      setTimeout(()=> setStatusMap(s=>{ const copy = { ...s }; if(copy[patientId]) copy[patientId].loading = false; return copy; }), 600);
    }
  };

  // Helper to format assignedNurse for display (handles id, Nurse doc, or populated user)
  const formatNurse = (n) => {
    if (!n) return '';
    if (typeof n === 'string') return n;
    // If it's a Mongoose doc or object
    if (n.name) return n.name;
    if (n.user && typeof n.user === 'object' && n.user.name) return n.user.name;
    if (n.user && typeof n.user === 'string') return n.user;
    // email fallback
    if (n.email) return n.email;
    // id fallback
    if (n._id) return n._id;
    return String(n);
  };

  // Display nurse name using the local nurses list when assignedNurse is stored as an id
  const displayNurse = (n) => {
    if (!n) return '';
    if (typeof n === 'string') {
      const found = nurses.find(x => x._id === n);
      if (found) return `${found.name}${found.email ? ` — ${found.email}` : ''}`;
      return n; // fallback to id
    }
    return formatNurse(n);
  };


  // Admin reassign modal state
  const [reassignPatient, setReassignPatient] = useState(null);
  const [reassignNurse, setReassignNurse] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const submitReassign = async ()=>{
    if(!reassignPatient || !reassignNurse) return alert('Pick a nurse');
    try{
      await axiosInstance.put(`/nurses/reassign/${reassignPatient}`, { nurseId: reassignNurse });
      setToast({ message: 'Reassigned', type: 'success' });
      setReassignPatient(null); setReassignNurse(''); await load();
    }catch(e){ alert(e?.response?.data?.message || 'Failed to reassign'); }
  };
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Admitted Patients</h2>
      <div className="bg-white p-4 rounded shadow">
        <ul>
          {patients.map(p=> (
            <li key={p._id} className="p-2 border-b flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <div>
                <div className="font-medium">{p.user?.name} <span className="text-sm text-gray-500">({p.user?.hospitalId || p._id})</span></div>
                <div className="text-sm text-gray-600">Ward: {p.admission?.ward || '-'} &middot; Room: {p.admission?.room || '-'} &middot; Bed: {p.admission?.bed || '-'}</div>
                {p.assignedNurse ? (
                  <div className="text-sm text-gray-700">Assigned Nurse: {displayNurse(p.assignedNurse)}</div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="input"
                  value={selection[p._id] || (p.assignedNurse ? (p.assignedNurse._id || p.assignedNurse) : '')}
                  onChange={e=>setSelection(s=>({ ...s, [p._id]: e.target.value }))}
                  disabled={!!p.assignedNurse}
                >
                  <option value="">-- select nurse --</option>
                  {p.assignedNurse && !nurses.find(n => n._id === (p.assignedNurse._id || p.assignedNurse)) && (
                    <option value={p.assignedNurse._id || p.assignedNurse}>{displayNurse(p.assignedNurse)}</option>
                  )}
                  {nurses.map(n=> (<option key={n._id} value={n._id}>{n.name} — {n.email}</option>))}
                </select>
                <button className="btn-brand" disabled={statusMap[p._id]?.loading || !!p.assignedNurse} onClick={()=>assign(p._id)}>{statusMap[p._id]?.loading ? 'Assigning...' : 'Assign'}</button>
                {statusMap[p._id]?.success && <span className="text-green-600 text-sm">{statusMap[p._id].success}</span>}
                {statusMap[p._id]?.error && <span className="text-red-600 text-sm">{statusMap[p._id].error}</span>}
                  {user?.role === 'admin' && (
                    <button className="btn-outline" onClick={()=>{ setReassignPatient(p._id); setReassignNurse(p.assignedNurse?._id || ''); }}>Reassign</button>
                  )}
              </div>
            </li>
          ))}
        </ul>
      </div>
        {/* Reassign modal */}
  {reassignPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-40" onClick={()=>setReassignPatient(null)} />
            <div className="bg-white rounded p-4 z-10 w-96">
              <h3 className="font-semibold mb-2">Reassign Nurse</h3>
              <div className="mb-2">
                <select className="input w-full" value={reassignNurse} onChange={e=>setReassignNurse(e.target.value)}>
                  <option value="">-- select nurse --</option>
                  {nurses.map(n=> (<option key={n._id} value={n._id}>{n.name} — {n.email}</option>))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button className="btn-outline" onClick={()=>setReassignPatient(null)}>Cancel</button>
                <button className="btn-brand" onClick={submitReassign}>Reassign</button>
              </div>
            </div>
          </div>
          )}
          <ConfirmDialog open={!!confirm} title={confirm?.title} message={confirm?.message} onConfirm={confirm?.onConfirm} onCancel={confirm?.onCancel} />
          <Toast toast={toast} onClose={()=>setToast(null)} />
    </div>
  );
}
