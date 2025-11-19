import React, { useEffect, useState, useCallback, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// This page shows a richer Discharge Summary + Invoice editor + print/export
// Converted from TSX to plain JS and adapted to the frontend.

const mockPatientData = {
  patientName: 'Jane Doe',
  patientId: 'P-12345',
  age: 42,
  gender: 'Female',
  diagnosis: 'Acute Myocardial Infarction',
  ward: 'Coronary Care Unit (CCU)',
  dateAdmitted: '2024-07-15',
  dateDischarged: '2024-07-22',
  treatingDoctor: 'Dr. John Smith',
  treatmentSummary: 'Patient admitted with severe chest pain. ECG confirmed STEMI. Emergent coronary angiography was performed with stent placement in the left anterior descending artery. Post-procedure recovery was uneventful. Monitored in CCU for 3 days before transfer to a general ward.',
  dischargeMedication: '1. Aspirin 81mg daily\n2. Clopidogrel 75mg daily\n3. Atorvastatin 40mg at night\n4. Metoprolol 25mg twice daily',
  additionalNotes: 'Follow-up with cardiology in 2 weeks. Advised to maintain a low-sodium, low-fat diet and engage in light physical activity as tolerated.'
};

const mockInvoiceData = {
  dailyBedCharge: 15000,
  labTests: [
    { id: 1, name: 'Troponin I Test', cost: 5500 },
    { id: 2, name: 'Complete Blood Count (CBC)', cost: 1200 },
    { id: 3, name: 'Lipid Profile', cost: 2500 }
  ],
  drugs: [
    { id: 1, name: 'Stent (Drug-eluting)', cost: 120000 },
    { id: 2, name: 'IV Medications (Initial)', cost: 15000 },
  ],
  doctorFee: 25000,
  nursingFee: 10000
};

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
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCost, setTotalCost] = useState(0);
  const [numberOfDays, setNumberOfDays] = useState(0);
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

        // Find the related invoice
        if (summary.admission) {
            const invoicesResponse = await axiosInstance.get(`/billing`);
            const allInvoices = invoicesResponse.data.invoices || [];
            const patientInvoices = allInvoices.filter(inv => inv.patient?._id === summary.patient._id);
            const relatedInvoice = patientInvoices.find(inv => inv.admissionId === summary.admission._id);

            if (relatedInvoice) {
                // The invoice in the DB has lineItems. The component expects labTests and drugs.
                // I need to transform the invoice data.
                const transformedInvoice = {
                    _id: relatedInvoice._id,
                    dailyBedCharge: relatedInvoice.categoryTotals?.bed_charge || 0,
                    labTests: relatedInvoice.lineItems.filter(item => item.category === 'lab').map(item => ({id: item._id, name: item.description, cost: item.amount})),
                    drugs: relatedInvoice.lineItems.filter(item => item.category === 'pharmacy').map(item => ({id: item._id, name: item.description, cost: item.amount})),
                    doctorFee: relatedInvoice.categoryTotals?.consultation || 0,
                    nursingFee: relatedInvoice.categoryTotals?.nursing_fee || 0,
                };
                setInvoice(transformedInvoice);
            } else {
                setInvoice({ dailyBedCharge: 0, labTests: [], drugs: [], doctorFee: 0, nursingFee: 0 });
            }
        } else {
            setInvoice({ dailyBedCharge: 0, labTests: [], drugs: [], doctorFee: 0, nursingFee: 0 });
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

  const calculateTotal = useCallback(() => {
    if (!patient || !invoice) return 0;

    const startDate = new Date(patient.dateAdmitted);
    const endDate = new Date(patient.dateDischarged);
    let days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0 || isNaN(days)) days = 1;
    setNumberOfDays(days);

    const bedTotal = invoice.dailyBedCharge * days;
    const labTotal = (invoice.labTests || []).reduce((sum, item) => sum + Number(item.cost || 0), 0);
    const drugTotal = (invoice.drugs || []).reduce((sum, item) => sum + Number(item.cost || 0), 0);

    return bedTotal + labTotal + drugTotal + Number(invoice.doctorFee || 0) + Number(invoice.nursingFee || 0);
  }, [patient, invoice]);

  useEffect(() => {
    setTotalCost(calculateTotal());
  }, [patient, invoice, calculateTotal]);

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleInvoiceChange = (e) => {
    const { name, value } = e.target;
    setInvoice(prev => prev ? { ...prev, [name]: Number(value) } : null);
  };

  const handleInvoiceItemChange = (index, field, value, itemType) => {
    setInvoice(prev => {
      if (!prev) return null;
      const items = [...(prev[itemType] || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, [itemType]: items };
    });
  };

  const addInvoiceItem = (itemType) => {
    setInvoice(prev => {
      if (!prev) return null;
      const newItems = [...(prev[itemType] || []), { id: Date.now(), name: '', cost: 0 }];
      return { ...prev, [itemType]: newItems };
    });
  };

  const removeInvoiceItem = (index, itemType) => {
    setInvoice(prev => {
      if (!prev) return null;
      const newItems = (prev[itemType] || []).filter((_, i) => i !== index);
      return { ...prev, [itemType]: newItems };
    });
  };

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

  // Print invoice PDF fetched from billing endpoint (if invoice has id)
  const handlePrintInvoice = async () => {
    if (!invoice || !invoice._id) {
      alert('No invoice available to print');
      return;
    }
    try {
      const resp = await axiosInstance.get(`/billing/${invoice._id}/print`, { responseType: 'blob' });
      const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const w = window.open(url, '_blank');
      if (!w) window.location.href = url;
      setTimeout(() => { try { window.URL.revokeObjectURL(url); } catch(e) {} }, 10000);
    } catch (e) {
      console.error('Failed to fetch invoice PDF for printing', e);
      alert(e?.response?.data?.message || 'Failed to load invoice for printing');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><p className="text-xl">Loading Patient Record...</p></div>;
  if (error) return <div className="flex items-center justify-center h-screen"><p className="text-xl text-red-500">{error}</p></div>;
  if (!patient || !invoice) return null;

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
          {invoice && invoice._id && (
            <button onClick={handlePrintInvoice} className="bg-gray-800 text-white font-bold py-2 px-3 rounded-lg shadow hover:bg-gray-900 transition duration-200">Print Invoice (PDF)</button>
          )}
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
              <InfoField label="Date Admitted" value={patient.dateAdmitted} />
              <InfoField label="Date Discharged" value={patient.dateDischarged} />
              <div className="sm:col-span-3">
                <InfoField label="Diagnosis" value={patient.diagnosis} />
              </div>
            </div>
            <EditableField label="Treatment Summary" name="treatmentSummary" value={patient.treatmentSummary} onChange={handlePatientChange} rows={6} />
            <EditableField label="Discharge Medication" name="dischargeMedication" value={patient.dischargeMedication} onChange={handlePatientChange} />
            <EditableField label="Additional Notes" name="additionalNotes" value={patient.additionalNotes} onChange={handlePatientChange} />
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 border-b pb-2">Invoice Details</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-600">Daily Bed Charge (KES)</label>
                <input type="number" name="dailyBedCharge" value={invoice.dailyBedCharge} onChange={handleInvoiceChange} className="w-32 text-right p-1 border rounded-md" />
                <span>x {numberOfDays} days</span>
                <span className="font-semibold">{currencyFormatter.format(invoice.dailyBedCharge * numberOfDays)}</span>
              </div>

              <InvoiceItemsTable title="Lab Tests" items={invoice.labTests} onUpdate={handleInvoiceItemChange} onAdd={addInvoiceItem} onRemove={removeInvoiceItem} itemType="labTests" />
              <InvoiceItemsTable title="Drugs/Supplies" items={invoice.drugs} onUpdate={handleInvoiceItemChange} onAdd={addInvoiceItem} onRemove={removeInvoiceItem} itemType="drugs" />

              <div className="flex items-center justify-between">
                <label className="text-gray-600">Doctor Fee (KES)</label>
                <input type="number" name="doctorFee" value={invoice.doctorFee} onChange={handleInvoiceChange} className="w-32 text-right p-1 border rounded-md" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-gray-600">Nursing Fee (KES)</label>
                <input type="number" name="nursingFee" value={invoice.nursingFee} onChange={handleInvoiceChange} className="w-32 text-right p-1 border rounded-md" />
              </div>
            </div>

            <div className="border-t-2 border-gray-300 pt-4 mt-6 flex justify-end">
              <div className="flex items-baseline space-x-4">
                <span className="text-xl font-bold text-gray-600">TOTAL (KES)</span>
                <span className="text-3xl font-bold text-gray-900">{currencyFormatter.format(totalCost)}</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

const InvoiceItemsTable = ({ title, items = [], onUpdate, onAdd, onRemove, itemType }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={item.id || index} className="flex items-center space-x-2">
          <input type="text" value={item.name} onChange={e => onUpdate(index, 'name', e.target.value, itemType)} placeholder="Item name" className="flex-grow p-1 border rounded-md" />
          <input type="number" value={item.cost} onChange={e => onUpdate(index, 'cost', Number(e.target.value), itemType)} placeholder="Cost" className="w-32 text-right p-1 border rounded-md" />
          <button onClick={() => onRemove(index, itemType)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
        </div>
      ))}
    </div>
    <button onClick={() => onAdd(itemType)} className="no-print mt-2 text-sm text-indigo-600 hover:text-indigo-800">+ Add Item</button>
  </div>
);
