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

  useEffect(() => {
    loadLabRequests();
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
    if (!testName) return setToast({ message: 'Enter test name', type: 'error' });
    try {
      setLoading(true);
      const payload = { testName, qty, urgency };
      const res = await axiosInstance.post(`/patients/${patientId}/lab-requests`, payload);
      const created = res.data.labTest || res.data.labTest || null;
      if (created) {
        setRequests(prev => [created, ...prev]);
        setTestName(''); setQty(1); setUrgency('routine');
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

        {/* Patient header summary (minimal) */}
        <div className="text-left bg-gray-50 p-4 rounded mb-6">
          <p><strong>INPATIENT'S FILE NO :</strong> { /* Placeholder: patient hospital id or mrn */ }</p>
          <p><strong>PATIENT'S NAME :</strong> {/* not loaded here; keep blank or pull from parent if needed */}</p>
          <p><strong>PATIENT'S AGE :</strong> </p>
          <p><strong>PATIENT'S PAYMENT DETAILS :</strong> </p>
          <p><strong>SCHEME :</strong> </p>
        </div>

        <div className="mb-4">
          <h2 className="font-semibold">INVESTIGATION</h2>
          <div className="flex items-center gap-2 mt-2">
            <input type="text" value={testName} onChange={e => setTestName(e.target.value)} placeholder="Search By Name" className="input flex-1" />
            <input type="number" value={qty} min={1} onChange={e => setQty(Number(e.target.value))} placeholder="Quantity" className="input w-28" />
            <select value={urgency} onChange={e => setUrgency(e.target.value)} className="input w-40">
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT</option>
            </select>
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
                    <td className="border px-3 py-2 text-sm text-right">{(r.amount || 0).toFixed(2)}</td>
                    <td className="border px-3 py-2 text-center">{r.qty || 1}</td>
                    <td className="border px-3 py-2 text-right">{(((r.amount || 0) * (r.qty || 1)) || 0).toFixed(2)}</td>
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
