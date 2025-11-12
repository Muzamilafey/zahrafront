import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Billing() {
  const { axiosInstance } = useContext(AuthContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [hospital, setHospital] = useState(null);
  const [form, setForm] = useState({ patientId:'', amount:'', type: 'treatment' });
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportRecipient, setExportRecipient] = useState('');
  const [exportInvoiceId, setExportInvoiceId] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState('');

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalInvoiceId, setPaymentModalInvoiceId] = useState(null);
  const [paymentModalAmount, setPaymentModalAmount] = useState('');
  const [paymentModalMethod, setPaymentModalMethod] = useState('cash');
  const [paymentModalLoading, setPaymentModalLoading] = useState(false);

  useEffect(()=>{ try{ const saved = localStorage.getItem('notificationRecipient'); if (saved) setExportRecipient(saved); }catch(e){} },[]);

  const openExportModal = (id)=>{ setExportInvoiceId(id); setExportModalOpen(true); };
  const closeExportModal = ()=>{ setExportInvoiceId(null); setExportModalOpen(false); };

  const sendExportEmail = async ()=>{
    if (!exportRecipient) { setExportError('Enter recipient'); setTimeout(()=>setExportError(''),3000); return; }
    setExportLoading(true);
    try{
      await axiosInstance.post(`/billing/${exportInvoiceId}/export-email`, { to: exportRecipient });
      try{ localStorage.setItem('notificationRecipient', exportRecipient); }catch(e){}
      setExportSuccess(true); setTimeout(()=>setExportSuccess(false),2000);
      closeExportModal();
    }catch(e){ console.error(e); setExportError('Failed to send'); setTimeout(()=>setExportError(''),3000); }
    setExportLoading(false);
  };

  const printInvoice = (inv) => {
    // If user has finance/reception/admin role, try to fetch the server-generated PDF and open it
    const tryServerPdf = async () => {
      // only finance or admin may request the server-generated PDF
      if (!(user?.role === 'finance' || user?.role === 'admin')) return false;
      let lastErr = null;
      // try the print endpoint first
      try{
        const resp = await axiosInstance.get(`/billing/${inv._id}/print`, { responseType: 'blob' });
        if (resp.status === 200) {
          const blob = new Blob([resp.data], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const w = window.open(url, '_blank');
          if (!w) { const a = document.createElement('a'); a.href = url; a.download = `invoice-${inv.invoiceNumber || inv._id}.pdf`; document.body.appendChild(a); a.click(); a.remove(); } else { w.focus(); }
          setTimeout(()=> URL.revokeObjectURL(url), 60 * 1000);
          return true;
        }
      }catch(err){
        lastErr = err;
        console.warn('Print endpoint failed:', err?.response?.status, err?.response?.data || err.message || err);
        // try download endpoint as fallback (served when PDF previously generated/saved)
        try{
          const dResp = await axiosInstance.get(`/billing/${inv._id}/download`, { responseType: 'blob' });
          if (dResp.status === 200) {
            const blob = new Blob([dResp.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const w = window.open(url, '_blank');
            if (!w) { const a = document.createElement('a'); a.href = url; a.download = `invoice-${inv.invoiceNumber || inv._id}.pdf`; document.body.appendChild(a); a.click(); a.remove(); } else { w.focus(); }
            setTimeout(()=> URL.revokeObjectURL(url), 60 * 1000);
            return true;
          }
        }catch(dErr){ lastErr = dErr; console.warn('Download endpoint failed:', dErr?.response?.status, dErr?.response?.data || dErr.message || dErr); }
      }
      if (lastErr) {
        const status = lastErr?.response?.status || 'network-error';
        const msg = lastErr?.response?.data?.message || lastErr.message || JSON.stringify(lastErr?.response?.data) || 'Unknown';
        alert(`Could not fetch PDF for printing (status: ${status})\n${msg}`);
      }
      return false;
    };

    // attempt server PDF first; if not allowed or fails, fallback to HTML print
    tryServerPdf().then(did => {
      if (did) return;
      const w = window.open('', '_blank'); if(!w) return;
      const logo = 'https://github.com/Muzamilafey/myassets/blob/main/logo.png?raw=true';
      const html = `
      <html><head><title>Invoice${inv.invoiceNumber ? ' #' + inv.invoiceNumber : ''}</title>
      <style>
        body{font-family: Arial; padding:24px; color:#111827}
        .header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px}
        .org{max-width:60%}
        .org h1{margin:0;font-size:20px}
        .org p{margin:4px 0;color:#4b5563}
        .meta{width:260px;text-align:right}
        .meta .box{display:inline-block;background:#fff;border-radius:6px;padding:10px 12px;border:1px solid #e5e7eb}
        .logo{width:100px}
        table{width:100%;border-collapse:collapse;margin-top:12px}
        th{background:#0ea5a4;color:#fff;padding:10px;text-align:left}
        td{padding:10px;border-bottom:1px solid #f3f4f6}
        .totals{margin-top:18px;display:flex;justify-content:flex-end;gap:16px}
      </style>
      </head><body>
        <div class="header">
          <div class="org">
            <h1>${hospital && hospital.name ? hospital.name : 'Genz Community Hospital'}</h1>
            <p>${hospital && hospital.location ? hospital.location.replace(/\n/g,'<br/>') : ''}</p>
            ${hospital && hospital.contacts ? `<p style="color:#4b5563">${(Array.isArray(hospital.contacts) ? hospital.contacts.join(' | ') : hospital.contacts)}</p>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
            <div class="meta"><div class="box"><div style="font-weight:700">Invoice ${inv.invoiceNumber || ''}</div><div style="font-size:12px;color:#374151">Date: ${new Date(inv.createdAt).toLocaleDateString()}</div><div style="font-size:12px;color:#374151">Status: ${inv.status || ''}</div></div></div>
            <div><img class="logo" src="${logo}" alt="logo"/></div>
          </div>
        </div>

        <div><strong>Bill To:</strong> ${inv.patient?.user?.name || '-'}</div>
        <div style="margin-bottom:8px;color:#374151">${inv.patient?.user?.email || '-'}</div>

        <table>
          <thead>
            <tr><th style="width:60%">Description</th><th style="width:10%;text-align:right">Qty</th><th style="width:15%;text-align:right">Unit</th><th style="width:15%;text-align:right">Amount</th></tr>
          </thead>
          <tbody>
            ${(Array.isArray(inv.lineItems) && inv.lineItems.length) ? inv.lineItems.map(it=>`<tr><td>${it.description || '-'}</td><td style="text-align:right">${it.qty||1}</td><td style="text-align:right">${(it.amount && it.qty) ? (Number(it.amount)/(it.qty||1)).toFixed(2) : '-'}</td><td style="text-align:right">${(Number(it.amount)||0).toFixed(2)}</td></tr>`).join('') : `<tr><td>${inv.type?('Charge: '+inv.type):'Invoice charge'}</td><td style="text-align:right">1</td><td style="text-align:right">-</td><td style="text-align:right">${(inv.amount||0).toFixed(2)}</td></tr>`}
          </tbody>
        </table>

        <div class="totals">
          <div style="text-align:right">
            <div style="font-weight:700">Subtotal</div>
            <div style="font-size:20px;font-weight:700;margin-top:6px">Ksh ${(inv.amount||0).toLocaleString('en-GB',{minimumFractionDigits:2})}</div>
          </div>
        </div>
      </body></html>`;
      w.document.write(html); w.document.close(); w.focus(); setTimeout(()=>{ w.print(); w.close(); }, 300);
    });
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // If a patientId query param is present, request server to filter invoices for that patient
        const params = new URLSearchParams(location.search);
        const patientId = params.get('patientId');
        const url = patientId ? `/billing?patientId=${encodeURIComponent(patientId)}` : '/billing';
        const res = await axiosInstance.get(url);
        // Normalize invoices: backend might return { invoices: [...] } or an array
        let fetched = res.data.invoices || (Array.isArray(res.data) ? res.data : []);
        // If a patientId was requested but backend didn't filter, apply client-side filter as fallback
        if (patientId) {
          fetched = (fetched || []).filter(inv => {
            const pid = inv.patient?._id || inv.patient || inv.patientId || (inv.patient && inv.patient._id);
            return String(pid) === String(patientId);
          });
        }
        setInvoices(fetched || []);
        // load hospital settings (used in printed invoice header/footer)
        try{
          const hRes = await axiosInstance.get('/setting/hospital-details');
          setHospital(hRes.data || null);
        }catch(e){ /* ignore */ }
        // if finance, fetch patients for create form (only when not filtering by patient)
        try{
          if (!patientId) {
            const pRes = await axiosInstance.get('/patients');
            setPatients(pRes.data.patients || []);
          }
        }catch(e){ /* ignore */ }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [axiosInstance, location.search]);

  const createInvoice = async (e) => {
    e.preventDefault();
    try{
      const { createOrMergeInvoice } = await import('../utils/billing');
      await createOrMergeInvoice(axiosInstance, { patientId: form.patientId, amount: parseFloat(form.amount), type: form.type });
      const res = await axiosInstance.get('/billing');
      setInvoices(res.data.invoices || []);
      setForm({ patientId:'', amount:'', type: 'treatment' });
      alert('Invoice created');
    }catch(e){ console.error(e); alert(e?.response?.data?.message || 'Create failed'); }
  };

  const markPaid = async (id)=>{
    // open modal for amount & method
    setPaymentModalInvoiceId(id);
    setPaymentModalAmount('');
    setPaymentModalMethod('cash');
    setPaymentModalOpen(true);
  };

  const submitPaymentModal = async () => {
    try{
      if (!paymentModalInvoiceId) return alert('No invoice selected');
      const amount = Number(paymentModalAmount);
      if (!amount || Number.isNaN(amount) || amount <= 0) return alert('Invalid amount');
      setPaymentModalLoading(true);
      await axiosInstance.put(`/billing/${paymentModalInvoiceId}/pay`, { amount, method: paymentModalMethod });
      const res = await axiosInstance.get('/billing');
      setInvoices(res.data.invoices || []);
      setPaymentModalOpen(false);
      alert('Payment recorded');
    }catch(e){ console.error(e); alert(e?.response?.data?.message || 'Update failed'); }
    finally{ setPaymentModalLoading(false); }
  };

  return (
    <div className="p-8">
  <h2 className="text-2xl font-bold mt-0 sm:mt-1 mb-0">Billing</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {user?.role === 'finance' && (
        <div className="bg-white p-4 rounded shadow mb-4">
          <h3 className="font-semibold mb-2">Create Invoice</h3>
          <form onSubmit={createInvoice} className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <select className="input" value={form.patientId} onChange={e=>setForm({...form,patientId:e.target.value})}>
              <option value="">-- Select patient --</option>
              {patients.map(p=>(<option key={p._id} value={p._id}>{p.user?.name || p.user?.email || p.hospitalId}</option>))}
            </select>
            <input className="input" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} />
            <select className="input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
              <option value="treatment">treatment</option>
              <option value="prescription">prescription</option>
              <option value="lab">lab</option>
            </select>
            <div>
              <button className="btn-brand" type="submit">Create</button>
            </div>
          </form>
        </div>
      )}

      <div>
        {invoices.length === 0 && <p>No invoices found.</p>}
        {invoices.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {invoices.map(inv => (
              <div key={inv._id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Invoice</p>
                    <h3 className="text-lg font-semibold">#{inv.invoiceNumber}</h3>
                  </div>
                  <div className="text-right">
                    <p className={`px-2 py-1 rounded text-sm ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : inv.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {inv.status}
                    </p>
                  </div>
                </div>

                <div className="mt-3 text-sm text-gray-700">
                  <p><strong>Patient:</strong> {inv.patient?.user?.name || '-'}</p>
                  <p><strong>Amount:</strong> ${inv.amount}</p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-gray-500">{new Date(inv.createdAt).toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <button className="btn-outline text-sm" onClick={()=>navigate(`/billing/${inv._id}`)}>View Details</button>
                    <button className="btn-outline text-sm" onClick={()=>printInvoice(inv)}>Print</button>
                    {(user?.role === 'finance' || user?.role === 'admin') && (
                      <button className="btn-primary text-sm" onClick={()=>openExportModal(inv._id)}>Export to Email</button>
                    )}
                    {(user?.role === 'finance' || user?.role === 'admin') && inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'refunded' && (
                      <button className="btn-brand" onClick={()=>markPaid(inv._id)}>Mark as Paid</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* export modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={closeExportModal}>
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="relative bg-white rounded p-4 w-full max-w-md mx-4" onClick={(e)=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Send invoice PDF to (email)</h3>
            <input type="email" className="w-full border rounded p-2 mb-3" placeholder="recipient@example.com" value={exportRecipient} onChange={e=>setExportRecipient(e.target.value)} />
            <div className="flex justify-end space-x-2">
              <button className="btn-outline" onClick={closeExportModal} disabled={exportLoading}>Cancel</button>
              <button className="btn-primary" onClick={sendExportEmail} disabled={exportLoading}>{exportLoading? 'Sending...' : 'Send & Save'}</button>
            </div>
          </div>
        </div>
      )}

      {exportSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={()=>setExportSuccess(false)}>
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="relative bg-white rounded p-6 w-full max-w-sm mx-4 text-center" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-center mb-4">
              <div className="w-24 h-24 flex items-center justify-center bg-green-50 rounded-full">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <div className="font-semibold text-lg mb-2">Email sent</div>
            <div className="text-sm text-gray-600">This window will close automatically.</div>
          </div>
        </div>
      )}

      {exportError && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-white border rounded p-4 shadow">
          <div className="w-12 h-12 flex items-center justify-center bg-red-50 rounded-full mr-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 9v4" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 17h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <div className="font-semibold text-sm">{exportError}</div>
          </div>
        </div>
      )}
      {/* Payment modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={()=>setPaymentModalOpen(false)}>
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="relative bg-white rounded p-4 w-full max-w-md mx-4" onClick={(e)=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Record Payment</h3>
            <div className="mb-2">
              <label className="text-sm text-gray-600">Amount</label>
              <input className="input w-full" value={paymentModalAmount} onChange={e=>setPaymentModalAmount(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="text-sm text-gray-600">Method</label>
              <select className="input w-full" value={paymentModalMethod} onChange={e=>setPaymentModalMethod(e.target.value)}>
                <option value="cash">cash</option>
                <option value="card">card</option>
                <option value="mpesa">mpesa</option>
                <option value="insurance">insurance</option>
                <option value="bank">bank</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={()=>setPaymentModalOpen(false)} disabled={paymentModalLoading}>Cancel</button>
              <button className="btn-brand" onClick={submitPaymentModal} disabled={paymentModalLoading}>{paymentModalLoading? 'Saving...':'Save Payment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}