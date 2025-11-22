import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function Invoice({ invoiceId }) {
  const [invoice, setInvoice] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    if (!invoiceId) return;
    axios
      .get(`http://localhost:5000/api/invoices/${invoiceId}`)
      .then((res) => {
        setInvoice(res.data);
      })
      .catch((err) => {
        console.error("Failed to load invoice:", err);
      });
  }, [invoiceId]);

  const printInvoice = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  if (!invoice) {
    return (
      <div className="p-4 text-center text-gray-600">Loading invoice...</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded mt-6 font-sans">

      <div ref={printRef}>
        {/* Header structure matching DetailedDischargeSummary */}
        <header className="text-center mb-4">
          <img src={invoice.hospitalInfo?.hospitalLogoUrl || '/logo1.png'} alt="Hospital Logo" className="h-20 w-auto mx-auto mb-4" />
          <h1 className="text-xl font-bold">{invoice.hospitalInfo?.hospitalName || 'CoreCare'}</h1>
          <p className="text-xs">{invoice.hospitalInfo?.hospitalAddress || 'P.O. Box 20723, Nairobi, Kenya'}</p>
          <p className="text-xs">{invoice.hospitalInfo?.hospitalContact || 'Tel: 0722651888 | Web: www.manderasoft.co.ke'}</p>
          <h2 className="text-base font-bold mt-4 border-y-2 border-black py-1">
            INVOICE
          </h2>
        </header>

        {/* Patient/Invoice Info Section (bordered) */}
        <section className="border-2 border-black p-2 mb-6">
          <div className="grid grid-cols-[max-content_1fr_max-content_1fr] gap-x-4 gap-y-1">
            <div className="font-bold text-xs pr-2">Invoice Number</div>
            <div className="text-xs">: {invoice.invoiceNumber || '................................'}</div>
            <div className="font-bold text-xs pr-2">Invoice Date</div>
            <div className="text-xs">: {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleString() : '................................'}</div>
            <div className="font-bold text-xs pr-2">Patient Name</div>
            <div className="text-xs">: {invoice.patientName || '................................'}</div>
            <div className="font-bold text-xs pr-2">Patient ID</div>
            <div className="text-xs">: {invoice.patientId || '................................'}</div>
            <div className="font-bold text-xs pr-2">Doctor</div>
            <div className="text-xs">: {invoice.doctorName || '................................'}</div>
            <div className="font-bold text-xs pr-2">Payment Status</div>
            <div className="text-xs">: {invoice.paymentStatus || '................................'}</div>
          </div>
        </section>

        <table className="w-full border border-gray-300 mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-2 text-left">Description</th>
              <th className="border border-gray-300 p-2 text-right">Quantity</th>
              <th className="border border-gray-300 p-2 text-right">Unit Price</th>
              <th className="border border-gray-300 p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i}>
                <td className="border border-gray-300 p-2">{item.description}</td>
                <td className="border border-gray-300 p-2 text-right">{item.quantity}</td>
                <td className="border border-gray-300 p-2 text-right">${item.unitPrice.toFixed(2)}</td>
                <td className="border border-gray-300 p-2 text-right">${(item.quantity * item.unitPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end space-x-6 text-lg font-semibold">
          <div>
            <p>Subtotal: ${invoice.subtotal.toFixed(2)}</p>
            <p>Tax: ${invoice.tax.toFixed(2)}</p>
            <p className="border-t border-gray-400 pt-2">Total: ${invoice.total.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={printInvoice}
          className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition"
          type="button"
        >
          Print Invoice
        </button>
      </div>
    </div>
  );
}