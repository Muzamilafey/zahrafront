import React, { useState, useEffect, useContext } from 'react';
import ThemeToggle from '../ui/ThemeToggle';
import { AuthContext } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

export default function NurseDashboard(){
  const { axiosInstance } = useContext(AuthContext);
  const { confirmAsync, showToast } = useUI();
  const [patients, setPatients] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [error, setError] = useState(null);
  const [wardFilter, setWardFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [sortField, setSortField] = useState(''); // 'nurse' | 'ward' | 'room'
  const [sortDir, setSortDir] = useState('asc');

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get('/nurses/me/patients');
        setPatients(res.data.patients || []);
      }catch(e){
        console.error(e);
        setError('Failed to load assigned patients');
      }
    };
    load();
    // load my service requests
    (async ()=>{
      try{
        const r = await axiosInstance.get('/requests/mine');
        setMyRequests(r.data.requests || []);
      }catch(e){ console.error('Failed to load my requests', e); }
    })();
  }, []);

  // helper to safely display a nurse (handles id, Nurse doc, or populated user)
  const formatNurse = (n) => {
    if (!n) return '-';
    if (typeof n === 'string') return n;
    if (n.name) return n.name;
    if (n.user && typeof n.user === 'object' && n.user.name) return n.user.name;
    if (n.user && typeof n.user === 'string') return n.user;
    if (n.email) return n.email;
    if (n._id) return n._id;
    return String(n);
  };

  // helper to safely display patient name/id
  const formatPatient = (p) => {
    if (!p) return '-';
    if (p.user && typeof p.user === 'object') return p.user.name || p.user.email || String(p.user._id || p.user.id || p._id);
    if (p.user && typeof p.user === 'string') return p.user;
    return p.user?.name || p.user?.email || String(p._id || p.user || '-');
  };

  // helper to display ward/room/bed with fallbacks to ids when labels missing
  const displayAdmission = (p, field) => {
    const val = p?.admission?.[field];
    // prefer string label
    if (val) {
      if (typeof val === 'string') return val;
      if (typeof val === 'object') return val.name || val.number || String(val._id || val.id || JSON.stringify(val));
      return String(val);
    }
    const idVal = p?.admission?.[`${field}Id`];
    if (idVal) {
      if (typeof idVal === 'string') return idVal;
      if (typeof idVal === 'object') return idVal.name || idVal.number || String(idVal._id || idVal.id || JSON.stringify(idVal));
      return String(idVal);
    }
    return '';
  };

  // derive filter options from patients
  // only show currently admitted patients on this dashboard
  const admittedPatients = patients.filter(p => p.admission?.isAdmitted);

  const wardOptions = Array.from(new Set(admittedPatients.map(p => displayAdmission(p, 'ward')).filter(Boolean))).map(o => String(o));
  const roomOptions = Array.from(new Set(admittedPatients.map(p => displayAdmission(p, 'room')).filter(Boolean))).map(o => String(o));
  // modal state for Add Medicines
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPatient, setModalPatient] = useState(null);
  const [selectedDrugs, setSelectedDrugs] = useState({});
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [availableDrugs, setAvailableDrugs] = useState([]);
  // service request modal
  const [srModalOpen, setSrModalOpen] = useState(false);
  const [srType, setSrType] = useState('supply');
  const [srDetails, setSrDetails] = useState('');
  const [srSubmitting, setSrSubmitting] = useState(false);
  const [srWard, setSrWard] = useState('');
  const [srRoom, setSrRoom] = useState('');
  

  // filtering and sorting
  const filteredAndSorted = admittedPatients
    .filter(p => {
      if (wardFilter && (displayAdmission(p, 'ward') || '') !== wardFilter) return false;
      if (roomFilter && (displayAdmission(p, 'room') || '') !== roomFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      let va = '';
      let vb = '';
      if (sortField === 'ward') { va = a.admission?.ward || ''; vb = b.admission?.ward || ''; }
      if (sortField === 'room') { va = String(displayAdmission(a, 'room') || ''); vb = String(displayAdmission(b, 'room') || ''); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  // modal JSX (portal-like simple overlay)
  const renderModal = () => {
    if (!modalOpen || !modalPatient) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded p-4 w-11/12 max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">Add Medicines to {formatPatient(modalPatient)}</h4>
            <button className="text-sm text-gray-600" onClick={()=>{ setModalOpen(false); setModalPatient(null); setSelectedDrugs({}); }}>Close</button>
          </div>
          <div>
            {modalLoading ? <div>Loading drugs...</div> : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {availableDrugs.length === 0 && <div className="text-sm text-gray-500">No drugs available</div>}
                {availableDrugs.map(d => (
                  <div key={d._id} className="flex items-center gap-3 p-2 border rounded">
                    <input type="checkbox" checked={!!selectedDrugs[d._id]} onChange={e=>{
                      setSelectedDrugs(prev=>{
                        const copy = { ...prev };
                        if (e.target.checked) copy[d._id] = { quantity: 1, drugId: d._id };
                        else delete copy[d._id];
                        return copy;
                      });
                    }} />
                    <div className="flex-1">
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-gray-500">Stock: {d.stockLevel || 0} — Price: {d.price != null ? d.price : 'N/A'}</div>
                    </div>
                    <div className="w-24">
                      <input type="number" className="input" min="1" value={selectedDrugs[d._id]?.quantity || ''} onChange={e=>{
                        const q = Number(e.target.value || 0);
                        setSelectedDrugs(prev=>{
                          const copy = { ...prev };
                          if (!copy[d._id]) copy[d._id] = { quantity: q || 1, drugId: d._id };
                          else copy[d._id].quantity = q || 1;
                          return copy;
                        });
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-outline" onClick={()=>{ setModalOpen(false); setModalPatient(null); setSelectedDrugs({}); }}>Cancel</button>
              <button className="btn-modern" disabled={modalSubmitting} onClick={async ()=>{
                try{
                  const drugs = Object.values(selectedDrugs).map(s => ({ drugId: s.drugId, quantity: s.quantity }));
                  if (drugs.length === 0) { showToast({ message: 'Select at least one drug', type: 'error' }); return; }

                  // client-side stock validation
                  for (const d of drugs) {
                    const info = availableDrugs.find(x => String(x._id) === String(d.drugId));
                    if (!info) { showToast({ message: `Drug not found: ${d.drugId}`, type: 'error' }); return; }
                    if (typeof info.stockLevel === 'number' && d.quantity > info.stockLevel) { showToast({ message: `Insufficient stock for ${info.name}`, type: 'error' }); return; }
                  }

                  setModalSubmitting(true);
                  await axiosInstance.post(`/billing/patient/${modalPatient._id}/drugs`, { drugs });
                  setModalOpen(false);
                  setModalPatient(null);
                  setSelectedDrugs({});
                  showToast({ message: 'Drugs added to admission invoice', type: 'success' });
                  const res = await axiosInstance.get('/nurses/me/patients');
                  setPatients(res.data.patients || []);
                }catch(e){ console.error(e); showToast({ message: e?.response?.data?.message || 'Failed to add drugs', type: 'error' }); }
                finally { setModalSubmitting(false); }
              }}>{modalSubmitting ? 'Adding...' : 'Add to Invoice'}</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(()=>{
    if (!modalOpen) return;
    let mounted = true;
    (async ()=>{
      try{
        setModalLoading(true);
        const res = await axiosInstance.get('/pharmacy/inventory');
        if (!mounted) return;
        setAvailableDrugs(res.data.drugs || []);
      }catch(e){ console.error('Failed to load drugs for modal', e); setAvailableDrugs([]); }
      finally{ if (mounted) setModalLoading(false); }
    })();
    return ()=>{ mounted = false; };
  }, [modalOpen]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mt-0 mb-0">
        <h1 className="text-2xl font-bold mt-0 mb-0">Nurse Dashboard</h1>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2 bg-white rounded p-4 shadow"> 
          <h3 className="font-semibold mb-2">Assigned Patients</h3>
          {error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : patients.length === 0 ? (
            <div className="text-sm text-gray-600">No assigned patients yet.</div>
          ) : (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div>
                  <label className="text-xs text-gray-500">Ward</label>
                  <select className="input" value={wardFilter} onChange={e=>setWardFilter(e.target.value)}>
                    <option value="">-- all --</option>
                    {wardOptions.map((w, i) => <option key={`${String(w)}-${i}`} value={String(w)}>{String(w)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Room</label>
                  <select className="input" value={roomFilter} onChange={e=>setRoomFilter(e.target.value)}>
                    <option value="">-- all --</option>
                    {roomOptions.map((r, i) => <option key={`${String(r)}-${i}`} value={String(r)}>{String(r)}</option>)}
                  </select>
                </div>
                
                <div className="ml-auto flex items-end gap-2">
                  <button className="btn-outline" onClick={()=>{ setWardFilter(''); setRoomFilter(''); setSortField(''); setSortDir('asc'); }}>Clear</button>
                </div>
              </div>

              <table className="table-auto w-full text-sm">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Admitted</th>
                    <th className="cursor-pointer" onClick={()=>{ if(sortField==='ward') setSortDir(d=> d==='asc' ? 'desc' : 'asc'); else { setSortField('ward'); setSortDir('asc'); } }}>Ward {sortField==='ward' ? (sortDir==='asc' ? '▲' : '▼') : ''}</th>
                    <th className="cursor-pointer" onClick={()=>{ if(sortField==='room') setSortDir(d=> d==='asc' ? 'desc' : 'asc'); else { setSortField('room'); setSortDir('asc'); } }}>Room {sortField==='room' ? (sortDir==='asc' ? '▲' : '▼') : ''}</th>
                    <th>Bed</th>
                  </tr>
                </thead>
                <tbody>
          {filteredAndSorted.map(p=> (
                    <tr key={p._id} className="border-t">
                      <td className="px-2 py-1">{formatPatient(p)}</td>
                      <td className="px-2 py-1">{p.admission?.isAdmitted ? (new Date(p.admission.admittedAt).toLocaleString()) : 'No'}</td>
                      <td className="px-2 py-1">{displayAdmission(p, 'ward') || '-'}</td>
                      <td className="px-2 py-1">{displayAdmission(p, 'room') || '-'}</td>
                      <td className="px-2 py-1">{(() => {
                        const bed = p.admission?.bed;
                        if (bed) {
                          if (typeof bed === 'string') return bed;
                          if (typeof bed === 'object') return bed.number || String(bed._id || bed.id || JSON.stringify(bed));
                        }
                        const bid = p.admission?.bedId;
                        if (bid) {
                          if (typeof bid === 'string') return bid;
                          if (typeof bid === 'object') return bid.number || String(bid._id || bid.id || JSON.stringify(bid));
                          return String(bid);
                        }
                        return '-';
                      })()}</td>
                      <td className="px-2 py-1">
                        {p.admission?.isAdmitted ? (
                          <div className="flex gap-2">
                            <button className="btn-outline" onClick={async ()=>{
                              try{
                                const ok = await confirmAsync('Confirm discharge', `Discharge ${p.user?.name || 'patient'} and free up the bed?`);
                                if (!ok) return;
                                const bedId = p.admission?.bedId || p.admission?.bed?._id;
                                if (bedId) {
                                  await axiosInstance.put(`/wards/beds/${bedId}/release`);
                                } else {
                                  await axiosInstance.put(`/wards/beds/release-by-patient/${p._id}`);
                                }
                                setPatients(prev => prev.map(x => x._id === p._id ? ({ ...x, admission: { ...(x.admission || {}), isAdmitted: false, dischargedAt: new Date(), bed: null, bedId: null } }) : x));
                                showToast({ message: 'Patient discharged and bed freed', type: 'success' });
                              }catch(e){
                                console.error(e);
                                showToast({ message: 'Failed to discharge patient', type: 'error' });
                              }
                            }}>Discharge</button>

                            <button className="btn-modern" onClick={()=>{
                              // open modal for this patient (modal state is in component scope)
                              setModalPatient(p);
                              setModalOpen(true);
                            }}>Add Medicines</button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="bg-white rounded p-4 shadow mt-4">
          <h3 className="font-semibold mb-2">My Requests</h3>
          {myRequests.length === 0 ? (
            <div className="text-sm text-gray-500">No requests</div>
          ) : (
            <div className="space-y-2">
              {myRequests.map(r => (
                <div key={r._id} className="p-2 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.type}</div>
                    <div className="text-xs text-gray-500">{r.details || '-'} — {r.ward ? `Ward: ${r.ward}` : ''} {r.room ? `Room: ${r.room}` : ''}</div>
                    <div className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded ${r.status==='pending'?'bg-yellow-100 text-yellow-800': r.status==='in_progress' ? 'bg-blue-100 text-blue-800' : r.status==='completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{r.status}</div>
                    <div className="text-xs text-gray-600 mt-2">Assigned to: {r.assignedTo ? (r.assignedTo.name || r.assignedTo.email) : 'Not assigned'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded p-4 shadow">
          <h3 className="font-semibold mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <button className="btn-modern w-full">Record Vitals</button>
            <button className="btn-modern w-full" onClick={()=>{ setSrType('supply'); setSrDetails(''); setSrWard(''); setSrRoom(''); setSrModalOpen(true); }}>Request Supplies</button>
          </div>
        </div>
      </div>
      {renderModal()}

      {/* Service Request Modal */}
      {srModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded p-4 w-11/12 max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold">Request Supplies / Cleaning</h4>
              <button className="text-sm text-gray-600" onClick={()=>{ setSrModalOpen(false); }}>Close</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Type</label>
                <select className="input w-full" value={srType} onChange={e=>setSrType(e.target.value)}>
                  <option value="supply">Supplies</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Ward (optional)</label>
                <input className="input w-full" value={srWard} onChange={e=>setSrWard(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Room (optional)</label>
                <input className="input w-full" value={srRoom} onChange={e=>setSrRoom(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Details</label>
                <textarea className="input w-full h-24" value={srDetails} onChange={e=>setSrDetails(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <button className="btn-outline" onClick={()=>setSrModalOpen(false)}>Cancel</button>
                <button className="btn-modern" disabled={srSubmitting} onClick={async ()=>{
                  try{
                    setSrSubmitting(true);
                    await axiosInstance.post('/requests', { type: srType, details: srDetails, ward: srWard, room: srRoom });
                    showToast({ message: 'Request submitted', type: 'success' });
                    setSrModalOpen(false);
                  }catch(e){ console.error(e); showToast({ message: e?.response?.data?.message || 'Failed to submit request', type: 'error' }); }
                  finally{ setSrSubmitting(false); }
                }}>{srSubmitting ? 'Sending...' : 'Send Request'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

