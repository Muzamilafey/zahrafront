import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { FaPrint, FaDownload, FaArrowLeft } from 'react-icons/fa';
import useHospitalDetails from '../../hooks/useHospitalDetails';

const InvoicePage = () => {
  const { id } = useParams(); // This is the patient ID
  const { axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();
  const { hospitalDetails, loading: hospitalDetailsLoading } = useHospitalDetails();
  
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  // Invoice items (read-only here). Charge selection is done on Discharge page.
  const [itemsState, setItemsState] = useState([]);
  

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id || !axiosInstance) return;
      try {
        const response = await axiosInstance.get(`/billing/patient/${id}`);
        const invoice = response.data || {};
        setInvoiceData(invoice);
        setItemsState(invoice.items || []);

        
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

  // Note: invoice persistence and charge selection are handled from the Discharge page.

  if (loading || hospitalDetailsLoading) return <div className="text-center p-8 animate-pulse">Generating Invoice...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!invoiceData) return <div className="text-center p-8">No invoice found for this patient.</div>;

  const { patientName, patientId, address, invoiceId } = invoiceData;
  const currencyFormatter = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' });

  // compute subtotal / tax / total from itemsState and invoiceData settings
  const subtotal = itemsState.reduce((s, it) => s + ((it.quantity || 1) * (it.price || 0)), 0);
  const taxRate = invoiceData?.taxRate ?? null; // if server provides taxRate prefer that
  const tax = taxRate != null ? subtotal * taxRate : (invoiceData?.tax || 0);
  const total = subtotal + tax;

  return (
    <div className="bg-gray-100 font-sans" id="invoice-page">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center gap-2 mb-4 no-print">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="btn-modern-outline text-sm">
              <FaArrowLeft className="mr-2" /> Back
            </button>
            <div className="text-sm text-gray-600 ml-3">Select charges on the Discharge page to update this invoice.</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleGeneratePdf} disabled={pdfLoading} className="btn-modern-outline text-sm">
              <FaDownload className="mr-2" />
              {pdfLoading ? 'Generating...' : 'Download'}
            </button>
            <button onClick={handlePrint} className="btn-modern-outline text-sm">
              <FaPrint className="mr-2" />
              Print
            </button>
          </div>
        </div>


        <div className="bg-white p-6 border-2 border-black print:shadow-none print:border-none" id="printable-area">
          <header className="text-center mb-4">
            <img src={hospitalDetails.hospitalLogoUrl || '/logo1.png'} alt="Hospital Logo" className="h-20 w-auto mx-auto mb-4" />
            <h1 className="text-xl font-bold">{hospitalDetails.hospitalName || 'CoreCare'}</h1>
            <p className="text-xs">{hospitalDetails.hospitalAddress || 'P.O. Box 20723, Nairobi, Kenya'}</p>
            <p className="text-xs">{hospitalDetails.hospitalContact || 'Tel: 0722651888 | Web: www.manderasoft.co.ke'}</p>
            <h2 className="text-base font-bold mt-4 border-y-2 border-black py-1">
              INVOICE
            </h2>
          </header>

          <section className="border-2 border-black p-2 mb-6">
            <div className="grid grid-cols-[max-content_1fr_max-content_1fr] gap-x-4 gap-y-1">
              <div className="font-bold text-xs pr-2">Patient Name</div>
              <div className="text-xs">: {patientName || '................................'}</div>
              <div className="font-bold text-xs pr-2">Admission Date</div>
              <div className="text-xs">: {invoiceData.admissionInfo?.admittedAt ? new Date(invoiceData.admissionInfo.admittedAt).toLocaleString() : '................................'}</div>
              {/* <div className="font-bold text-xs pr-2">IP. No</div>
              <div className="text-xs">: {invoiceData.admission?.admissionIdLabel || '................................'}</div> */}
              <div className="font-bold text-xs pr-2">Discharge Date</div>
              <div className="text-xs">: {invoiceData.admissionInfo?.dischargedAt ? new Date(invoiceData.admissionInfo.dischargedAt).toLocaleString() : 'Not Discharged yet'}</div>
              <div className="font-bold text-xs pr-2">SHA. No</div>
              <div className="text-xs">: {invoiceData.nhifNumber || '................................'}</div>
              
              {/* <div className="font-bold text-xs pr-2">Room Type</div>
              <div className="text-xs">: {wardLabel || (typeof invoiceData.admissionInfo?.ward === 'string' ? invoiceData.admissionInfo?.ward : (invoiceData.admissionInfo?.ward?.name || invoiceData.admissionInfo?.ward || '................................'))}</div> */}
              <div className="font-bold text-xs pr-2">Ward / Room / Bed</div>
              <div className="text-xs">: {
                invoiceData.admissionInfo?.wardCategory === 'General' 
                ? invoiceData.admissionInfo?.bedNumber
                : [
                    invoiceData.admissionInfo?.ward?.name,
                    invoiceData.admissionInfo?.room?.number,
                    invoiceData.admissionInfo?.bed?.number
                  ].filter(Boolean).join(' / ') || '................................'
              }</div>
              
              {/* <div className="font-bold text-xs pr-2">Co-Consultant</div>
              <div className="text-xs">: {'................................'}</div> */}
            </div>
          </section>

          <main className="mt-8">
            {/* Final invoice items (combined from server and selected charges) */}
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
                {itemsState.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3 text-sm">{item.description}</td>
                    <td className="p-3 text-sm text-right">{item.quantity}</td>
                    <td className="p-3 text-sm text-right">{currencyFormatter.format(item.price)}</td>
                    <td className="p-3 text-sm text-right font-semibold">{currencyFormatter.format((item.quantity || 0) * (item.price || 0))}</td>
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
                <p>Payment is due within 30 days upon Agreement. A late fee will be charged on overdue balances.</p>
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
        @media print {
          aside, 
          div[class*="sticky"] {
            display: none !important;
          }
        
          main {
            padding: 0 !important;
          }
        
          #printable-area {
            margin: 0;
            padding: 0;
            border: none;
            box-shadow: none;
          }
        
          /* Ensure the printable area takes up the full page */
          body > #root > div > div:nth-child(2) > div:nth-child(2) {
            width: 100%;
            overflow: visible;
            display: block;
          }
        
          body > #root > div > div:nth-child(2) {
            display: block;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoicePage;
