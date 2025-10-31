import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Toast from '../components/ui/Toast';

export default function PatientDetail(){
  const { id } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState({ visits: [], prescriptions: [], labs: [] });
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', method: 'cash', reference: '' });
  const [payLoading, setPayLoading] = useState(false);

  useEffect(()=>{ load(); }, [id]);

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
          axiosInstance.get('/labtests', { params: { patientId: id } }).catch(()=>({ data: { labtests: [] } })),
        ]);
        const safeArray = (val) => Array.isArray(val) ? val : (val && typeof val === 'object' && Array.isArray(val.items) ? val.items : []);
        const visitsArr = Array.isArray(vRes.data.visits) ? vRes.data.visits : (Array.isArray(vRes.data) ? vRes.data : []);
        const presArr = Array.isArray(prRes.data.prescriptions) ? prRes.data.prescriptions : (Array.isArray(prRes.data) ? prRes.data : []);
        const labsArr = Array.isArray(lRes.data.labtests) ? lRes.data.labtests : (Array.isArray(lRes.data) ? lRes.data : []);
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

  if(loading) return <div className="p-6">Loading patient...</div>;
  if(error) return <div className="p-6 text-red-600">{error}</div>;
  if(!patient) return <div className="p-6">Patient not found</div>;

  const { user = {} } = patient;

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-semibold">{user.name || 'Patient Details'}</h2>
          <div className="text-sm text-gray-500">Hospital ID: {patient.hospitalId} • MRN: {patient.mrn}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/patients/${id}/payments`)} className="btn-outline">View Payments</button>
          <button onClick={() => navigate(`/patients/visits/new?patientId=${id}`)} className="btn-brand">New Visit</button>
          <Link to="/patients" className="btn-muted">Back to list</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <div className="text-sm font-medium">{v.diagnosis || 'No diagnosis'}</div>
                      <div className="text-xs text-gray-500">{v.doctor?.user?.name || v.doctorName || 'Unknown'} • {new Date(v.createdAt || v.date).toLocaleString()}</div>
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
                      <div className="text-sm font-medium">{l.testName || l.name}</div>
                      <div className="text-xs text-gray-500">Result: {l.result || 'Pending'} • {new Date(l.createdAt || l.date).toLocaleString()}</div>
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
                      </tr>
                    </thead>
                    <tbody>
                      {payments.slice(0,10).map(p => (
                        <tr key={p._id || p.id} className="border-t">
                          <td className="px-2 py-2">{new Date(p.createdAt || p.date).toLocaleString()}</td>
                          <td className="px-2 py-2">{p.amount || p.total || 0}</td>
                          <td className="px-2 py-2">{p.method || p.source || 'N/A'}</td>
                          <td className="px-2 py-2">{p.reference || p.transactionId || p._id}</td>
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
