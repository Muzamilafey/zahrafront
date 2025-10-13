import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Toast from '../../components/ui/Toast';

export default function AdminNurseAssignment() {
  const { axiosInstance } = useContext(AuthContext);
  const [mapping, setMapping] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [nurses, setNurses] = useState([]);
  const [selectedNurse, setSelectedNurse] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    try{
      const res = await axiosInstance.get('/nurses/debug/mapping');
      setMapping(res.data.mapping || []);
      setUnassigned(res.data.unassigned || []);
    }catch(e){ console.error(e); }
    setLoading(false);
  };

  useEffect(()=>{ load(); }, []);

  const openAssignModal = async (patient) => {
    setSelectedPatient(patient);
    try{
      const r = await axiosInstance.get('/nurses/list');
      setNurses(r.data.nurses || []);
      setSelectedNurse('');
    }catch(e){ console.error(e); }
  };

  const doReassign = async () => {
    if(!selectedPatient) return;
    try{
      await axiosInstance.put(`/nurses/reassign/${selectedPatient._id}`, { nurseId: selectedNurse });
      setToast({ message: 'Reassigned', type: 'success' });
      await load();
      setSelectedPatient(null);
    }catch(e){ console.error(e); alert('Failed to reassign'); }
  };

  const doUnassign = async (patientId) => {
    setConfirm({ open: true, title: 'Unassign Nurse', message: 'Unassign nurse from this patient?', onConfirm: async ()=>{
      setConfirm(null);
      try{ await axiosInstance.delete(`/nurses/unassign/${patientId}`); setToast({ message: 'Unassigned', type: 'success' }); await load(); }catch(e){ console.error(e); setToast({ message: 'Failed to unassign', type: 'error' }); }
    }, onCancel: ()=> setConfirm(null) });
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Nurse assignments</h2>
        <div>
          <button className="btn" onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Assigned by nurse</h3>
          {mapping.map(m => (
            <div key={m.nurse._id} className="mb-3 border-b pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{m.nurse.name} <span className="text-xs text-gray-500">{m.nurse.email}</span></div>
                  <div className="text-sm text-gray-500">{m.count} patients</div>
                </div>
              </div>
              <div className="mt-2">
                {m.patients.map(p => (
                  <div key={p._id} className="flex items-center gap-2 justify-between py-1">
                    <div>
                      <div className="text-sm font-medium">{p.user?.name || ('Patient ' + p.hospitalId)}</div>
                      <div className="text-xs text-gray-500">Ward: {p.admission?.ward || '—'} / Room: {p.admission?.room || '—'} / Bed: {p.admission?.bed || '—'}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-outline" onClick={()=>openAssignModal(p)}>Reassign</button>
                      <button className="btn-danger" onClick={()=>doUnassign(p._id)}>Unassign</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Unassigned patients</h3>
          {unassigned.length === 0 && <div className="text-sm text-gray-500">No unassigned patients</div>}
          {unassigned.map(p => (
            <div key={p._id} className="flex items-center gap-2 justify-between py-1">
              <div>
                <div className="text-sm font-medium">{p.user?.name || ('Patient ' + p.hospitalId)}</div>
                <div className="text-xs text-gray-500">Ward: {p.admission?.ward || '—'} / Bed: {p.admission?.bed || '—'}</div>
              </div>
              <div>
                <button className="btn-outline" onClick={()=>openAssignModal(p)}>Assign Nurse</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* simple modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-full max-w-xl">
            <h4 className="font-semibold mb-2">Assign / Reassign nurse for {selectedPatient.user?.name || ('Patient ' + selectedPatient.hospitalId)}</h4>
            <div className="mb-4">
              <select value={selectedNurse} onChange={e=>setSelectedNurse(e.target.value)} className="w-full p-2 border rounded">
                <option value="">-- Select nurse --</option>
                {nurses.map(n => <option key={n._id} value={n._id}>{n.name} {n.email ? `(${n.email})` : ''}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={()=>setSelectedPatient(null)}>Cancel</button>
              <button className="btn" onClick={doReassign} disabled={!selectedNurse}>Save</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!confirm} title={confirm?.title} message={confirm?.message} onConfirm={confirm?.onConfirm} onCancel={confirm?.onCancel} />
      <Toast toast={toast} onClose={()=>setToast(null)} />
    </div>
  );
}
