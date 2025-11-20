import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { Icons } from '../../components/Icons';
import useHospitalDetails from '../../hooks/useHospitalDetails';

const InvoicePage = () => {
  const { id } = useParams(); // This is the patient ID from the route /patients/:id/invoice
  const { axiosInstance } = useContext(AuthContext);
  const { hospitalDetails, loading: hospitalDetailsLoading } = useHospitalDetails();
  
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id || !axiosInstance) return;
      try {
        // This endpoint returns a consolidated invoice for a patient, including all charges.
        const response = await axiosInstance.get(`/billing/patient/${id}`);
        setInvoiceData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch invoice:", err);
        setError(err.response?.data?.message || 'Failed to load invoice data.');
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, axiosInstance]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || hospitalDetailsLoading) return <div className="text-center p-8 animate-pulse">Generating Invoice...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!invoiceData) return <div className="text-center p-8">No invoice found for this patient.</div>;

  const { patientName, patientId, address, items, subtotal, tax, total, invoiceId } = invoiceData;

  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'Miscellaneous';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  const currencyFormatter = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' });

  return (
    <div className="bg-gray-50 min-h-screen" id="invoice-page">
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        <div className="bg-white shadow-2xl rounded-xl" id="printable-area">
          <div className="p-8 sm:p-12">
            <header className="flex justify-between items-start pb-8 border-b border-gray-200">
              <div className="hospital-info bg-gray-100 p-4 rounded-lg border border-gray-200">
                {hospitalDetails.hospitalLogoUrl && (
                  <img src={hospitalDetails.hospitalLogoUrl} alt="Hospital Logo" className="h-16 mb-2 object-contain" />
                )}
                <h1 className="text-3xl font-bold text-teal-600">{hospitalDetails.hospitalName || 'CoreCare HMIS'}</h1>
                <p className="text-gray-600">Address:{hospitalDetails.hospitalAddress || ' '}</p>
                <p className="text-gray-600">Contact:{hospitalDetails.hospitalContact || 'Ph: +254 722 651 888'}</p>
              </div>
              <div className="invoice-meta text-right">
                <h2 className="text-4xl font-bold text-gray-700">INVOICE</h2>
                <p className="text-gray-500"><strong className="text-gray-600">Date:</strong> {new Date().toLocaleDateString()}</p>
                <p className="text-gray-500"><strong className="text-gray-600">Invoice #:</strong> {invoiceId || `N/A`}</p>
              </div>
            </header>

            <section className="patient-info mt-8">
              <strong className="text-gray-600 font-semibold">Bill To:</strong>
              <p className="text-xl font-bold text-gray-800">{patientName || 'N/A'}</p>
              <p className="text-gray-600">Patient ID: {patientId || id}</p>
              <p className="text-gray-600">{address || 'Address not available'}</p>
            </section>

            <div className="mt-10 overflow-x-auto">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2 pl-6 bg-gray-100 py-2">{category}</h3>
                  <table className="w-full invoice-table">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{currencyFormatter.format(item.price)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold text-right">{currencyFormatter.format(item.quantity * item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-8">
              <div className="w-full max-w-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-800 font-semibold">{currencyFormatter.format(subtotal)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Tax (10%):</span>
                  <span className="text-gray-800 font-semibold">{currencyFormatter.format(tax)}</span>
                </div>
                <div className="flex justify-between py-4 text-teal-600">
                  <span className="text-xl font-bold">Total Amount:</span>
                  <span className="text-xl font-bold">{currencyFormatter.format(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <footer className="mt-8 text-center no-print">
            <button onClick={handlePrint} className="bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 inline-flex items-center">
              <Icons.PrintIcon className="w-5 h-5 mr-2" />
              Print Invoice
            </button>
        </footer>
      </div>
      <style jsx global>{`
        @media print {
          .no-print { display: none; }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #invoice-page {
            padding: 0;
          }
          #printable-area {
            box-shadow: none;
            margin: 0;
            max-width: 100%;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoicePage;