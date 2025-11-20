import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { Icons } from '../../components/Icons';

const InvoicePage = () => {
  const { id } = useParams(); // This could be an invoice ID or a patient ID depending on the route
  const { axiosInstance } = useContext(AuthContext);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id || !axiosInstance) return;
      try {
        // Assuming the route is set up to fetch the consolidated invoice by patient ID
        const response = await axiosInstance.get(`/billing/patient/${id}`);
        setInvoiceData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch invoice:", err);
        setError('Failed to load invoice data.');
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, axiosInstance]);

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePdf = async () => {
    if (!invoiceData?.invoiceId) return;
    setPdfLoading(true);
    try {
      const res = await axiosInstance.get(`/billing/${invoiceData.invoiceId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceData.invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      setError('Failed to generate PDF. Please try again.');
      console.error(e);
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return <div className="text-center p-8">Generating Invoice...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!invoiceData) return <div className="text-center p-8">No invoice found.</div>;

  const { patient, items, subtotal, tax, total } = invoiceData;

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-lg">
        {/* --- ACTIONS BAR --- */}
        <div className="p-4 border-b border-gray-200 flex justify-end items-center gap-2 no-print">
            <button onClick={handleGeneratePdf} disabled={pdfLoading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 inline-flex items-center">
                {pdfLoading ? 'Generating...' : 'Download PDF'}
            </button>
            <button onClick={handlePrint} className="bg-teal-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 inline-flex items-center">
                <Icons.Print className="w-5 h-5 mr-2" />
                Print Invoice
            </button>
        </div>
        <div className="p-8 sm:p-12">
          <header className="flex justify-between items-start pb-8 border-b border-gray-200">
            <div className="hospital-info">
              <h1 className="text-3xl font-bold text-teal-600">Genz Community Hospital</h1>
              <p className="text-gray-600">123 Health St, Medtown, Kajiado</p>
              <p className="text-gray-600">Ph: +254 722 651 888</p>
            </div>
            <div className="invoice-meta text-right">
              <h2 className="text-4xl font-bold text-gray-700">INVOICE</h2>
              <p className="text-gray-500"><strong className="text-gray-600">Date:</strong> {new Date().toLocaleDateString()}</p>
              <p className="text-gray-500"><strong className="text-gray-600">Invoice #:</strong> {invoiceData.invoiceId || `INV-${id.substring(0, 8)}`}</p>
            </div>
          </header>

          <section className="patient-info mt-8">
            <strong className="text-gray-600 font-semibold">Bill To:</strong>
            <p className="text-xl font-bold text-gray-800">{patient?.name || 'N/A'}</p>
            <p className="text-gray-600">Patient ID: {patient?.id || id}</p>
            <p className="text-gray-600">{patient?.address || 'Address not available'}</p>
          </section>

          <table className="w-full mt-10 invoice-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service / Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${item.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold text-right">${(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-8">
            <div className="w-full max-w-xs">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-800 font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Tax (10%):</span>
                <span className="text-gray-800 font-semibold">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-4 text-teal-600">
                <span className="text-xl font-bold">Total Amount:</span>
                <span className="text-xl font-bold">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          .no-print { display: none; }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .invoice-container {
            box-shadow: none;
            margin: 0;
            max-width: 100%;
            border: none;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoicePage;
