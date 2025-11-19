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
        <h1 className="text-3xl font-bold mb-6 text-center">Invoice</h1>

        <section className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold text-gray-700">Invoice Number</p>
            <p>{invoice.invoiceNumber}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Invoice Date</p>
            <p>{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Patient Name</p>
            <p>{invoice.patientName}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Patient ID</p>
            <p>{invoice.patientId}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Doctor</p>
            <p>{invoice.doctorName}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Payment Status</p>
            <p>{invoice.paymentStatus}</p>
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