import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { FaArrowLeft, FaPrint, FaDownload } from 'react-icons/fa';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function InvoiceDetails() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const [invoice, setInvoice] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentMessage, setPaymentMessage] = useState(null);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch invoice details
      const res = await axiosInstance.get(`/billing/${invoiceId}`);
      setInvoice(res.data.invoice || res.data);

      // Fetch hospital settings for branding
      try {
        const hRes = await axiosInstance.get('/setting/hospital-details');
        setHospital(hRes.data || null);
      } catch (e) {
        /* ignore */
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      setPaymentMessage({ type: 'error', text: 'Enter a valid payment amount' });
      return;
    }
    setPaymentLoading(true);
    setPaymentMessage(null);
    try {
      await axiosInstance.put(`/billing/${invoiceId}/pay`, {
        amount: Number(paymentAmount),
        method: paymentMethod
      });
      setPaymentAmount('');
      setPaymentMessage({ type: 'success', text: 'Payment recorded' });
      // reload invoice to show updated status
      setTimeout(() => loadInvoice(), 1500);
    } catch (err) {
      console.error('Payment failed', err);
      setPaymentMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to record payment' });
    } finally {
      setPaymentLoading(false);
      setTimeout(() => setPaymentMessage(null), 4000);
    }
  };

  const handleGeneratePdf = async () => {
    const element = document.getElementById('invoice-printable');
    if (!element) return alert('Nothing to generate');
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const filename = `invoice-${invoice?.invoiceNumber || invoice?._id || 'receipt'}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF generation failed', err);
      alert('Failed to generate PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-brand-600 hover:text-brand-700"
        >
          <FaArrowLeft /> Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          {error || 'Invoice not found'}
        </div>
      </div>
    );
  }

  const totalAmount = (invoice.lineItems || []).reduce((sum, item) => sum + (item.amount || 0), 0) || invoice.amount || 0;
  const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const balance = totalAmount - totalPaid;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-brand-600 hover:text-brand-700"
          >
            <FaArrowLeft /> Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Invoice #{invoice.invoiceNumber || invoice._id}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGeneratePdf}
            className="btn-brand flex items-center gap-2"
          >
            <FaDownload /> Generate PDF
          </button>
          <button
            onClick={handlePrint}
            className="btn-outline flex items-center gap-2"
          >
            <FaPrint /> Print
          </button>
        </div>
      </div>

      {paymentMessage && (
        <div className={`mb-4 p-3 rounded ${paymentMessage.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {paymentMessage.text}
        </div>
      )}

      {/* Printable area */}
      <div id="invoice-printable" className="bg-white rounded-lg shadow p-8">
        {/* Hospital header */}
        {hospital && (hospital.name || hospital.logo || hospital.logoUrl) && (
          <div className="mb-6 flex justify-between items-start border-b pb-4">
            <div>
              <div className="text-2xl font-bold">{hospital.name || 'Hospital'}</div>
              {hospital.location && <div className="text-sm text-gray-600">{hospital.location}</div>}
              {hospital.contacts && (
                <div className="text-sm text-gray-600">
                  {Array.isArray(hospital.contacts) ? hospital.contacts.join(' | ') : hospital.contacts}
                </div>
              )}
            </div>
            {(hospital.logo || hospital.logoUrl) && (
              <div className="w-20 h-20">
                <img src={hospital.logo || hospital.logoUrl} alt="hospital logo" className="object-contain w-full h-full" />
              </div>
            )}
          </div>
        )}

        {/* Invoice metadata */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-sm text-gray-600">Bill To:</div>
            <div className="font-semibold">{invoice.patient?.user?.name || 'Patient'}</div>
            <div className="text-sm text-gray-600">{invoice.patient?.user?.email || '-'}</div>
            <div className="text-sm text-gray-600">{invoice.patient?.phonePrimary || '-'}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Invoice Date:</div>
            <div className="font-semibold">{new Date(invoice.createdAt).toLocaleDateString()}</div>
            <div className="text-sm text-gray-600 mt-2">Status:</div>
            <div className={`font-semibold ${invoice.status === 'paid' ? 'text-green-600' : invoice.status === 'partially_paid' ? 'text-orange-600' : 'text-red-600'}`}>
              {(invoice.status || 'pending').toUpperCase()}
            </div>
          </div>
        </div>

        {/* Line items table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 bg-gray-50">
                <th className="text-left p-3 font-semibold">Description</th>
                <th className="text-center p-3 font-semibold">Qty</th>
                <th className="text-right p-3 font-semibold">Unit Price</th>
                <th className="text-right p-3 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.lineItems || []).length > 0 ? (
                invoice.lineItems.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-3">{item.description || '-'}</td>
                    <td className="text-center p-3">{item.qty || 1}</td>
                    <td className="text-right p-3">${((item.amount || 0) / (item.qty || 1)).toFixed(2)}</td>
                    <td className="text-right p-3 font-medium">${(item.amount || 0).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b">
                  <td className="p-3">{invoice.type ? `Charge: ${invoice.type}` : 'Invoice charge'}</td>
                  <td className="text-center p-3">1</td>
                  <td className="text-right p-3">${(invoice.amount || 0).toFixed(2)}</td>
                  <td className="text-right p-3 font-medium">${(invoice.amount || 0).toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="flex justify-between py-2 border-t-2">
              <span className="font-semibold">Subtotal:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b-2">
              <span className="font-semibold">Total Paid:</span>
              <span className="text-green-600 font-semibold">${totalPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-lg">
              <span className="font-bold">Balance Due:</span>
              <span className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>${balance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment history */}
        {(invoice.payments || []).length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold mb-3">Payment History</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-2 text-sm">Date</th>
                  <th className="text-left p-2 text-sm">Method</th>
                  <th className="text-right p-2 text-sm">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((p, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2 text-sm">{new Date(p.date || p.createdAt).toLocaleDateString()}</td>
                    <td className="p-2 text-sm">{(p.method || 'unknown').toUpperCase()}</td>
                    <td className="text-right p-2 text-sm font-medium">${(p.amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment recording section (non-printable) */}
      {balance > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6 print-hide">
          <h2 className="text-lg font-semibold mb-4">Record Payment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                className="w-full p-2 border rounded"
                disabled={paymentLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-2 border rounded" disabled={paymentLoading}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mpesa">M-Pesa</option>
                <option value="cheque">Cheque</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="insurance">Insurance</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleRecordPayment}
                disabled={paymentLoading}
                className="btn-brand w-full"
              >
                {paymentLoading ? 'Recording…' : 'Record Payment'}
              </button>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Balance due: <span className="font-semibold text-red-600">${balance.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          .print-hide { display: none !important; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}
