import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import Toast from '../../../components/ui/Toast';

export default function LabRequests() {
  const { id: patientId } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [testName, setTestName] = useState('');
  const [qty, setQty] = useState(1);
  const [urgency, setUrgency] = useState('routine');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const { user } = useContext(AuthContext);
  const [catalog, setCatalog] = useState([]);
  const [searchCatalog, setSearchCatalog] = useState('');
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [patient, setPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    loadLabRequests();
    // load catalog for admins/doctors so they can pick registered tests
    (async () => {
      try {
        if (user && ['admin','doctor','finance'].includes(user.role)) {
          const r = await axiosInstance.get('/labs/catalog');
          // r.data is expected to be { tests: [...] } or { catalog: [...] } or just array
          const data = r.data;
          if (Array.isArray(data)) setCatalog(data);
          else if (Array.isArray(data.catalog)) setCatalog(data.catalog);
          else if (Array.isArray(data.tests)) setCatalog(data.tests);
          else if (Array.isArray(data.catalogs)) setCatalog(data.catalogs);
          else if (Array.isArray(data.data)) setCatalog(data.data);
        }
      } catch (err) {
        // non-fatal
      }
    })();
    // fetch patient details for header
    (async () => {
      try {
        const res = await axiosInstance.get(`/patients/${patientId}`);
        setPatient(res.data.patient || res.data);
      } catch (err) { /* ignore */ }
    })();
    // load doctors list for admin so they can select which doctor the request is for
    (async () => {
      try {
        if (user && user.role === 'admin') {
          const r2 = await axiosInstance.get('/doctors');
          // r2.data may be { doctors: [...] } or array
          const dd = r2.data;
          if (Array.isArray(dd)) setDoctors(dd);
          else if (Array.isArray(dd.doctors)) setDoctors(dd.doctors);
          else if (Array.isArray(dd.data)) setDoctors(dd.data);
        }
      } catch (err) { /* ignore */ }
    })();
    // eslint-disable-next-line
  }, [patientId]);

  const loadLabRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/patients/${patientId}/lab-requests`);
      setRequests(res.data.requests || []);
    } catch (error) {
      setToast({ message: error?.response?.data?.message || 'Failed to load lab requests', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!testName && !selectedCatalog) return setToast({ message: 'Select or enter test name', type: 'error' });
    try {
      setLoading(true);
      const payload = { testName, qty, urgency };
      if (selectedCatalog) payload.catalogId = selectedCatalog._id;
      if (selectedDoctor) payload.doctorId = selectedDoctor._id || selectedDoctor;
      const res = await axiosInstance.post(`/patients/${patientId}/lab-requests`, payload);
      const created = res.data.labTest || res.data.labTest || null;
      if (created) {
        setRequests(prev => [created, ...prev]);
        setTestName(''); setQty(1); setUrgency('routine'); setSelectedCatalog(null); setSearchCatalog('');
        setToast({ message: 'Added lab request', type: 'success' });
      } else {
        setToast({ message: 'Added (no response)', type: 'success' });
        await loadLabRequests();
      }
    } catch (error) {
      setToast({ message: error?.response?.data?.message || 'Failed to add lab request', type: 'error' });
    } finally { setLoading(false); }
  };

  const grandTotal = requests.reduce((s, it) => s + ((it.amount || 0) * (it.qty || 1)), 0);

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-2">Internal Lab Requests</h1>
        <hr className="mb-6" />

        {/* Patient header summary */}
        <div className="text-left bg-gray-50 p-4 rounded mb-6">
          <p><strong>INPATIENT'S FILE NO :</strong> {patient?.mrn || patient?.hospitalId || ''}</p>
          <p><strong>PATIENT'S NAME :</strong> {patient ? `${patient.firstName || ''} ${patient.middleName || ''} ${patient.lastName || ''}`.replace(/\s+/g,' ').trim() : ''}</p>
          <p><strong>PATIENT'S AGE :</strong> {patient ? (patient.age || (patient.dob ? Math.floor((Date.now() - new Date(patient.dob).getTime())/ (365.25*24*3600*1000)) : '')) : ''}</p>
          <p><strong>PATIENT'S PAYMENT DETAILS :</strong> {patient?.paymentMode || ''}</p>
          <p><strong>SCHEME :</strong> {patient?.insuranceProvider || ''}</p>
        </div>

        <div className="mb-4">
          <h2 className="font-semibold">INVESTIGATION</h2>
          <div className="flex items-center gap-2 mt-2">
            {/* if catalog loaded, show searchable catalog picker for privileged users */}
            {catalog && catalog.length > 0 ? (
              <div className="flex-1 relative">
                <input value={searchCatalog} onChange={e => { setSearchCatalog(e.target.value); setSelectedCatalog(null); setTestName(e.target.value); }} placeholder="Search registered tests or type new" className="input w-full" />
                {searchCatalog && (
                  <div className="absolute z-20 bg-white shadow rounded mt-1 max-h-48 overflow-auto w-full">
                    {catalog.filter(c => (c.name || '').toLowerCase().includes(searchCatalog.toLowerCase()) || (c.code || '').toLowerCase().includes(searchCatalog.toLowerCase())).slice(0,50).map(c => (
                      <div key={c._id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setSelectedCatalog(c); setSearchCatalog(c.name); setTestName(c.name); }}>
                        <div className="text-sm font-medium">{c.name} {c.code ? `(${c.code})` : ''}</div>
                        <div className="text-xs text-gray-500">Price: {Number(c.price || 0).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <input type="text" value={testName} onChange={e => setTestName(e.target.value)} placeholder="Search By Name" className="input flex-1" />
            )}
            <input type="number" value={qty} min={1} onChange={e => setQty(Number(e.target.value))} placeholder="Quantity" className="input w-28" />
            <select value={urgency} onChange={e => setUrgency(e.target.value)} className="input w-40">
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT</option>
            </select>
            {/* doctor selector for admins */}
            {user && user.role === 'admin' && (
              <select value={selectedDoctor?._id || selectedDoctor || ''} onChange={e => {
                const v = e.target.value;
                // find object in doctors list
                const sel = doctors.find(d => String(d._id) === String(v)) || doctors.find(d => String(d.user?._id) === String(v));
                setSelectedDoctor(sel || v);
              }} className="input w-48">
                <option value="">Select Doctor (optional)</option>
                {doctors.map(d => (
                  <option key={d._id || d.user?._id} value={d._id || d.user?._id}>{(d.user && (d.user.name || `${d.user.firstName || ''} ${d.user.lastName || ''}`)) || d.name || d.fullName || d.displayName || `Dr. ${d._id}`}</option>
                ))}
              </select>
            )}
            <button onClick={handleAdd} className="btn-brand">Add</button>
          </div>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h3 className="font-medium mb-2">Added Lab Requests</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left">DATE</th>
                  <th className="border px-3 py-2 text-left">DESCRIPTION</th>
                  <th className="border px-3 py-2 text-right">COST</th>
                  <th className="border px-3 py-2 text-center">QUANTITY</th>
                  <th className="border px-3 py-2 text-right">LINE TOTAL</th>
                  <th className="border px-3 py-2 text-center"> </th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r._id}>
                    <td className="border px-3 py-2 text-sm">{new Date(r.createdAt || r.requestedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    <td className="border px-3 py-2 text-sm">{r.testType || r.testName || 'Lab Test'}</td>
                    <td className="border px-3 py-2 text-sm text-right">{(Number(r.amount || 0)).toFixed(2)}</td>
                    <td className="border px-3 py-2 text-center">{r.qty || 1}</td>
                    <td className="border px-3 py-2 text-right">{((Number(r.amount || 0) * (r.qty || 1)) || 0).toFixed(2)}</td>
                    <td className="border px-3 py-2 text-center"><button className="btn-secondary">View Results</button></td>
                  </tr>
                ))}
                <tr>
                  <td className="border px-3 py-2" colSpan={4}><strong>GRAND TOTAL</strong></td>
                  <td className="border px-3 py-2 text-right"><strong>{grandTotal.toFixed(2)}</strong></td>
                  <td className="border px-3 py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-center">
            <button className="btn-secondary" onClick={() => window.history.back()}>Save & Close</button>
          </div>
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
