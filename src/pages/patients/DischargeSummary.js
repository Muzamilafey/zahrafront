import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// This page shows a richer Discharge Summary + Invoice editor + print/export
// Converted from TSX to plain JS and adapted to the frontend.



const InfoField = ({ label, value }) => (
  <div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-md text-gray-800">{value}</p>
  </div>
);

const EditableField = ({ label, value, name, onChange, rows = 4 }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
    />
  </div>
);

export default function DischargeSummary() {
  // Local demo: if you want to hook this up to the real backend, replace
  // the mocked fetch with axios calls and map fields accordingly.
  const [patient, setPatient] = useState(null);
  const [invoice, setInvoice] = useState({ dailyBedCharge: 0, labTests: [], drugs: [], doctorFee: 0, nursingFee: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { id: routePatientId } = useParams();
  const { axiosInstance } = useContext(AuthContext);

  // Replace mock fetch with real API calls
  useEffect(() => {
    const loadDischargeSummary = async () => {
      setLoading(true);
      setError(null);
      setPatient(null);
      setInvoice(null);

      try {
        const response = await axiosInstance.get(`/discharge/patient/${routePatientId}/latest`);
        const summary = response.data;

        const patientData = {
          patientName: summary.patient?.user?.name || summary.patientInfo?.name,
          patientId: summary.patient?.mrn || summary.patientInfo?.mrn,
          age: summary.patient?.age || summary.patientInfo?.age,
          gender: summary.patient?.gender || summary.patientInfo?.gender,
          diagnosis: summary.diagnosis?.primary,
          ward: summary.admissionInfo?.ward,
          dateAdmitted: summary.admissionInfo?.admittedAt,
          dateDischarged: summary.admissionInfo?.dischargedAt,
          treatingDoctor: summary.dischargingDoctorName,
          treatmentSummary: summary.hospitalStaySummary,
          dischargeMedication: (summary.medicationsOnDischarge || []).map(m => `${m.name} ${m.dosage || ''} ${m.frequency || ''}`).join('\n'),
          additionalNotes: summary.dischargeNotes || summary.instructionsToPatient || ''
        };
        setPatient(patientData);

        if (summary.invoice) {
            // The backend now provides a consolidated invoice
            setInvoice(summary.invoice);
        } else {
            setInvoice({ items: [], subtotal: 0, tax: 0, total: 0 });
        }

      } catch (err) {
        if (err.response && err.response.status === 404) {
            setError('No discharge summary found for this patient.');
        } else {
            setError(err.response?.data?.message || 'Failed to load discharge data.');
        }
        console.error('Failed to load discharge info', err);
      } finally {
        setLoading(false);
      }
    };

    if (routePatientId) {
      loadDischargeSummary();
    }
  }, [routePatientId, axiosInstance]);

  // Effect to handle print events for the overlay
  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    const printableArea = document.getElementById('printable-area');
    if (!printableArea) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(printableArea, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Discharge-Summary-${patient?.patientId || 'patient'}.pdf`);

    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Sorry, there was an error generating the PDF.');
    } finally {
      setIsExporting(false);
    }
  };



  if (loading) return <div className="flex items-center justify-center h-screen"><p className="text-xl">Loading Patient Record...</p></div>;
  if (error) return <div className="flex items-center justify-center h-screen"><p className="text-xl text-red-500">{error}</p></div>;
  // Render as soon as we have patient data. Invoice may be empty/default — render anyway.
  if (!patient) return null;

  const currencyFormatter = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' });

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {(isPrinting || isExporting) && (
        <div className="no-print fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl animate-pulse">
            <p className="text-xl font-semibold text-gray-700">
              {isPrinting ? 'Preparing to print...' : 'Generating PDF...'}
            </p>
          </div>
        </div>
      )}

      <header className="no-print flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Patient Discharge & Invoice</h1>
        <div className="flex items-center space-x-2">
          <button onClick={handleExportPDF} disabled={isExporting} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-green-700 transition duration-300 disabled:bg-gray-400">
            {isExporting ? 'Exporting...' : 'Export as PDF'}
          </button>
          <button onClick={handlePrint} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-indigo-700 transition duration-300">Print</button>
        </div>
      </header>

      <main id="printable-area" className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 border-b pb-2">Discharge Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoField label="Patient Name" value={patient.patientName} />
              <InfoField label="Patient ID" value={patient.patientId} />
              <InfoField label="Age" value={patient.age} />
              <InfoField label="Gender" value={patient.gender} />
              <InfoField label="Ward" value={patient.ward} />
              <InfoField label="Treating Doctor" value={patient.treatingDoctor} />
              <InfoField label="Date Admitted" value={patient.dateAdmitted ? new Date(patient.dateAdmitted).toLocaleDateString() : 'N/A'} />
              <InfoField label="Date Discharged" value={patient.dateDischarged ? new Date(patient.dateDischarged).toLocaleDateString() : 'N/A'} />
              <div className="sm:col-span-3">
                <InfoField label="Diagnosis" value={patient.diagnosis} />
              </div>
            </div>
            <EditableField label="Treatment Summary" name="treatmentSummary" value={patient.treatmentSummary} onChange={() => {}} rows={6} />
            <EditableField label="Discharge Medication" name="dischargeMedication" value={patient.dischargeMedication} onChange={() => {}} />
            <EditableField label="Additional Notes" name="additionalNotes" value={patient.additionalNotes} onChange={() => {}} />
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 border-b pb-2">Invoice Details</h2>
            
              {invoice && invoice.items && invoice.items.length > 0 ? (
                <div className="mt-4">
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {invoice.items.map((it, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 text-sm text-gray-900">{it.description}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{it.quantity}</td>
                            <td className="px-6 py-4 text-right text-sm text-gray-900">{currencyFormatter.format(it.price * it.quantity)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold">
                          <td colSpan={2} className="px-6 py-4 text-right text-sm text-gray-900">Subtotal</td>
                          <td className="px-6 py-4 text-right text-sm text-gray-900">{currencyFormatter.format(invoice.subtotal || 0)}</td>
                        </tr>
                        <tr className="font-bold">
                          <td colSpan={2} className="px-6 py-4 text-right text-sm text-gray-900">Tax (10%)</td>
                          <td className="px-6 py-4 text-right text-sm text-gray-900">{currencyFormatter.format(invoice.tax || 0)}</td>
                        </tr>
                        <tr className="bg-gray-100 font-bold text-lg">
                          <td colSpan={2} className="px-6 py-4 text-right text-gray-900">Total</td>
                          <td className="px-6 py-4 text-right text-gray-900">{currencyFormatter.format(invoice.total || 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p>No invoice items found.</p>
              )}
          </section>
        </div>
      </main>
    </div>
  );
}
