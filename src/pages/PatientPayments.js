import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function PatientPayments(){
  const { id } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ load(); }, [id]);
  const load = async () => {
    try{
      setLoading(true);
      // backend may support /payments?patientId= or /patients/:id/payments
      let res;
      try{ res = await axiosInstance.get(`/payments`, { params: { patientId: id } }); }
      catch(e){ res = await axiosInstance.get(`/patients/${id}/payments`).catch(()=>({ data: { payments: [] } })); }
      setPayments(res.data.payments || res.data || []);
    }catch(e){ console.error(e); }
    finally{ setLoading(false); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Payment Records</h2>
        <Link to={`/patients/${id}`} className="btn-muted">Back to patient</Link>
      </div>

      {loading ? (
        <div className="py-8 text-center">Loading payments...</div>
      ) : (
        <div className="bg-white rounded shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map(p => (
                <tr key={p._id || p.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(p.createdAt || p.date).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{p.amount || p.total || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{p.method || p.source || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{p.reference || p.transactionId || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <div className="p-6 text-center text-gray-500">No payments found</div>}
        </div>
      )}
    </div>
  );
}
