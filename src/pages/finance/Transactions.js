import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function Transactions() {
  const { axiosInstance, user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get('/payments');
        setLogs(res.data.paymentLogs || []);
      }catch(e){ console.error(e); }
    };
    if (user?.role === 'finance' || user?.role === 'admin') load();
  },[user]);

  const reconcile = async (id)=>{
    if(!window.confirm('Mark invoice for this payment as paid?')) return;
    try{
      const res = await axiosInstance.post(`/payments/${id}/reconcile`);
      alert(res.data.message || 'Reconciled');
      const reload = await axiosInstance.get('/payments');
      setLogs(reload.data.paymentLogs || []);
    }catch(e){ console.error(e); alert(e?.response?.data?.message || 'Failed to reconcile'); }
  };

  return (
    <div className="p-6">
  <h2 className="text-2xl font-bold mt-0 mb-0">Transactions / Payments</h2>
      <div className="bg-white rounded p-4 shadow">
        {logs.length === 0 && <p>No payment logs found.</p>}
        {logs.map(l=> (
          <div key={l._id} className="border-b py-2 flex justify-between items-center">
            <div>
              <div><strong>{l.transactionId}</strong> — {l.phoneNumber}</div>
              <div>Amount: {l.amount?.toLocaleString?.() ?? l.amount} — Status: {l.status}</div>
              <div>Invoice#: {l.invoiceNumber ?? '-'} {l.invoice ? ` — #${l.invoice.invoiceNumber} (${l.invoice.status})` : ''}</div>
              {l.rawPayload && <details className="text-xs text-gray-600"><summary>Raw payload</summary><pre className="whitespace-pre-wrap">{JSON.stringify(l.rawPayload, null, 2)}</pre></details>}
            </div>
            <div>
              {l.status === 'success' && (!l.invoice || l.invoice.status !== 'paid') && <button className="btn-brand" onClick={()=>reconcile(l._id)}>Reconcile</button>}
              {l.invoice && <div className="text-sm text-gray-600">Invoice status: {l.invoice.status}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
