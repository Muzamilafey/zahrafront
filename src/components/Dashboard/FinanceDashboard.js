import React, { useState, useEffect, useContext } from 'react';
// Sidebar and Topbar are handled by the global Layout
import StatsCard from '../ui/StatsCard';
import DataTable from '../ui/DataTable';
import { AuthContext } from '../../contexts/AuthContext';
import { createOrMergeInvoice } from '../../utils/billing';
import ThemeToggle from '../ui/ThemeToggle';
import PharmacySalesSummary from './PharmacySalesSummary';

export default function FinanceDashboard() {
  const { axiosInstance, user, logout } = useContext(AuthContext);
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoiceMap, setInvoiceMap] = useState({});
  const [totals, setTotals] = useState({ totalBilled: 0, totalIncome: 0, outstanding: 0 });
  const [apptForm, setApptForm] = useState({ appointmentId: '', amount: '', type: 'treatment' });
  const [form, setForm] = useState({ patientId: '', amount: '', type: 'treatment' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportRows, setReportRows] = useState([]);
  const [reportPeriod, setReportPeriod] = useState('day');

  // helper: sort invoices newest first by createdAt (fallback to invoiceNumber)
  function sortInvoicesDesc(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.slice().sort((a,b) => {
      const da = new Date(a.createdAt || a.createdAt);
      const db = new Date(b.createdAt || b.createdAt);
      const diff = db - da;
      if (diff !== 0) return diff;
      const na = Number(a.invoiceNumber || 0);
      const nb = Number(b.invoiceNumber || 0);
      return nb - na;
    });
  }

  useEffect(()=>{
    const load = async ()=>{
      setLoading(true);
      try {
  const res = await axiosInstance.get('/billing');
  setInvoices(sortInvoicesDesc(res.data.invoices || []));
        // load patients if finance so we can create invoices
        try {
          const pRes = await axiosInstance.get('/patients');
          setPatients(pRes.data.patients || []);
        } catch (pe) { /* ignore patient load errors */ }
        // load recent appointments for finance to bill against
        try{
          const aRes = await axiosInstance.get('/appointments');
          setAppointments(aRes.data.appointments || []);
        }catch(e){ /* ignore */ }
        // build invoice map and compute totals
        try{
          const invRes = await axiosInstance.get('/billing');
          const invs = invRes.data.invoices || [];
          const map = {};
          invs.forEach(i=>{ if(i.appointment) map[String(i.appointment)] = true; });
          setInvoiceMap(map);
          setInvoices(sortInvoicesDesc(invs));

          // totals
          const totalBilled = invs.reduce((s,i)=>s + (Number(i.amount)||0), 0);
          const totalIncome = invs.reduce((s,i)=>s + (i.status === 'paid' ? (Number(i.amount)||0) : 0), 0);
          const outstanding = totalBilled - totalIncome;
          setTotals({ totalBilled, totalIncome, outstanding });
        }catch(e){ /* ignore */ }
      } catch (err) { console.error(err); setError('Failed to load invoices'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

    // (duplicate removed)

  const loadReport = async (period = reportPeriod) => {
    try{
      setLoading(true);
      const res = await axiosInstance.get(`/billing/reports/revenue?period=${period}`);
      setReportRows(res.data.rows || []);
    }catch(err){ console.error(err); setError('Failed to load report'); }
    finally{ setLoading(false); }
  };

  const createInvoice = async (e) => {
    e && e.preventDefault && e.preventDefault();
    try {
      await createOrMergeInvoice(axiosInstance, { patientId: form.patientId, amount: parseFloat(form.amount), type: form.type });
  const res = await axiosInstance.get('/billing');
  setInvoices(sortInvoicesDesc(res.data.invoices || []));
      setForm({ patientId: '', amount: '', type: 'treatment' });
      alert('Invoice created');
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Create failed');
    }
  };

  const markPaid = async (id) => {
    // open modal instead
    setPaymentModalInvoiceId(id);
    setPaymentModalAmount('');
    setPaymentModalMethod('cash');
    setPaymentModalOpen(true);
  };

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalInvoiceId, setPaymentModalInvoiceId] = useState(null);
  const [paymentModalAmount, setPaymentModalAmount] = useState('');
  const [paymentModalMethod, setPaymentModalMethod] = useState('cash');
  const [paymentModalLoading, setPaymentModalLoading] = useState(false);
  // small toast
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' });
  const showToast = (message, type = 'success', ms = 3000) => {
    setToast({ open: true, message, type });
    setTimeout(() => setToast({ open: false, message: '', type }), ms);
  };

  const submitPaymentModal = async () => {
    try {
      const id = paymentModalInvoiceId;
      const amount = Number(paymentModalAmount);
      const method = paymentModalMethod || 'cash';
      if (!id) return showToast('No invoice selected', 'error');
      if (!amount || Number.isNaN(amount) || amount <= 0) return showToast('Invalid amount', 'error');
      const selected = (invoices || []).find(x => String(x._id) === String(id));
      const remaining = selected ? (Number(selected.amount || 0) - Number(selected.amountPaid || 0)) : null;
      if (remaining !== null && amount > remaining) return showToast(`Amount exceeds remaining balance (${remaining})`, 'error');
      setPaymentModalLoading(true);
      await axiosInstance.put(`/billing/${id}/pay`, { amount, method });
  const res = await axiosInstance.get('/billing');
  setInvoices(sortInvoicesDesc(res.data.invoices || []));
      setPaymentModalOpen(false);
      showToast('Payment recorded', 'success');
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || 'Update failed', 'error');
    } finally {
      setPaymentModalLoading(false);
    }
  };

  const printInvoice = async (inv) => {
    // try print endpoint
    try{
      const resp = await axiosInstance.get(`/billing/${inv._id}/print`, { responseType: 'blob' });
      if (resp.status === 200) {
        const blob = new Blob([resp.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const w = window.open(url, '_blank');
        if (!w) { const a = document.createElement('a'); a.href = url; a.download = `invoice-${inv.invoiceNumber || inv._id}.pdf`; document.body.appendChild(a); a.click(); a.remove(); } else { w.focus(); }
        setTimeout(()=> URL.revokeObjectURL(url), 60*1000);
        return;
      }
    }catch(pErr){
      console.warn('Print endpoint failed:', pErr?.response?.status, pErr?.response?.data || pErr.message || pErr);
      let lastErr = pErr;
      // try download endpoint
      try{
        const dResp = await axiosInstance.get(`/billing/${inv._id}/download`, { responseType: 'blob' });
        if (dResp.status === 200) {
          const blob = new Blob([dResp.data], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const w = window.open(url, '_blank');
          if (!w) { const a = document.createElement('a'); a.href = url; a.download = `invoice-${inv.invoiceNumber || inv._id}.pdf`; document.body.appendChild(a); a.click(); a.remove(); } else { w.focus(); }
          setTimeout(()=> URL.revokeObjectURL(url), 60*1000);
          return;
        }
      }catch(dErr){ lastErr = dErr; console.warn('Download endpoint failed:', dErr?.response?.status, dErr?.response?.data || dErr.message || dErr); }
      const status = lastErr?.response?.status || 'network-error';
      const msg = lastErr?.response?.data?.message || lastErr.message || JSON.stringify(lastErr?.response?.data) || 'Unknown';
      alert(`Could not fetch PDF for printing (status: ${status})\n${msg}`);
    }
    alert('Could not fetch PDF for printing — check backend logs or ensure the PDF was generated.');
  };

  const exportInvoice = async (inv) => {
    try{
      const saved = localStorage.getItem('notificationRecipient') || '';
      // eslint-disable-next-line no-restricted-globals
      const to = prompt('Send invoice to (email):', saved);
      if (!to) return;
      await axiosInstance.post(`/billing/${inv._id}/export-email`, { to });
      try{ localStorage.setItem('notificationRecipient', to); }catch(e){}
      alert('Email sent');
    }catch(e){ console.error(e); alert('Failed to send email'); }
  };

  return (
    <>
  <div className="flex items-center justify-between mt-0 mb-0">
    <h1 className="text-2xl font-bold mt-0 mb-0">Finance Dashboard</h1>
    <ThemeToggle />
  </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatsCard title="Total Billed" value={`$${(totals.totalBilled||0).toLocaleString()}`} />
            <StatsCard title="Total Income" value={`$${(totals.totalIncome||0).toLocaleString()}`} />
            <StatsCard title="Outstanding" value={`$${(totals.outstanding||0).toLocaleString()}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1">
              <PharmacySalesSummary axiosInstance={axiosInstance} />
            </div>
          </div>

          <div className="bg-white rounded p-4 shadow">
            <h3 className="font-semibold mb-2">All Transactions / Invoices</h3>
            {user?.role === 'finance' && (
              <div className="bg-gray-50 p-3 rounded mb-4">
                <h4 className="font-semibold mb-2">Request Payment</h4>
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
                    <button className="btn-brand" type="submit">Request</button>
                  </div>
                </form>
              </div>
            )}
            {user?.role === 'finance' && (
              <div className="bg-gray-50 p-3 rounded mb-4">
                <h4 className="font-semibold mb-2">Create Invoice from Appointment</h4>
                <form onSubmit={async (e)=>{ e.preventDefault(); try{ await createOrMergeInvoice(axiosInstance, { appointmentId: apptForm.appointmentId, amount: parseFloat(apptForm.amount), type: apptForm.type }); const res = await axiosInstance.get('/billing'); setInvoices(sortInvoicesDesc(res.data.invoices || [])); setApptForm({ appointmentId:'', amount:'', type:'treatment' }); alert('Invoice created'); }catch(err){ console.error(err); alert(err?.response?.data?.message || 'Create failed'); } }} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <select className="input" value={apptForm.appointmentId} onChange={e=>setApptForm({...apptForm,appointmentId:e.target.value})}>
                      <option value="">-- Select appointment --</option>
                      {appointments.map(a=>{
                        const disabled = invoiceMap[String(a._id)] || a.status === 'expired' || (a.scheduledAt && new Date(a.scheduledAt) < new Date());
                        return (<option key={a._id} value={a._id} disabled={disabled}>{new Date(a.scheduledAt).toLocaleString()} — {a.patient?.user?.name || a.patient} {disabled ? '(Unavailable)' : ''}</option>)
                      })}
                    </select>
                  <input className="input" placeholder="Amount" value={apptForm.amount} onChange={e=>setApptForm({...apptForm,amount:e.target.value})} />
                  <select className="input" value={apptForm.type} onChange={e=>setApptForm({...apptForm,type:e.target.value})}>
                    <option value="treatment">treatment</option>
                    <option value="prescription">prescription</option>
                    <option value="lab">lab</option>
                  </select>
                  <div>
                    <button className="btn-brand" type="submit">Create from Appointment</button>
                  </div>
                </form>
              </div>
            )}
            <DataTable
              columns={[
                { header: 'Invoice #', accessor: 'invoiceNumber' },
                { header: 'Date', accessor: 'createdAt' },
                { header: 'Patient', accessor: 'patient' },
                { header: 'Amount', accessor: 'amount' },
                { header: 'Status', accessor: 'status' },
                { header: 'Actions', accessor: 'actions' },
              ]}
              data={invoices.map(i => ({
                invoiceNumber: i.invoiceNumber,
                createdAt: new Date(i.createdAt).toLocaleDateString(),
                patient: i.patient?.user?.name || '-',
                amount: i.amount,
                status: i.status,
                actions: (user?.role === 'finance' || user?.role === 'admin') ? (
                  <div className="flex items-center gap-2">
                    <button className="btn-outline text-sm" onClick={() => printInvoice(i)}>Print</button>
                    <button className="btn-primary text-sm" onClick={() => exportInvoice(i)}>Export to Email</button>
                      {i.status !== 'paid' && i.status !== 'cancelled' && i.status !== 'refunded' && (<button className="btn-brand" onClick={() => markPaid(i._id)}>Mark as Paid</button>)}
                  </div>
                ) : null,
              }))}
            />
              {/* Payment modal */}
              {paymentModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                  <div className="absolute inset-0 bg-black opacity-50 z-40" onClick={() => setPaymentModalOpen(false)} />
                  <div className="bg-white rounded p-6 z-50 w-full max-w-md pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-lg font-semibold mb-3">Record Payment</h3>
                    <div className="mb-2">
                      <label className="block text-sm text-gray-600">Amount</label>
                      <input className="input w-full" value={paymentModalAmount} onChange={e => setPaymentModalAmount(e.target.value)} />
                      {/* remaining balance */}
                      {paymentModalInvoiceId && (() => {
                        const sel = (invoices || []).find(x => String(x._id) === String(paymentModalInvoiceId));
                        if (!sel) return null;
                        const remaining = (Number(sel.amount || 0) - Number(sel.amountPaid || 0)).toFixed(2);
                        return <div className="text-sm text-gray-500 mt-1">Remaining balance: {remaining}</div>;
                      })()}
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm text-gray-600">Method</label>
                      <select className="input w-full" value={paymentModalMethod} onChange={e => setPaymentModalMethod(e.target.value)}>
                        <option value="cash">cash</option>
                        <option value="card">card</option>
                        <option value="mpesa">mpesa</option>
                        <option value="insurance">insurance</option>
                        <option value="bank">bank</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button className="btn-outline" onClick={() => setPaymentModalOpen(false)} disabled={paymentModalLoading}>Cancel</button>
                      <button className="btn-brand" onClick={submitPaymentModal} disabled={paymentModalLoading}>{paymentModalLoading ? 'Saving...' : 'Save Payment'}</button>
                    </div>
                  </div>
                </div>
              )}
              {/* toast */}
              {toast.open && (
                <div className={`fixed bottom-6 right-6 z-60 p-3 rounded shadow-lg ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                  {toast.message}
                </div>
              )}
          </div>

          <div className="bg-white rounded p-4 shadow mt-6">
            <h3 className="font-semibold mb-2">Revenue Reports</h3>
            <div className="flex items-center gap-2 mb-3">
              <button className={`px-3 py-1 rounded ${reportPeriod==='day'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={()=>{ setReportPeriod('day'); loadReport('day'); }}>Daily</button>
              <button className={`px-3 py-1 rounded ${reportPeriod==='month'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={()=>{ setReportPeriod('month'); loadReport('month'); }}>Monthly</button>
              <button className="px-3 py-1 rounded bg-gray-100" onClick={()=>loadReport(reportPeriod)}>Refresh</button>
            </div>

            {reportRows.length === 0 ? (
              <div className="text-sm text-gray-500">No report data. Click "Daily" or "Monthly" to load.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-auto w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-left">Date</th>
                      <th className="px-2 py-1 text-right">Billed</th>
                      <th className="px-2 py-1 text-right">Paid</th>
                      <th className="px-2 py-1 text-right">Refunds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRows.map(r=> (
                      <tr key={r.date} className="border-t">
                        <td className="px-2 py-1">{r.date}</td>
                        <td className="px-2 py-1 text-right">${(r.totalBilled||0).toLocaleString()}</td>
                        <td className="px-2 py-1 text-right">${(r.totalPaid||0).toLocaleString()}</td>
                        <td className="px-2 py-1 text-right">${(r.totalRefunds||0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
    </>
  );
}