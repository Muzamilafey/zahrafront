import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function InvoiceDetail() {
  const { id: invoiceId } = useParams();
  const { axiosInstance, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const printRef = useRef();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState([]);
  const [message, setMessage] = useState(null);
  const [generatePDFLoading, setGeneratePDFLoading] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/billing/${invoiceId}`);
      const inv = res.data.invoice || res.data;
      setInvoice(inv);
      setEditedItems(inv.lineItems || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleEditLineItem = (index, field, value) => {
    const updated = [...editedItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditedItems(updated);
  };

  const handleSaveLineItems = async () => {
    try {
      setMessage({ type: 'loading', text: 'Saving line items...' });
      await axiosInstance.put(`/billing/${invoiceId}`, { lineItems: editedItems });
      setMessage({ type: 'success', text: 'Line items updated' });
      setTimeout(() => setMessage(null), 2500);
      setIsEditing(false);
      loadInvoice();
    } catch (e) {
      setMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to update' });
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm('Finalize this invoice? It will be locked from further editing.')) return;
    try {
      setMessage({ type: 'loading', text: 'Finalizing...' });
      await axiosInstance.put(`/billing/${invoiceId}/finalize`, { finalizedBy: user._id });
      setMessage({ type: 'success', text: 'Invoice finalized' });
      setTimeout(() => setMessage(null), 2500);
      loadInvoice();
    } catch (e) {
      setMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to finalize' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setGeneratePDFLoading(true);
      const res = await axiosInstance.get(`/billing/${invoiceId}/print`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice.invoiceNumber || invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to generate PDF' });
    } finally {
      setGeneratePDFLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    const amount = prompt('Enter payment amount:');
    if (!amount || isNaN(amount)) return;
    try {
      setMessage({ type: 'loading', text: 'Recording payment...' });
      await axiosInstance.put(`/billing/${invoiceId}/pay`, { amount: parseFloat(amount), method: 'cash' });
      setMessage({ type: 'success', text: 'Payment recorded' });
      setTimeout(() => setMessage(null), 2500);
      loadInvoice();
    } catch (e) {
      setMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to record payment' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
          <button onClick={loadInvoice} className="mt-2 text-red-700 underline">Retry</button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return <div className="p-6 text-center text-gray-500">Invoice not found</div>;
  }

  const isFinalized = invoice.status === 'paid' || invoice.status === 'finalized';
  const canEdit = !isFinalized && (user?.role === 'admin' || user?.role === 'finance');

  // Group items by category
  const groupedItems = {};
  (invoice.lineItems || []).forEach(item => {
    const cat = item.category || 'Other';
    if (!groupedItems[cat]) groupedItems[cat] = [];
    groupedItems[cat].push(item);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-50 bg-white shadow-md border-b p-4 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Invoice #{invoice.invoiceNumber || invoiceId}</h1>
            <p className="text-sm text-gray-500 mt-1">Patient: {invoice.patient?.user?.name || '-'}</p>
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            {canEdit && (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-2 rounded text-sm font-semibold transition ${
                    isEditing
                      ? 'bg-gray-500 text-white'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
                {isEditing && (
                  <button
                    onClick={handleSaveLineItems}
                    className="px-3 py-2 bg-green-500 text-white rounded text-sm font-semibold hover:bg-green-600"
                  >
                    Save
                  </button>
                )}
                {!isFinalized && (
                  <button
                    onClick={handleFinalize}
                    className="px-3 py-2 bg-orange-500 text-white rounded text-sm font-semibold hover:bg-orange-600"
                  >
                    Finalize
                  </button>
                )}
              </>
            )}
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-indigo-500 text-white rounded text-sm font-semibold hover:bg-indigo-600"
            >
              🖨️ Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={generatePDFLoading}
              className="px-3 py-2 bg-red-500 text-white rounded text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
            >
              {generatePDFLoading ? 'Generating...' : '📄 PDF'}
            </button>
            {invoice.status !== 'paid' && invoice.status !== 'finalized' && (
              <button
                onClick={handleRecordPayment}
                className="px-3 py-2 bg-purple-500 text-white rounded text-sm font-semibold hover:bg-purple-600"
              >
                💳 Record Payment
              </button>
            )}
          </div>

          {message && (
            <div className={`w-full px-4 py-2 rounded text-sm font-semibold text-center ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : message.type === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {message.text}
            </div>
          )}
        </div>
      </div>

      {/* Printable invoice */}
      <div className="p-4 md:p-8 max-w-7xl mx-auto" ref={printRef}>
        <div className="bg-white rounded-lg shadow-lg print:shadow-none p-6 md:p-8">
          {/* Header */}
          <div className="border-b-4 border-gray-800 pb-6 mb-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">LADNAN HOSPITAL WAJIR</h1>
            <p className="text-sm text-gray-600">WAJIR TOWN | Phone: 0722307496/0723967507 | www.ladnan.org</p>
            <p className="text-xs text-gray-500 mt-2">415 WAJIR</p>
            <h2 className="text-xl font-bold text-gray-900 mt-4">INVOICE</h2>
          </div>

          {/* Invoice details header */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase mb-2">Invoice No.</p>
              <p className="text-lg font-bold text-gray-900">LHW.{String(invoice.invoiceNumber || '').padStart(5, '0')}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase mb-2">Date</p>
              <p className="text-base text-gray-900">{new Date(invoice.createdAt).toLocaleDateString('en-GB')}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-700 uppercase mb-2">Status</p>
              <p className={`text-base font-bold ${
                invoice.status === 'paid'
                  ? 'text-green-700'
                  : invoice.status === 'finalized'
                  ? 'text-orange-700'
                  : 'text-yellow-700'
              }`}>
                {invoice.status?.toUpperCase() || 'PENDING'}
              </p>
            </div>
          </div>

          {/* Patient info */}
          <div className="grid grid-cols-2 gap-8 mb-8 pb-6 border-b">
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase mb-2">Bill To</p>
              <p className="font-bold text-lg text-gray-900">{invoice.patient?.user?.name || invoice.patientInfo?.name || '-'}</p>
              <p className="text-sm text-gray-600 mt-1">Member No: {invoice.patient?.hospitalId || invoice.patientInfo?.hospitalId || '-'}</p>
              <p className="text-sm text-gray-600">MRN: {invoice.patient?.mrn || invoice.patientInfo?.mrn || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase mb-2">Invoice To</p>
              <p className="font-bold text-lg text-gray-900">{invoice.patientInfo?.insurance || 'JUBILEE INSURANCE LTD'}</p>
            </div>
          </div>

          {/* Line items table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="text-left py-3 px-2 text-xs font-bold uppercase text-gray-900">Date</th>
                  <th className="text-left py-3 px-2 text-xs font-bold uppercase text-gray-900">Description</th>
                  <th className="text-center py-3 px-2 text-xs font-bold uppercase text-gray-900">Qty</th>
                  <th className="text-right py-3 px-2 text-xs font-bold uppercase text-gray-900">Price</th>
                  <th className="text-right py-3 px-2 text-xs font-bold uppercase text-gray-900">Total</th>
                  <th className="text-right py-3 px-2 text-xs font-bold uppercase text-gray-900">Less</th>
                  <th className="text-right py-3 px-2 text-xs font-bold uppercase text-gray-900">Payable</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedItems).map(([category, items]) => (
                  <React.Fragment key={category}>
                    {/* Category header */}
                    <tr className="bg-gray-100">
                      <td colSpan="7" className="py-2 px-2 font-bold text-sm text-gray-900 uppercase">
                        {category}
                      </td>
                    </tr>
                    {/* Items in category */}
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-2 text-sm text-gray-700">
                          {item.date ? new Date(item.date).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-700">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedItems[invoice.lineItems.indexOf(item)]?.description || ''}
                              onChange={(e) => handleEditLineItem(invoice.lineItems.indexOf(item), 'description', e.target.value)}
                              className="w-full border rounded px-2 py-1"
                            />
                          ) : (
                            item.description
                          )}
                        </td>
                        <td className="py-3 px-2 text-sm text-center text-gray-700">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editedItems[invoice.lineItems.indexOf(item)]?.qty || 1}
                              onChange={(e) => handleEditLineItem(invoice.lineItems.indexOf(item), 'qty', parseInt(e.target.value))}
                              className="w-16 border rounded px-2 py-1 text-center"
                            />
                          ) : (
                            item.qty || 1
                          )}
                        </td>
                        <td className="py-3 px-2 text-sm text-right text-gray-700">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editedItems[invoice.lineItems.indexOf(item)]?.price || 0}
                              onChange={(e) => handleEditLineItem(invoice.lineItems.indexOf(item), 'price', parseFloat(e.target.value))}
                              className="w-24 border rounded px-2 py-1 text-right"
                            />
                          ) : (
                            `Ksh ${(item.price || 0).toLocaleString()}`
                          )}
                        </td>
                        <td className="py-3 px-2 text-sm text-right text-gray-700 font-semibold">
                          Ksh {((item.amount || 0) * (item.qty || 1)).toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-sm text-right text-gray-700">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editedItems[invoice.lineItems.indexOf(item)]?.less || 0}
                              onChange={(e) => handleEditLineItem(invoice.lineItems.indexOf(item), 'less', parseFloat(e.target.value))}
                              className="w-20 border rounded px-2 py-1 text-right"
                            />
                          ) : (
                            `Ksh ${(item.less || 0).toLocaleString()}`
                          )}
                        </td>
                        <td className="py-3 px-2 text-sm text-right text-gray-700 font-bold">
                          Ksh {(((item.amount || 0) * (item.qty || 1)) - (item.less || 0)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-3 border-b-2 border-gray-300">
                <span className="font-bold text-gray-900">Subtotal</span>
                <span className="font-semibold">Ksh {(invoice.subtotal || invoice.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 border-b-2 border-gray-300">
                <span className="font-bold text-gray-900">Less (Discount)</span>
                <span className="font-semibold">Ksh {(invoice.discount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 text-lg">
                <span className="font-bold text-gray-900">Total Payable</span>
                <span className="font-bold text-teal-700">Ksh {(invoice.totalPayable || (invoice.subtotal - (invoice.discount || 0)) || 0).toLocaleString()}</span>
              </div>
              {invoice.amountPaid > 0 && (
                <div className="flex justify-between py-2 text-sm border-t mt-2">
                  <span className="text-gray-700">Amount Paid</span>
                  <span className="text-green-700 font-semibold">Ksh {(invoice.amountPaid || 0).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Signature section */}
          <div className="grid grid-cols-2 gap-16 mt-12 pt-8 border-t border-gray-300">
            <div>
              <div className="border-b border-gray-800 mb-2" style={{ height: '60px' }}></div>
              <p className="text-sm text-gray-700 font-semibold">Prepared By</p>
              <p className="text-xs text-gray-500">Name/Date</p>
            </div>
            <div>
              <div className="border-b border-gray-800 mb-2" style={{ height: '60px' }}></div>
              <p className="text-sm text-gray-700 font-semibold">Approved By</p>
              <p className="text-xs text-gray-500">Name/Date</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          @page {
            margin: 0.5in;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
