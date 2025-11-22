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

  // Invoice items (read-only here). Charge selection is done on Discharge page.
  const [itemsState, setItemsState] = useState([]);
  const [wardLabel, setWardLabel] = useState(null);
  const [bedLabel, setBedLabel] = useState(null);
  const [roomLabel, setRoomLabel] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id || !axiosInstance) return;
      try {
        const response = await axiosInstance.get(`/billing/patient/${id}`);
        setInvoiceData(response.data);
        setItemsState(response.data.items || []);

        // Try to resolve ward/bed labels if present
        const admission = response.data.admissionInfo || response.data.admission || {};
        const wardId = admission.ward;
        const bedId = admission.bed;

        const resolveWard = async () => {
          if (!wardId) return;
          if (typeof wardId === 'object') {
            const name = wardId.name || wardId.label || wardId.wardName || wardId.title;
            if (name) return setWardLabel(name);
          }
          const endpoints = [`/wards/${wardId}`, `/wards?id=${wardId}`, `/wards?wardId=${wardId}`];
          for (const ep of endpoints) {
            try {
              const r = await axiosInstance.get(ep);
              const d = r.data;
              const candidate = d?.name || d?.label || (Array.isArray(d) && d[0] && (d[0].name || d[0].label)) || d?.ward?.name;
              if (candidate) {
                setWardLabel(candidate);
                return;
              }
            } catch (e) {}
          }
          // fallback: fetch list and find matching id
          try {
            const listRes = await axiosInstance.get('/wards').catch(()=>({ data: [] }));
            const list = Array.isArray(listRes.data) ? listRes.data : (listRes.data?.wards || []);
            const found = list.find(item => String(item._id) === String(wardId) || String(item.id) === String(wardId));
            if (found) setWardLabel(found.name || found.label || found.wardName || null);
          } catch(e) { /* ignore */ }
        };
        const resolveBed = async () => {
          if (!bedId) return;
          if (typeof bedId === 'object') {
            const name = bedId.name || bedId.label || bedId.number || bedId.bedNo || bedId.code;
            if (name) return setBedLabel(name);
          }
          const endpoints = [`/beds/${bedId}`, `/rooms/${bedId}`, `/beds?id=${bedId}`, `/rooms?id=${bedId}`];
          for (const ep of endpoints) {
            try {
              const r = await axiosInstance.get(ep);
              const d = r.data;
              const candidate = d?.number || d?.name || d?.label || (Array.isArray(d) && d[0] && (d[0].number || d[0].name)) || d?.bed?.number;
              if (candidate) {
                setBedLabel(candidate);
                return;
              }
            } catch (e) {}
          }
          // fallback: fetch list and find matching id
          try {
            const listRes = await axiosInstance.get('/beds').catch(()=>({ data: [] }));
            const list = Array.isArray(listRes.data) ? listRes.data : (listRes.data?.beds || []);
            const found = list.find(item => String(item._id) === String(bedId) || String(item.id) === String(bedId) || String(item.number) === String(bedId));
            if (found) setBedLabel(found.number || found.name || found.label || null);
          } catch(e) { /* ignore */ }
        };
        const resolveRoom = async () => {
          // try to resolve a room label if present on admission
          const roomId = response.data.admissionInfo?.room || response.data.admission?.room;
          if (!roomId) return;
          if (typeof roomId === 'object') {
            const name = roomId.name || roomId.number || roomId.label || roomId.roomNo || roomId.code;
            if (name) return setRoomLabel(name);
          }
          const endpoints = [`/rooms/${roomId}`, `/rooms?id=${roomId}`, `/rooms?roomId=${roomId}`];
          for (const ep of endpoints) {
            try {
              const r = await axiosInstance.get(ep);
              const d = r.data;
              const candidate = d?.number || d?.name || d?.label || (Array.isArray(d) && d[0] && (d[0].number || d[0].name)) || d?.room?.number;
              if (candidate) {
                setRoomLabel(candidate);
                return;
              }
            } catch (e) {}
          }
          // fallback: fetch list and find matching id
          try {
            const listRes = await axiosInstance.get('/rooms').catch(()=>({ data: [] }));
            const list = Array.isArray(listRes.data) ? listRes.data : (listRes.data?.rooms || []);
            const found = list.find(item => String(item._id) === String(roomId) || String(item.id) === String(roomId) || String(item.number) === String(roomId));
            if (found) setRoomLabel(found.number || found.name || found.label || null);
          } catch(e) { /* ignore */ }
        };
        resolveWard();
        resolveBed();
        resolveRoom();
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
        <div className="flex justify-end items-center gap-2 mb-4 no-print">
          <div className="text-sm text-gray-600 mr-3">Select charges on the Discharge page to update this invoice.</div>
          <button onClick={handleGeneratePdf} disabled={pdfLoading} className="btn-modern-outline text-sm">
            <FaDownload className="mr-2" />
            {pdfLoading ? 'Generating...' : 'Download'}
          </button>
          <button onClick={handlePrint} className="btn-modern-outline text-sm">
            <FaPrint className="mr-2" />
            Print
          </button>
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
              <div className="text-xs">: {invoiceData.admissionInfo?.dischargedAt ? new Date(invoiceData.admissionInfo.dischargedAt).toLocaleString() : '................................'}</div>
              <div className="font-bold text-xs pr-2">MRN. No</div>
              <div className="text-xs">: {invoiceData.patientInfo?.mrn || '................................'}</div>
              <div className="font-bold text-xs pr-2">Age / Gender</div>
              <div className="text-xs">: {(invoiceData.patientInfo?.age || '') + ' / ' + (invoiceData.patientInfo?.gender || '')}</div>
              {/* <div className="font-bold text-xs pr-2">Room Type</div>
              <div className="text-xs">: {wardLabel || (typeof invoiceData.admissionInfo?.ward === 'string' ? invoiceData.admissionInfo?.ward : (invoiceData.admissionInfo?.ward?.name || invoiceData.admissionInfo?.ward || '................................'))}</div> */}
              <div className="font-bold text-xs pr-2">Ward / Room / Bed</div>
              <div className="text-xs">: {(() => {
                const wardVal = wardLabel || (typeof invoiceData.admissionInfo?.ward === 'string' ? invoiceData.admissionInfo?.ward : (invoiceData.admissionInfo?.ward?.name || invoiceData.admissionInfo?.ward));
                const roomVal = roomLabel || (typeof invoiceData.admissionInfo?.room === 'string' ? invoiceData.admissionInfo?.room : (invoiceData.admissionInfo?.room?.number || invoiceData.admissionInfo?.room));
                const bedVal = bedLabel || (typeof invoiceData.admissionInfo?.bed === 'string' ? invoiceData.admissionInfo?.bed : (invoiceData.admissionInfo?.bed?.number || invoiceData.admissionInfo?.bed));
                const parts = [wardVal, roomVal, bedVal].filter(p => p && String(p).trim() !== '');
                return parts.length ? parts.join(' / ') : '................................';
              })()}</div>
              <div className="font-bold text-xs pr-2">SERVED BY</div>
              <div className="text-xs">: {invoiceData.dischargingDoctorName || '................................'}</div>
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
