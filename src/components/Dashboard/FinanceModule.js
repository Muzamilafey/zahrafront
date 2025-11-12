import React, { useState, useEffect } from 'react';
import StatsCard from '../ui/StatsCard';
import DataTable from '../ui/DataTable';

export default function FinanceModule({ axiosInstance, user }) {
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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalInvoiceId, setPaymentModalInvoiceId] = useState(null);
  const [paymentModalAmount, setPaymentModalAmount] = useState('');
  const [paymentModalMethod, setPaymentModalMethod] = useState('cash');
  const [paymentModalLoading, setPaymentModalLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' });

  const sortInvoicesDesc = (invoices) => (invoices || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get('/billing');
        setInvoices(sortInvoicesDesc(res.data.invoices || []));
        try {
          const pRes = await axiosInstance.get('/patients');
          setPatients(pRes.data.patients || []);
        } catch (pe) { /* ignore patient load errors */ }
        try{
          const aRes = await axiosInstance.get('/appointments');
          setAppointments(aRes.data.appointments || []);
        }catch(e){ /* ignore */ }
        try{
          const invRes = await axiosInstance.get('/billing');
          const invs = invRes.data.invoices || [];
          const map = {};
          invs.forEach(i=>{ if(i.appointment) map[String(i.appointment)] = true; });
          setInvoiceMap(map);
          setInvoices(sortInvoicesDesc(invs));

          const totalBilled = invs.reduce((s,i)=>s + (Number(i.amount)||0), 0);
          const totalIncome = invs.reduce((s,i)=>s + (i.status === 'paid' ? (Number(i.amount)||0) : 0), 0);
          const outstanding = totalBilled - totalIncome;
          setTotals({ totalBilled, totalIncome, outstanding });
        }catch(e){ /* ignore */ }
      } catch (err) { console.error(err); setError('Failed to load invoices'); }
      finally { setLoading(false); }
    };
    load();
  }, [axiosInstance]);

  const loadReport = async (period = reportPeriod) => {
    try{
      setLoading(true);
      const res = await axiosInstance.get(`/billing/reports/revenue?period=${period}`);
      setReportRows(res.data.rows || []);
    }catch(err){ console.error(err); setError('Failed to load report'); }
    finally{ setLoading(false); }
  };

  const createInvoice = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.amount) return alert('Patient and Amount required');
    try {
      setLoading(true);
      const { createOrMergeInvoice } = await import('../../utils/billing');
      const res = await createOrMergeInvoice(axiosInstance, form);
      // server may return invoice in different places
      const invoice = res.data?.invoice || res.data;
      setInvoices(sortInvoicesDesc([invoice, ...invoices]));
      setForm({ patientId: '', amount: '', type: 'treatment' });
      showToast('Invoice created', 'success');
    } catch (err) { console.error(err); showToast(err?.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const createApptInvoice = async (e) => {
    e.preventDefault();
    if (!apptForm.appointmentId || !apptForm.amount) return alert('Appointment and Amount required');
    try {
      setLoading(true);
      const res = await axiosInstance.post('/billing/from-appointment', apptForm);
      setInvoices(sortInvoicesDesc([res.data.invoice, ...invoices]));
      setApptForm({ appointmentId: '', amount: '', type: 'treatment' });
      showToast('Invoice created from appointment', 'success');
    } catch (err) { console.error(err); showToast(err?.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const markPaid = async (invoiceId) => {
    setPaymentModalInvoiceId(invoiceId);
    setPaymentModalOpen(true);
    setPaymentModalAmount('');
    setPaymentModalMethod('cash');
  };

  const submitPaymentModal = async () => {
    if (!paymentModalAmount) return alert('Amount required');
    setPaymentModalLoading(true);
    try {
      await axiosInstance.post(`/billing/${paymentModalInvoiceId}/payment`, {
        amount: Number(paymentModalAmount),
        method: paymentModalMethod,
        date: new Date().toISOString(),
      });
      setPaymentModalOpen(false);
      const updatedInvoices = invoices.map(inv =>
        String(inv._id) === String(paymentModalInvoiceId)
          ? { ...inv, status: 'paid', amountPaid: (Number(inv.amountPaid || 0) + Number(paymentModalAmount)).toFixed(2) }
          : inv
      );
      setInvoices(updatedInvoices);
      const totalBilled = updatedInvoices.reduce((s,i)=>s + (Number(i.amount)||0), 0);
      const totalIncome = updatedInvoices.reduce((s,i)=>s + (i.status === 'paid' ? (Number(i.amount)||0) : 0), 0);
      const outstanding = totalBilled - totalIncome;
      setTotals({ totalBilled, totalIncome, outstanding });
      showToast('Payment recorded', 'success');
    } catch (err) { console.error(err); showToast(err?.response?.data?.message || 'Failed', 'error'); }
    finally { setPaymentModalLoading(false); }
  };

  const printInvoice = async (inv) => {
    // Try server-generated PDF via the print endpoint, fallback to download endpoint, then fallback to HTML print
    try{
      // try the print endpoint first (server generates PDF response)
      const resp = await axiosInstance.get(`/billing/${inv._id}/print`, { responseType: 'blob' });
      if (resp.status === 200) {
        const blob = new Blob([resp.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const w = window.open(url, '_blank');
        if (!w) { const a = document.createElement('a'); a.href = url; a.download = `invoice-${inv.invoiceNumber || inv._id}.pdf`; document.body.appendChild(a); a.click(); a.remove(); } else { w.focus(); }
        setTimeout(()=> URL.revokeObjectURL(url), 60 * 1000);
        return;
      }
    }catch(err){
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
          return;
        }
      }catch(dErr){ console.warn('Download endpoint failed:', dErr?.response?.status, dErr?.response?.data || dErr.message || dErr); }
    }

    // Fallback: show user friendly alert and allow HTML print fallback
    alert('Could not fetch a server-generated PDF for printing — falling back to browser print or check backend logs.');
  };

  const exportInvoice = async (inv) => {
    try{
      const saved = localStorage.getItem('notificationRecipient') || '';
      const to = prompt('Send invoice to (email):', saved);
      if (!to) return;
      await axiosInstance.post(`/billing/${inv._id}/export-email`, { to });
      try{ localStorage.setItem('notificationRecipient', to); }catch(e){}
      showToast('Email sent', 'success');
    }catch(e){ console.error(e); showToast('Failed to send email', 'error'); }
  };

  const showToast = (message, type = 'success') => {
    setToast({ open: true, message, type });
    setTimeout(() => setToast({ open: false, message: '', type: 'success' }), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Finance Management</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Billed" value={`$${(totals.totalBilled||0).toLocaleString()}`} />
        <StatsCard title="Total Income" value={`$${(totals.totalIncome||0).toLocaleString()}`} />
        <StatsCard title="Outstanding" value={`$${(totals.outstanding||0).toLocaleString()}`} />
      </div>

      <div className="bg-white rounded p-4 shadow">
        <h3 className="font-semibold mb-4">All Transactions / Invoices</h3>
        {(user?.role === 'finance' || user?.role === 'admin') && (
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
        {(user?.role === 'finance' || user?.role === 'admin') && (
          <div className="bg-gray-50 p-3 rounded mb-4">
            <h4 className="font-semibold mb-2">Create Invoice from Appointment</h4>
            <form onSubmit={createApptInvoice} className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <select className="input" value={apptForm.appointmentId} onChange={e=>setApptForm({...apptForm,appointmentId:e.target.value})}>
                <option value="">-- Select appointment --</option>
                {(appointments || []).filter(a => !invoiceMap[String(a._id)]).map(a => (
                  <option key={a._id} value={a._id}>{a.appointmentNumber || a._id} - {a.patient?.user?.name}</option>
                ))}
              </select>
              <input className="input" placeholder="Amount" value={apptForm.amount} onChange={e=>setApptForm({...apptForm,amount:e.target.value})} />
              <select className="input" value={apptForm.type} onChange={e=>setApptForm({...apptForm,type:e.target.value})}>
                <option value="treatment">treatment</option>
                <option value="consultation">consultation</option>
              </select>
              <div>
                <button className="btn-brand" type="submit">Create Invoice</button>
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
                {i.status !== 'paid' && i.status !== 'cancelled' && i.status !== 'refunded' && (<button className="btn-brand text-sm" onClick={() => markPaid(i._id)}>Mark as Paid</button>)}
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

      <div className="bg-white rounded p-4 shadow">
        <h3 className="font-semibold mb-4">Revenue Reports</h3>
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
