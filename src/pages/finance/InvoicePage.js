import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { FaPrint, FaDownload } from 'react-icons/fa';
import useHospitalDetails from '../../hooks/useHospitalDetails';

const InvoicePage = () => {
  const { id } = useParams(); // This is the patient ID
  const { axiosInstance } = useContext(AuthContext);
  const { hospitalDetails, loading: hospitalDetailsLoading } = useHospitalDetails();
  
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id || !axiosInstance) return;
      try {
        const response = await axiosInstance.get(`/billing/patient/${id}`);
        setInvoiceData(response.data);
      } catch (err) {
        console.error("Failed to fetch invoice:", err);
        setError(err.response?.data?.message || 'Failed to load invoice data.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, axiosInstance]);

  const handlePrint = () => window.print();

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

  if (loading || hospitalDetailsLoading) return <div className="text-center p-8 animate-pulse">Generating Invoice...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!invoiceData) return <div className="text-center p-8">No invoice found for this patient.</div>;

  const { patientName, patientId, address, items, subtotal, tax, total, invoiceId } = invoiceData;
  const currencyFormatter = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' });

  return (
    <div className="bg-gray-100 font-sans" id="invoice-page">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-end items-center gap-2 mb-4 no-print">
          <button onClick={handleGeneratePdf} disabled={pdfLoading} className="btn-modern-outline text-sm">
            <FaDownload className="mr-2" />
            {pdfLoading ? 'Generating...' : 'Download'}
          </button>
          <button onClick={handlePrint} className="btn-modern-outline text-sm">
            <FaPrint className="mr-2" />
            Print
          </button>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-8" id="printable-area">
          <header className="flex justify-between items-start pb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">INVOICE</h1>
              <div className="mt-4 text-sm text-gray-600">
                <p><span className="font-bold">INVOICE NUMBER:</span> {invoiceId || 'N/A'}</p>
                <p><span className="font-bold">DATE OF ISSUE:</span> {new Date().toLocaleDateString()}</p>
                <p><span className="font-bold">PATIENT ID:</span> {patientId || id}</p>
              </div>
            </div>
            <div className="text-right">
              {hospitalDetails.hospitalLogoUrl && (
                <img src={hospitalDetails.hospitalLogoUrl} alt="Hospital Logo" className="h-16 w-auto ml-auto mb-2" />
              )}
              <h2 className="text-lg font-bold">{hospitalDetails.hospitalName}</h2>
              <p className="text-xs text-gray-500">{hospitalDetails.hospitalAddress}</p>
              <p className="text-xs text-gray-500">{hospitalDetails.hospitalContact}</p>
            </div>
          </header>

          <section className="grid grid-cols-2 gap-8 mt-8 border-t pt-6">
            <div>
              <h3 className="text-sm font-bold text-gray-600 uppercase">BILLED TO</h3>
              <p className="text-lg font-semibold text-gray-800">{patientName || 'N/A'}</p>
              <p className="text-sm text-gray-500">{address || 'Address not available'}</p>
            </div>
          </section>

          <main className="mt-8">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold uppercase">Description</th>
                  <th className="p-3 text-right text-sm font-semibold uppercase">Quantity</th>
                  <th className="p-3 text-right text-sm font-semibold uppercase">Unit Price</th>
                  <th className="p-3 text-right text-sm font-semibold uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3 text-sm">{item.description}</td>
                    <td className="p-3 text-sm text-right">{item.quantity}</td>
                    <td className="p-3 text-sm text-right">{currencyFormatter.format(item.price)}</td>
                    <td className="p-3 text-sm text-right font-semibold">{currencyFormatter.format(item.quantity * item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </main>

          <section className="flex justify-end mt-6">
            <div className="w-full max-w-xs text-sm">
              <div className="flex justify-between p-2">
                <span className="font-semibold text-gray-600">Subtotal</span>
                <span>{currencyFormatter.format(subtotal)}</span>
              </div>
              <div className="flex justify-between p-2">
                <span className="font-semibold text-gray-600">Tax</span>
                <span>{currencyFormatter.format(tax)}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-100 rounded-md mt-2">
                <span className="font-bold text-base">TOTAL</span>
                <span className="font-bold text-base">{currencyFormatter.format(total)}</span>
              </div>
            </div>
          </section>

          <footer className="border-t mt-12 pt-6 text-xs text-gray-500">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-gray-600 mb-1">NOTES</h4>
                <p>Please make all payments to the hospital's finance office.</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-600 mb-1">TERMS & CONDITIONS</h4>
                <p>Payment is due within 30 days. A late fee will be charged on overdue balances.</p>
              </div>
            </div>
            <p className="text-center mt-8">CoreCare HMIS | +254722651888</p>
          </footer>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          .no-print { display: none; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #invoice-page { padding: 0; }
          #printable-area { box-shadow: none; margin: 0; max-width: 100%; border-radius: 0; }
        }
      `}</style>
    </div>
  );
};

export default InvoicePage;
