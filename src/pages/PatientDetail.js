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
      <div className="flex justify-between items-start mb-6">
        <div>
            <h2 className="text-2xl font-semibold">{patient.firstName} {patient.middleName} {patient.lastName}</h2>
          <div className="text-sm text-gray-500">Hospital ID: {patient.hospitalId} • MRN: {patient.mrn}</div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => navigate(`/patients/${id}/payments`)} className="btn-outline">View Payments</button>
            {(user && (user.role === 'doctor' || user.role === 'admin')) && (
              <button onClick={() => navigate(`/patients/${id}/lab-requests`)} className="btn-brand">Add Lab Request</button>
            )}
            <button onClick={() => navigate(`/patients/visits/new?patientId=${id}`)} className="btn-brand">New Visit</button>
            {user && user.role === 'admin' && (
              <>
                <button onClick={() => setIsEditing(e => !e)} className="btn-outline">{isEditing ? 'Cancel Edit' : 'Edit'}</button>
                <button onClick={async ()=>{
                  if(!user || user.role !== 'admin') { setToast({ type: 'error', message: 'Only admins can delete patients' }); return; }
                  if(!window.confirm('Permanently delete this patient? This cannot be undone.')) return;
                  try{
                    await axiosInstance.delete(`/patients/${id}`);
                    setToast({ type: 'success', message: 'Patient deleted' });
                    setTimeout(()=>navigate('/patients'),1000);
                  }catch(e){ setToast({ type: 'error', message: e?.response?.data?.message || 'Delete failed' }); }
                }} className="btn-danger">Delete</button>
              </>
            )}
            <Link to="/patients" className="btn-muted">Back to list</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <h3 className="font-medium mb-2">Personal Info</h3>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="text-gray-500">Hospital ID:</span> {patient.hospitalId}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">MRN:</span> {patient.mrn}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Name:</span> {patient.firstName} {patient.middleName} {patient.lastName}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">National ID:</span> {patient.nationalId || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Gender:</span> {patient.gender || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Date of Birth:</span> {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Age:</span> {patient.age || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Marital Status:</span> {patient.maritalStatus || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Nationality:</span> {patient.nationality || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Ethnicity:</span> {patient.ethnicity || 'N/A'}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow mb-4">
            <h3 className="font-medium mb-2">Contact Information</h3>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="text-gray-500">Phone (Primary):</span> {patient.phonePrimary || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Phone (Secondary):</span> {patient.phoneSecondary || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Email:</span> {patient.email || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Address:</span> {patient.address || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">County:</span> {patient.county || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Sub-County:</span> {patient.subCounty || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Ward:</span> {patient.ward || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Postal Address:</span> {patient.postalAddress || 'N/A'}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow mb-4">
            <h3 className="font-medium mb-2">Next of Kin</h3>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="text-gray-500">Name:</span> {patient.nextOfKin?.name || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Relationship:</span> {patient.nextOfKin?.relationship || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Phone:</span> {patient.nextOfKin?.phone || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Alt Phone:</span> {patient.nextOfKin?.altPhone || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Address:</span> {patient.nextOfKin?.address || 'N/A'}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-medium mb-2">Demographics</h3>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="text-gray-500">Occupation:</span> {patient.occupation || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Religion:</span> {patient.religion || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Education Level:</span> {patient.educationLevel || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Disability Status:</span> {patient.disabilityStatus || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Guardian Info:</span> {patient.guardianInfo || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <div className="bg-white p-4 rounded shadow mb-4">
            <h3 className="font-medium mb-2">Clinical Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm mb-2">
                  <span className="text-gray-500">Blood Group:</span> {patient.bloodGroup || 'N/A'}
                </div>
                <div className="text-sm mb-2">
                  <span className="text-gray-500">Allergies:</span>
                  {patient.allergies && patient.allergies.length > 0 ? (
                    <ul className="ml-4 list-disc">
                      {Array.isArray(patient.allergies) 
                        ? patient.allergies.map((allergy, idx) => (
                            <li key={idx}>{allergy}</li>
                          ))
                        : <li>{patient.allergies}</li>
                      }
                    </ul>
                  ) : ' None'}
                </div>
                <div className="text-sm mb-2">
                  <span className="text-gray-500">Chronic Conditions:</span>
                  <div className="ml-4">{patient.chronicConditions || 'None recorded'}</div>
                </div>
              </div>
              <div>
                <div className="text-sm mb-2">
                  <span className="text-gray-500">Current Medications:</span>
                  <div className="ml-4">{patient.currentMedications || 'None recorded'}</div>
                </div>
                <div className="text-sm mb-2">
                  <span className="text-gray-500">Past Medical History:</span>
                  <div className="ml-4">{patient.pastMedicalHistory || 'None recorded'}</div>
                </div>
                <div className="text-sm mb-2">
                  <span className="text-gray-500">Surgical History:</span>
                  <div className="ml-4">{patient.surgicalHistory || 'None recorded'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow mb-4">
            <h3 className="font-medium mb-2">Billing Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm mb-2">
                  <span className="text-gray-500">Payment Mode:</span> {patient.paymentMode || 'N/A'}
                </div>
                <div className="text-sm mb-2">
                  <span className="text-gray-500">Insurance Provider:</span> {patient.insuranceProvider || 'N/A'}
                </div>
                <div className="text-sm mb-2">
                  <span className="text-gray-500">Insurance Card Number:</span> {patient.insuranceCardNumber || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm mb-2">
                  <span className="text-gray-500">NHIF Number:</span> {patient.nhifNumber || 'N/A'}
                </div>
                <div className="text-sm mb-2">
                  <span className="text-gray-500">Employer:</span> {patient.employer || 'N/A'}
                </div>
                <div className="text-sm mb-2">
                  <span className="text-gray-500">Corporate Number:</span> {patient.corporateNumber || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-medium mb-2">Health Record</h3>

            <div className="mb-4">
              <h4 className="font-medium">Recent Visits</h4>
              {records.visits.length === 0 ? (
                <div className="text-sm text-gray-500">No visits recorded</div>
              ) : (
                <ul className="divide-y">
                  {records.visits.slice(0,10).map(v => (
                    <li key={v._id || v.id} className="py-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-medium">{v.diagnosis || 'No diagnosis'}</div>
                          <div className="text-xs text-gray-500">{v.doctor?.user?.name || v.doctorName || 'Unknown'} • {new Date(v.createdAt || v.date).toLocaleString()}</div>
                        </div>
                        <div className="flex gap-2">
                          <button className="btn-outline text-xs" onClick={()=>printVisit(v)}>Print</button>
                          <button className="btn-muted text-xs" onClick={()=>navigate(`/visits/${v._id || v.id}`)}>View</button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mb-4">
              <h4 className="font-medium">Recent Prescriptions</h4>
              {records.prescriptions.length === 0 ? (
                <div className="text-sm text-gray-500">No prescriptions</div>
              ) : (
                <ul className="divide-y">
                  {records.prescriptions.slice(0,10).map(pr => (
                    <li key={pr._id || pr.id} className="py-2">
                      <div className="text-sm font-medium">{pr.drugs?.map(d=>d.name).join(', ') || pr.notes || 'Prescription'}</div>
                      <div className="text-xs text-gray-500">{pr.doctor?.user?.name || pr.doctorName} • {new Date(pr.createdAt || pr.date).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="font-medium">Labs</h4>
              {records.labs.length === 0 ? (
                <div className="text-sm text-gray-500">No lab tests</div>
              ) : (
                <ul className="divide-y">
                  {records.labs.slice(0,10).map(l => (
                    <li key={l._id || l.id} className="py-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{l.testType}</div>
                          <div className="text-xs text-gray-500">
                            Priority: <span className={`font-medium ${l.priority === 'stat' ? 'text-red-600' : l.priority === 'urgent' ? 'text-orange-500' : 'text-green-600'}`}>{l.priority}</span> • Status: {l.status}
                          </div>
                          {l.resultsText && <div className="text-xs text-gray-500">Result: {l.resultsText.substring(0, 50)}{l.resultsText.length > 50 ? '...' : ''}</div>}
                          <div className="text-xs text-gray-500">Requested: {new Date(l.createdAt).toLocaleString()}</div>
                        </div>
                        <button className="btn-muted text-xs" onClick={() => navigate(`/labtests/${l._id}`)}>View Details</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4">
              <h4 className="font-medium">Recent Payments</h4>
              {payments.length === 0 ? (
                <div className="text-sm text-gray-500">No payments found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-xs text-gray-600">
                      <tr>
                        <th className="px-2 py-1">Date</th>
                        <th className="px-2 py-1">Amount</th>
                        <th className="px-2 py-1">Method</th>
                        <th className="px-2 py-1">Reference</th>
                        <th className="px-2 py-1">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.slice(0,10).map(p => (
                        <tr key={p._id || p.id} className="border-t">
                          <td className="px-2 py-2">{new Date(p.createdAt || p.date).toLocaleString()}</td>
                          <td className="px-2 py-2">{p.amount || p.total || 0}</td>
                          <td className="px-2 py-2">{p.method || p.source || 'N/A'}</td>
                          <td className="px-2 py-2">{p.reference || p.transactionId || p._id}</td>
                          <td className="px-2 py-2">
                            {user && user.role === 'admin' && (
                              <button className="btn-danger text-sm" onClick={()=>handleDeletePayment(p._id || p.id)}>Delete</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-4 border-t pt-4">
              <h4 className="font-medium mb-2">Record Payment</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                <div className="col-span-1">
                  <label className="text-xs text-gray-600">Amount</label>
                  <input name="amount" value={payForm.amount} onChange={e=>setPayForm(f=>({ ...f, amount: e.target.value }))} className="input" placeholder="Amount" type="number" min="0" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Method</label>
                  <select name="method" value={payForm.method} onChange={e=>setPayForm(f=>({ ...f, method: e.target.value }))} className="input">
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="card">Card</option>
                    <option value="insurance">Insurance</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Reference</label>
                  <input name="reference" value={payForm.reference} onChange={e=>setPayForm(f=>({ ...f, reference: e.target.value }))} className="input" placeholder="Reference / Transaction ID" />
                </div>
                <div className="col-span-3 mt-2 flex gap-2">
                  <button className="btn-brand" onClick={async ()=>{
                    // simple validation
                    if(!payForm.amount || Number(payForm.amount) <= 0){ setToast({ type: 'error', message: 'Enter a valid amount' }); return; }
                    setPayLoading(true); setToast(null);
                    try{
                      const payload = { patientId: id, amount: Number(payForm.amount), method: payForm.method, reference: payForm.reference };
                      // try POST /payments then fallback
                      let res;
                      try{ res = await axiosInstance.post('/payments', payload); }
                      catch(err){ res = await axiosInstance.post(`/patients/${id}/payments`, payload).catch(e=>{ throw e; }); }
                      const saved = res.data.payment || res.data || null;
                      if(saved) setPayments(p=>[saved, ...(p||[])]);
                      setPayForm({ amount: '', method: 'cash', reference: '' });
                      setToast({ type: 'success', message: 'Payment recorded' });
                      // optionally refresh patient summary
                      try{ const r = await axiosInstance.get(`/patients/${id}`); setPatient(r.data.patient || r.data || patient); }catch(e){}
                    }catch(e){ console.error(e); setToast({ type: 'error', message: e?.response?.data?.message || 'Failed to record payment' }); }
                    finally{ setPayLoading(false); }
                  }} disabled={payLoading}>
                    {payLoading ? 'Saving...' : 'Record Payment'}
                  </button>
                  <button type="button" className="btn-muted" onClick={()=>setPayForm({ amount: '', method: 'cash', reference: '' })}>Reset</button>
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
