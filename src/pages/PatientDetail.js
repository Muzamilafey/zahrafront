import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Toast from '../components/ui/Toast';

export default function PatientDetail(){
  const { id } = useParams();
  const navigate = useNavigate();
  const { axiosInstance, user } = useContext(AuthContext);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState({ visits: [], prescriptions: [], labs: [] });
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [payForm, setPayForm] = useState({ amount: '', method: 'cash', reference: '' });
  const [payLoading, setPayLoading] = useState(false);

  useEffect(()=>{ load(); }, [id]);

  // ensure non-admins cannot stay in edit mode if role changes
  useEffect(()=>{
    if(!user || user.role !== 'admin') setIsEditing(false);
  }, [user]);

  useEffect(()=>{
    if(patient) {
      // initialize edit form
      setEditData({
        user: { name: patient.user?.name || '', email: patient.user?.email || '', phone: patient.user?.phone || '' },
        firstName: patient.firstName || '',
        middleName: patient.middleName || '',
        lastName: patient.lastName || '',
        nationalId: patient.nationalId || '',
        dob: patient.dob ? new Date(patient.dob).toISOString().slice(0,10) : '',
        gender: patient.gender || '',
        age: patient.age || '',
        phonePrimary: patient.phonePrimary || '',
        phoneSecondary: patient.phoneSecondary || '',
        email: patient.email || '',
        address: patient.address || '',
        county: patient.county || '',
        subCounty: patient.subCounty || '',
        ward: patient.ward || '',
        postalAddress: patient.postalAddress || '',
        nextOfKin: patient.nextOfKin || {},
        occupation: patient.occupation || '',
        religion: patient.religion || '',
        educationLevel: patient.educationLevel || '',
        disabilityStatus: patient.disabilityStatus || '',
        guardianInfo: patient.guardianInfo || '',
        bloodGroup: patient.bloodGroup || '',
        allergies: Array.isArray(patient.allergies) ? patient.allergies.join(', ') : (patient.allergies || ''),
        chronicConditions: patient.chronicConditions || '',
        currentMedications: patient.currentMedications || '',
        pastMedicalHistory: patient.pastMedicalHistory || '',
        surgicalHistory: patient.surgicalHistory || '',
        paymentMode: patient.paymentMode || '',
        insuranceProvider: patient.insuranceProvider || '',
        insuranceCardNumber: patient.insuranceCardNumber || '',
        nhifNumber: patient.nhifNumber || '',
        employer: patient.employer || '',
        corporateNumber: patient.corporateNumber || ''
      });
    }
  }, [patient]);

  const load = async () => {
    try{
      setLoading(true);
      const [pRes] = await Promise.all([
        axiosInstance.get(`/patients/${id}`),
      ]);
      setPatient(pRes.data.patient || pRes.data || null);

      // Try to load related records; failures are non-fatal
      try{
        const [vRes, prRes, lRes] = await Promise.all([
          axiosInstance.get('/visits', { params: { patientId: id } }).catch(()=>({ data: { visits: [] } })),
          axiosInstance.get('/prescriptions', { params: { patientId: id } }).catch(()=>({ data: { prescriptions: [] } })),
          axiosInstance.get('/lab/orders', { params: { patient: id } }).catch(()=>({ data: { orders: [] } })),
        ]);
        const safeArray = (val) => Array.isArray(val) ? val : (val && typeof val === 'object' && Array.isArray(val.items) ? val.items : []);
        const visitsArr = Array.isArray(vRes.data.visits) ? vRes.data.visits : (Array.isArray(vRes.data) ? vRes.data : []);
        const presArr = Array.isArray(prRes.data.prescriptions) ? prRes.data.prescriptions : (Array.isArray(prRes.data) ? prRes.data : []);
        const labsArr = Array.isArray(lRes.data.orders) ? lRes.data.orders : (Array.isArray(lRes.data) ? lRes.data : []);
        setRecords({ visits: visitsArr, prescriptions: presArr, labs: labsArr });
        // payments - try /payments?patientId= or /patients/:id/payments
        try{
          const pRes = await axiosInstance.get('/payments', { params: { patientId: id } }).catch(()=>null);
          const normalizePayments = (data) => {
            if (!data) return [];
            if (Array.isArray(data)) return data;
            if (Array.isArray(data.payments)) return data.payments;
            if (Array.isArray(data.items)) return data.items;
            if (data.payment) return Array.isArray(data.payment) ? data.payment : [data.payment];
            return [];
          };
          if(pRes && pRes.data){
            setPayments(normalizePayments(pRes.data));
          } else {
            const pRes2 = await axiosInstance.get(`/patients/${id}/payments`).catch(()=>({ data: { payments: [] } }));
            setPayments(normalizePayments(pRes2.data));
          }
        }catch(e){ setPayments([]); }
      }catch(e){
        // ignore
      }

    }catch(e){
      console.error(e);
      setError(e?.response?.data?.message || 'Failed to load patient');
    }finally{ setLoading(false); }
  };

  const printVisit = (v) => {
    const w = window.open('', '_blank'); if(!w) return;
    const patientName = `${patient.firstName || ''} ${patient.middleName || ''} ${patient.lastName || ''}`.trim() || patient.user?.name || '-';
    const doctorName = v.doctor?.user?.name || v.doctorName || '-';
    const html = `
      <html><head><title>Visit Report</title>
      <style>body{font-family:Arial;padding:20px;color:#111}\n.table{width:100%;border-collapse:collapse} .table td{padding:8px;border-bottom:1px solid #eee}</style>
      </head><body>
      <h2>Visit Report</h2>
      <div><strong>Patient:</strong> ${patientName}</div>
      <div><strong>Doctor:</strong> ${doctorName}</div>
      <div><strong>Date:</strong> ${new Date(v.createdAt || v.date).toLocaleString()}</div>
      <hr/>
      <h3>Diagnosis</h3>
      <div>${v.diagnosis || '-'}</div>
      <h3>Notes</h3>
      <div>${v.notes || v.clinicalNotes || '-'}</div>
      <h3>Prescription</h3>
      <div>${(v.prescription && (typeof v.prescription === 'string' ? v.prescription : JSON.stringify(v.prescription))) || '-'}</div>
      </body></html>`;
    w.document.write(html); w.document.close(); w.focus(); setTimeout(()=>{ w.print(); w.close(); },300);
  };

  const handleDeletePayment = async (paymentId) => {
    if(!window.confirm('Permanently delete this payment?')) return;
    try{
      await axiosInstance.delete(`/payments/${paymentId}`);
      setPayments(p => (p || []).filter(x => (x._id || x.id) !== paymentId));
      setToast({ type: 'success', message: 'Payment deleted' });
    }catch(e){
      console.error('Failed to delete payment', e);
      setToast({ type: 'error', message: e?.response?.data?.message || 'Failed to delete payment' });
    }
  };

  if(loading) return <div className="p-6">Loading patient...</div>;
  if(error) return <div className="p-6 text-red-600">{error}</div>;
  if(!patient) return <div className="p-6">Patient not found</div>;

  

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-28 h-28 bg-gray-100 rounded-full flex items-center justify-center text-2xl font-bold text-gray-700">
                  {patient.user?.name ? patient.user.name.split(' ').map(n=>n[0]).slice(0,2).join('') : (patient.firstName||'')[0] || 'P'}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">{patient.firstName} {patient.middleName} {patient.lastName}</h2>
                  <div className="text-sm text-gray-500">Hospital ID: {patient.hospitalId} • MRN: {patient.mrn}</div>
                  <div className="mt-1 text-sm text-gray-600">{patient.phonePrimary || 'No phone'} • {patient.email || ''}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => navigate(`/patients/${id}/payments`)} className="px-3 py-1 border rounded text-sm">View Payments</button>
                {(user && (user.role === 'doctor' || user.role === 'admin')) && (
                  <button onClick={() => navigate(`/patients/${id}/lab-requests`)} className="px-3 py-1 bg-brand-600 text-white rounded text-sm">Add Lab Request</button>
                )}
                <button onClick={() => navigate(`/patients/visits/new?patientId=${id}`)} className="px-3 py-1 bg-brand-600 text-white rounded text-sm">New Visit</button>
                {user && user.role === 'admin' && (
                  <>
                    <button onClick={() => setIsEditing(e => !e)} className="px-3 py-1 border rounded text-sm">{isEditing ? 'Cancel' : 'Edit'}</button>
                    <button onClick={async ()=>{
                      if(!user || user.role !== 'admin') { setToast({ type: 'error', message: 'Only admins can delete patients' }); return; }
                      if(!window.confirm('Permanently delete this patient? This cannot be undone.')) return;
                      try{
                        await axiosInstance.delete(`/patients/${id}`);
                        setToast({ type: 'success', message: 'Patient deleted' });
                        setTimeout(()=>navigate('/patients'),1000);
                      }catch(e){ setToast({ type: 'error', message: e?.response?.data?.message || 'Delete failed' }); }
                    }} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 pb-6">
        {isEditing && (
          <div className="col-span-1 md:col-span-3 bg-white p-4 rounded shadow mb-4">
            <h3 className="font-medium mb-2">Edit Patient (admin)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-600">Registered name</label>
                <div className="input bg-gray-100 text-gray-800">{patient.user?.name || `${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`}</div>
                <label className="text-xs text-gray-600 mt-2">Email</label>
                <input className="input" value={editData.user?.email || ''} onChange={e=>setEditData(d=>({ ...d, user: { ...(d.user||{}), email: e.target.value } }))} />
                <label className="text-xs text-gray-600 mt-2">Phone</label>
                <input className="input" value={editData.user?.phone || editData.phonePrimary || ''} onChange={e=>setEditData(d=>({ ...d, user: { ...(d.user||{}), phone: e.target.value }, phonePrimary: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-600">First Name</label>
                <input className="input" value={editData.firstName || ''} onChange={e=>setEditData(d=>({ ...d, firstName: e.target.value }))} />
                <label className="text-xs text-gray-600 mt-2">Middle Name</label>
                <input className="input" value={editData.middleName || ''} onChange={e=>setEditData(d=>({ ...d, middleName: e.target.value }))} />
                <label className="text-xs text-gray-600 mt-2">Last Name</label>
                <input className="input" value={editData.lastName || ''} onChange={e=>setEditData(d=>({ ...d, lastName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-600">National ID</label>
                <input className="input" value={editData.nationalId || ''} onChange={e=>setEditData(d=>({ ...d, nationalId: e.target.value }))} />
                <label className="text-xs text-gray-600 mt-2">DOB</label>
                <input type="date" className="input" value={editData.dob || ''} onChange={e=>setEditData(d=>({ ...d, dob: e.target.value }))} />
                <label className="text-xs text-gray-600 mt-2">Gender</label>
                <select className="input" value={editData.gender || ''} onChange={e=>setEditData(d=>({ ...d, gender: e.target.value }))}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-600">Phone Primary</label>
                <input className="input" value={editData.phonePrimary || ''} onChange={e=>setEditData(d=>({ ...d, phonePrimary: e.target.value }))} />
                <label className="text-xs text-gray-600 mt-2">Phone Secondary</label>
                <input className="input" value={editData.phoneSecondary || ''} onChange={e=>setEditData(d=>({ ...d, phoneSecondary: e.target.value }))} />
                <label className="text-xs text-gray-600 mt-2">Address</label>
                <input className="input" value={editData.address || ''} onChange={e=>setEditData(d=>({ ...d, address: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-600">County</label>
                <input className="input" value={editData.county || ''} onChange={e=>setEditData(d=>({ ...d, county: e.target.value }))} />
                <label className="text-xs text-gray-600 mt-2">Sub-County</label>
                <input className="input" value={editData.subCounty || ''} onChange={e=>setEditData(d=>({ ...d, subCounty: e.target.value }))} />
                <label className="text-xs text-gray-600 mt-2">Ward</label>
                <input className="input" value={editData.ward || ''} onChange={e=>setEditData(d=>({ ...d, ward: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Next of Kin Name</label>
                <input className="input" value={editData.nextOfKin?.name || ''} onChange={e=>setEditData(d=>({ ...d, nextOfKin: { ...(d.nextOfKin||{}), name: e.target.value } }))} />
                <label className="text-xs text-gray-600 mt-2">Next of Kin Phone</label>
                <input className="input" value={editData.nextOfKin?.phone || ''} onChange={e=>setEditData(d=>({ ...d, nextOfKin: { ...(d.nextOfKin||{}), phone: e.target.value } }))} />
                <label className="text-xs text-gray-600 mt-2">Next of Kin Relationship</label>
                <input className="input" value={editData.nextOfKin?.relationship || ''} onChange={e=>setEditData(d=>({ ...d, nextOfKin: { ...(d.nextOfKin||{}), relationship: e.target.value } }))} />
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button className="btn-brand" onClick={async ()=>{
                if(!user || user.role !== 'admin') { setToast({ type: 'error', message: 'Only admins can edit patient records' }); return; }
                // prepare payload - do not overwrite registered user.name
                const payload = { ...editData };
                // if user field exists, remove name to avoid changing registered username
                if (payload.user) {
                  const { name, ...userWithoutName } = payload.user;
                  payload.user = userWithoutName;
                }
                // convert allergies to array
                if(typeof payload.allergies === 'string') payload.allergies = payload.allergies.split(',').map(s=>s.trim()).filter(Boolean);
                try{
                  const res = await axiosInstance.put(`/patients/${id}`, payload);
                  setToast({ type: 'success', message: 'Patient updated' });
                  setIsEditing(false);
                  // refresh data
                  await load();
                }catch(e){ setToast({ type: 'error', message: e?.response?.data?.message || 'Update failed' }); }
              }}>Save Changes</button>
              <button className="btn-muted" onClick={()=>{ setIsEditing(false); setEditData({}); }}>Cancel</button>
            </div>
          </div>
        )}
        <div className="col-span-1">
          <div className="bg-white p-4 rounded shadow mb-4">
            <h3 className="font-medium mb-2">Summary</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div><span className="text-gray-500">Age:</span> {patient.age || 'N/A'}</div>
              <div><span className="text-gray-500">Gender:</span> {patient.gender || 'N/A'}</div>
              <div><span className="text-gray-500">DOB:</span> {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}</div>
              <div><span className="text-gray-500">Phone:</span> {patient.phonePrimary || 'N/A'}</div>
              <div><span className="text-gray-500">Address:</span> {patient.address || 'N/A'}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow mb-4">
            <h3 className="font-medium mb-2">Contact</h3>
            <div className="text-sm text-gray-700">
              <div><strong>{patient.nextOfKin?.name || 'Next of kin'}</strong></div>
              <div className="text-xs text-gray-500">{patient.nextOfKin?.relationship || ''} • {patient.nextOfKin?.phone || ''}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-medium mb-2">Administrative</h3>
            <div className="space-y-1 text-sm text-gray-700">
              <div><span className="text-gray-500">Payment Mode:</span> {patient.paymentMode || 'N/A'}</div>
              <div><span className="text-gray-500">Insurance:</span> {patient.insuranceProvider || 'N/A'}</div>
              <div><span className="text-gray-500">NHIF:</span> {patient.nhifNumber || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <div className="bg-white p-4 rounded shadow mb-4">
            <h3 className="font-medium mb-2">Clinical Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm mb-2"><span className="text-gray-500">Allergies:</span></div>
                <div className="ml-4 text-sm text-gray-700">{patient.allergies && patient.allergies.length ? (Array.isArray(patient.allergies) ? patient.allergies.join(', ') : patient.allergies) : 'None'}</div>
              </div>
              <div>
                <div className="text-sm mb-2"><span className="text-gray-500">Current Medications:</span></div>
                <div className="ml-4 text-sm text-gray-700">{patient.currentMedications || 'None recorded'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow mb-4">
            <h3 className="font-medium mb-2">Recent Activities</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">Recent Visits</h4>
                {records.visits.length === 0 ? <div className="text-sm text-gray-500">No visits recorded</div> : (
                  <ul className="divide-y">
                    {records.visits.slice(0,5).map(v => (
                      <li key={v._id || v.id} className="py-2 flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium">{v.diagnosis || 'No diagnosis'}</div>
                          <div className="text-xs text-gray-500">{v.doctor?.user?.name || v.doctorName || 'Unknown'} • {new Date(v.createdAt || v.date).toLocaleString()}</div>
                        </div>
                        <div className="flex gap-2">
                          <button className="btn-outline text-xs" onClick={()=>printVisit(v)}>Print</button>
                          <button className="btn-muted text-xs" onClick={()=>navigate(`/visits/${v._id || v.id}`)}>View</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="font-medium">Recent Prescriptions</h4>
                {records.prescriptions.length === 0 ? <div className="text-sm text-gray-500">No prescriptions</div> : (
                  <ul className="divide-y">
                    {records.prescriptions.slice(0,5).map(pr => (
                      <li key={pr._id || pr.id} className="py-2">
                        <div className="text-sm font-medium">{pr.drugs?.map(d=>d.name).join(', ') || pr.notes || 'Prescription'}</div>
                        <div className="text-xs text-gray-500">{pr.doctor?.user?.name || pr.doctorName} • {new Date(pr.createdAt || pr.date).toLocaleString()}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
