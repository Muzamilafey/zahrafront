import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function PatientDetail(){
  const { id } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState({ visits: [], prescriptions: [], labs: [] });
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);

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
        setRecords({
          visits: vRes.data.visits || vRes.data || [],
          prescriptions: prRes.data.prescriptions || prRes.data || [],
          labs: lRes.data.labtests || lRes.data || [],
        });
        // payments - try /payments?patientId= or /patients/:id/payments
        try{
          const pRes = await axiosInstance.get('/payments', { params: { patientId: id } }).catch(()=>null);
          if(pRes && pRes.data){
            setPayments(pRes.data.payments || pRes.data || []);
          } else {
            const pRes2 = await axiosInstance.get(`/patients/${id}/payments`).catch(()=>({ data: { payments: [] } }));
            setPayments(pRes2.data.payments || pRes2.data || []);
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
        <div className="col-span-1 bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Personal Info</h3>
          <div className="text-sm text-gray-700">Name: {user.name}</div>
          <div className="text-sm text-gray-700">Email: {user.email || 'N/A'}</div>
          <div className="text-sm text-gray-700">Phone: {user.phone || patient.phone || 'N/A'}</div>
          <div className="text-sm text-gray-700">Gender: {patient.gender || user.gender || 'N/A'}</div>
          <div className="text-sm text-gray-700">DOB: {patient.dob || user.dob || 'N/A'}</div>
          <div className="text-sm text-gray-700">Address: {patient.address || user.address || 'N/A'}</div>
        </div>

        <div className="col-span-2 bg-white p-4 rounded shadow">
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

        </div>
      </div>
    </div>
  );
}
