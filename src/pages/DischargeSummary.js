import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { format } from 'date-fns';

export default function DischargeSummary() {
  const { axiosInstance } = useContext(AuthContext);
  const { admissionId } = useParams();
  const navigate = useNavigate();
  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [services, setServices] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch admission, lab results, and all other services in parallel
        const [admissionRes, labRes, servicesRes] = await Promise.all([
          axiosInstance.get(`/admissions/${admissionId}`),
          axiosInstance.get(`/lab/requests?admissionId=${admissionId}`),
          axiosInstance.get(`/admissions/${admissionId}/services`)
        ]);

        console.log('Admission Response:', admissionRes.data);
        console.log('Lab Tests Response:', labRes.data);
        console.log('Services Response:', servicesRes.data);

        const admissionData = admissionRes.data;
        const labTests = labRes.data || [];
        const allServices = servicesRes.data || {};

        // Calculate room charges
        const roomDays = admissionData.totalRoomDays || 0;
        const dailyRate = admissionData.ward?.dailyRate || 0;
        const roomCharge = roomDays * dailyRate;
        
        console.log('Room calculation:', {
          roomDays,
          dailyRate,
          roomCharge,
          ward: admissionData.ward,
        });

        // Organize all service charges
        const organizedServices = {
          room: [{
            name: 'Room Charges',
            description: `${roomDays} days @ KES ${dailyRate}/day`,
            amount: roomCharge,
            date: admissionData.admissionDate
          }],
          lab: labTests.map(test => ({
            name: test.catalog?.name || test.testType,
            description: test.results?.reportSummary || 'No results recorded',
            amount: test.results?.cost || test.catalog?.price || 0,
            date: test.date || test.createdAt,
            notes: test.results?.notes,
            value: test.results?.value,
            normalRange: test.catalog?.normalValue
          })),
          pharmacy: (allServices.pharmacy || []).map(item => ({
            name: item.drugName || item.name,
            description: `${item.quantity} units`,
            amount: item.amount || item.cost || 0,
            date: item.date || item.createdAt
          })),
          procedures: (allServices.procedures || []).map(proc => ({
            name: proc.name,
            description: proc.description || proc.notes,
            amount: proc.cost || proc.amount || 0,
            date: proc.date || proc.createdAt
          })),
          consultations: (allServices.consultations || []).map(visit => ({
            name: 'Doctor Consultation',
            description: `Dr. ${visit.doctor?.name}`,
            amount: visit.cost || visit.amount || 0,
            date: visit.date || visit.createdAt
          })),
          nursing: (allServices.nursing || []).map(care => ({
            name: 'Nursing Care',
            description: care.description || care.notes,
            amount: care.cost || care.amount || 0,
            date: care.date || care.createdAt
          })),
          other: (allServices.other || []).map(item => ({
            name: item.name || 'Miscellaneous',
            description: item.description,
            amount: item.amount || 0,
            date: item.date || item.createdAt
          }))
        };

        setAdmission(admissionData);
        setServices(organizedServices);
        console.log('Services loaded:', organizedServices); // Debug log
        setLoading(false);
      } catch (err) {
        console.error('Error fetching admission data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (admissionId) {
      fetchAllData();
    }
  }, [admissionId, axiosInstance]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      // Get the summary container
      const element = document.getElementById('discharge-summary');
      if (!element) {
        console.error('Could not find discharge summary element');
        return;
      }

      // Configure html2canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        logging: false,
        useCORS: true,
        scrollY: -window.scrollY, // Handle scrolled content
        windowHeight: element.scrollHeight
      });
      
      // Create PDF with proper dimensions
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Handle multi-page content
      let heightLeft = imgHeight;
      let position = 0;
      let pageNumber = 1;
      
      while (heightLeft >= 0) {
        if (pageNumber > 1) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;
        pageNumber++;
      }
      
      // Add page numbers
      for (let i = 1; i < pageNumber; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`Page ${i} of ${pageNumber - 1}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      }
      
      // Save the PDF
      pdf.save(`discharge-summary-${admission.patient?.hospitalId || 'patient'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  if (loading) return <div className="p-4">Loading discharge summary...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!admission) return <div className="p-4">No admission found</div>;

  // Calculate totals from services
  const calculateServiceTotals = () => {
    if (!services) {
      console.log('No services available');
      return { totalsByCategory: {}, grandTotal: 0 };
    }

    const totalsByCategory = {};
    let grandTotal = 0;

    Object.entries(services).forEach(([category, items]) => {
      console.log(`Calculating total for ${category}:`, items);
      const categoryTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      if (categoryTotal > 0) {
        totalsByCategory[category] = categoryTotal;
        grandTotal += categoryTotal;
      }
    });

    console.log('Calculated totals:', { totalsByCategory, grandTotal });
    return { totalsByCategory, grandTotal };
  };

  const { totalsByCategory, grandTotal } = calculateServiceTotals();

  return (
    <div id="discharge-summary" className="p-4 max-w-4xl mx-auto bg-white">
      {/* Print/Download Controls */}
      <div className="print:hidden mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate(`/clinical-summary/${admissionId}`)}
          className="px-4 py-2 bg-white border border-brand-600 text-brand-600 rounded hover:bg-brand-50"
        >
          Edit Clinical Summary
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-brand-600 text-brand-600 rounded hover:bg-brand-50"
            disabled={generating}
          >
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={generating}
            className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-50"
          >
            {generating ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold">Discharge Summary</h1>
        <p className="text-gray-600">
          Date: {format(new Date(admission.dischargeDate || new Date()), 'PPP')}
        </p>
      </div>

      {/* Clinical Summary */}
      {admission.clinicalSummary && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Clinical Summary</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="whitespace-pre-wrap">{admission.clinicalSummary}</p>
          </div>
        </div>
      )}

      {/* Patient Info */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Name</p>
            <p>{admission.patient?.name}</p>
          </div>
          <div>
            <p className="font-medium">Hospital ID</p>
            <p>{admission.patient?.hospitalId}</p>
          </div>
          <div>
            <p className="font-medium">Admission Date</p>
            <p>{format(new Date(admission.admissionDate), 'PPP')}</p>
          </div>
          <div>
            <p className="font-medium">Ward</p>
            <p>{admission.ward?.name}</p>
          </div>
        </div>
      </div>

      {/* Service Details */}
      {services && Object.entries(services).map(([category, items]) => {
        if (!items || items.length === 0) return null;
        
        const categoryTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
        if (categoryTotal === 0) return null;

        return (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold mb-4 capitalize">{category} Services</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(item.date), 'PP')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.description}
                        {item.value && <div className="text-xs text-gray-500 mt-1">Value: {item.value}</div>}
                        {item.notes && <div className="text-xs text-gray-500 mt-1">Notes: {item.notes}</div>}
                        {item.normalRange && <div className="text-xs text-gray-500 mt-1">Normal Range: {item.normalRange}</div>}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        KES {item.amount}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900">
                      {category.charAt(0).toUpperCase() + category.slice(1)} Total
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      KES {categoryTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Cost Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Cost Summary</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            {Object.entries(services || {}).map(([category, items]) => {
              const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
              if (total === 0) return null;
              return (
                <div key={category} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{category} Charges</span>
                  <span>KES {total}</span>
                </div>
              );
            })}
            <div className="border-t pt-4 flex justify-between font-semibold">
              <span>Grand Total</span>
              <span>KES {grandTotal}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 20mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}