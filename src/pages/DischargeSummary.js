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
    const fetchAdmission = async () => {
      try {
        const response = await axiosInstance.get(`/admissions/${admissionId}`);
        setAdmission(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching admission:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (admissionId) {
      fetchAdmission();
    }
  }, [admissionId, axiosInstance]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    
    const element = document.getElementById('discharge-summary');
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('discharge-summary.pdf');
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

      {/* Cost Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Cost Summary</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Room Charges ({admission.totalRoomDays} days)</span>
              <span>KES {totalRoomCost}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Laboratory Tests</span>
              <span>KES {totalLabCosts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Other Charges</span>
              <span>KES {admission.otherCharges || 0}</span>
            </div>
            <div className="border-t pt-4 flex justify-between font-semibold">
              <span>Total</span>
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