import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const InvoicePage = () => {
  const { id } = useParams(); // Patient ID
  const { axiosInstance } = useContext(AuthContext);
  const [invoiceData, setInvoiceData] = useState(null);
  const [hospitalDetails, setHospitalDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id || !axiosInstance) return;
      try {
        const response = await axiosInstance.get(`/billing/patient/${id}`);
        setInvoiceData(response.data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchSettings = async () => {
        if (!axiosInstance) return;
        try {
            const response = await axiosInstance.get('/setting/hospitalDetails');
            setHospitalDetails(response.data);
        } catch (err) {
            console.error("Failed to fetch hospital details", err);
        }
    };

    const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchInvoice(), fetchSettings()]);
        setLoading(false);
    }

    loadData();
  }, [id, axiosInstance]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center">Generating Invoice...</div>;
  if (!invoiceData) return <div className="p-8 text-center text-red-500">No invoice found for this patient.</div>;

  // Calculate Total
  const subtotal = invoiceData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.10; // Assuming 10% tax
  const total = subtotal + tax;

  return (
    <div className="max-w-4xl mx-auto my-8 p-8 border border-gray-200 bg-white font-sans">
      <header className="flex justify-between border-b-2 border-gray-800 pb-4 mb-8">
        <div className="hospital-info">
          <h1 className="text-3xl font-bold">{hospitalDetails?.name || 'City General Hospital'}</h1>
          <p>{hospitalDetails?.address || '123 Health St, Medtown'}</p>
          <p>{hospitalDetails?.phone || 'Ph: +1-555-0199'}</p>
        </div>
        <div className="invoice-meta text-right">
          <h2 className="text-3xl font-bold">INVOICE</h2>
          <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Invoice #:</strong> {invoiceData.invoiceId}</p>
        </div>
      </header>

      <section className="mb-8">
        <strong className="block mb-2">Bill To:</strong>
        <p>{invoiceData.patientName}</p>
        <p>ID: {invoiceData.patientId}</p>
        <p>{invoiceData.address}</p>
      </section>

      <table className="w-full border-collapse mb-8">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 text-left">Service / Description</th>
            <th className="border p-2 text-left">Quantity</th>
            <th className="border p-2 text-left">Unit Price</th>
            <th className="border p-2 text-left">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoiceData.items.map((item, index) => (
            <tr key={index}>
              <td className="border p-2">{item.description}</td>
              <td className="border p-2">{item.quantity}</td>
              <td className="border p-2">${item.price.toFixed(2)}</td>
              <td className="border p-2">${(item.quantity * item.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right">
        <div className="flex justify-end gap-8 mb-1">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-end gap-8 mb-2">
          <span>Tax (10%):</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-end gap-8 font-bold text-xl border-t border-gray-800 pt-2">
          <span>Total Amount:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <footer className="mt-8 text-center print:hidden">
        <button onClick={handlePrint} className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700">Print Invoice</button>
      </footer>
    </div>
  );
};

export default InvoicePage;
