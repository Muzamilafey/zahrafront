import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { format } from 'date-fns';

export default function DischargeSummary() {
  const { axiosInstance } = useContext(AuthContext);
  const { admissionId } = useParams();
  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdmissionData = async () => {
      try {
        // Fetch admission details including services
        const [admissionRes, servicesRes] = await Promise.all([
          axiosInstance.get(`/admissions/${admissionId}`),
          axiosInstance.get(`/admissions/${admissionId}/services`)
        ]);

        const admissionData = admissionRes.data;
        const services = servicesRes.data;

        // Organize all services by type
        const organizedServices = {
          pharmacy: services.pharmacy || [],
          lab: services.labTests || [],
          meals: services.meals || [],
          theatre: services.theatre || [],
          procedures: services.procedures || [],
          doctors: services.doctorVisits || [],
          nurses: services.nurseVisits || [],
          other: services.other || []
        };

        setAdmission({ 
          ...admissionData, 
          services: organizedServices,
          roomCharge: (admissionData.totalRoomDays || 0) * (admissionData.ward?.dailyRate || 0)
        });
        console.log('Services loaded:', organizedServices); // Debug log
        setLoading(false);
      } catch (err) {
        console.error('Error fetching admission data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (admissionId) {
      fetchAdmissionData();
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

  const totalLabCosts = admission.labTests?.reduce((sum, test) => {
    return sum + (test.results?.cost || test.catalog?.price || 0);
  }, 0) || 0;

  const totalRoomCost = admission.totalRoomDays * (admission.ward?.dailyRate || 0);
  const grandTotal = totalLabCosts + totalRoomCost + (admission.otherCharges || 0);

  return (
    <div id="discharge-summary" className="p-4 max-w-4xl mx-auto">
      {/* Print Controls - hidden in print */}
      <div className="print:hidden mb-4 flex justify-end gap-4">
        <button
          onClick={handlePrint}
          className="px-4 py-2 border border-brand-600 text-brand-600 rounded-md hover:bg-brand-50"
        >
          Print
        </button>
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700"
        >
          Download PDF
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold">Discharge Summary</h1>
        <p className="text-gray-600">
          Date: {format(new Date(admission.dischargeDate || new Date()), 'PPP')}
        </p>
      </div>

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

      {/* Laboratory Tests */}
      {admission.labTests && admission.labTests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Laboratory Tests</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Summary</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {admission.labTests.map((test) => (
                  <tr key={test._id}>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {test.catalog?.name || test.testType}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(test.date), 'PP')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{test.results?.summary || 'No summary'}</div>
                      {test.results?.value && (
                        <div className="text-xs text-gray-500">Value: {test.results.value}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      KES {test.results?.cost || test.catalog?.price || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Service Details */}
      {admission.services && Object.entries(admission.services).map(([category, items]) => {
        if (!items || items.length === 0) return null;
        
        const categoryTotal = items.reduce((sum, item) => sum + (item.amount || item.cost || item.price || 0), 0);
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
                    <tr key={item._id || idx}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.name || item.service || item.testType || item.drugName || 'Service'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(item.date || item.createdAt), 'PP')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.description || item.notes || item.summary || '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        KES {item.amount || item.cost || item.price || 0}
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
            <div className="flex justify-between">
              <span className="text-gray-600">Room Charges ({admission.totalRoomDays} days @ KES {admission.ward?.dailyRate}/day)</span>
              <span>KES {admission.roomCharge}</span>
            </div>
            {Object.entries(admission.services || {}).map(([category, items]) => {
              const total = items?.reduce((sum, item) => sum + (item.amount || item.cost || item.price || 0), 0) || 0;
              if (total === 0) return null;
              return (
                <div key={category} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{category} Charges</span>
                  <span>KES {total}</span>
                </div>
              );
            })}
            {admission.otherCharges > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Other Charges</span>
                <span>KES {admission.otherCharges}</span>
              </div>
            )}
            <div className="border-t pt-4 flex justify-between font-semibold">
              <span>Grand Total</span>
              <span>KES {Object.values(admission.services || {}).reduce((sum, items) => {
                return sum + (items?.reduce((s, item) => s + (item.amount || item.cost || item.price || 0), 0) || 0);
              }, admission.roomCharge + (admission.otherCharges || 0))}</span>
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