import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { FaPrint, FaDownload } from 'react-icons/fa';

const DetailedDischargeSummary = () => {
  const { id } = useParams(); // This is patientId
  const { axiosInstance } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/discharge/patient/${id}/latest`);
        setSummary(response.data);
        setError('');
      } catch (err) {
        console.error('Failed to fetch discharge summary:', err);
        setError('Failed to load discharge summary. No summary may be available for this patient, or there was a server error.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSummary();
    }
  }, [id, axiosInstance]);

  const handleDownloadPdf = async () => {
    if (!summary?._id) return;
    setIsDownloading(true);
    try {
      const response = await axiosInstance.post(
        `/discharge/generate-pdf/${summary._id}`,
        {},
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `discharge-summary-${summary.patientInfo?.mrn || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading discharge summary...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  if (!summary) {
    return <div className="text-center p-8">No discharge summary found for this patient.</div>;
  }

  const renderField = (label, value, className = '') => (
    <div className={`mb-4 ${className}`}>
      <h4 className="text-md font-bold text-gray-600 uppercase tracking-wider">{label}</h4>
      <p className="text-gray-800 whitespace-pre-wrap pt-1">{value || 'N/A'}</p>
    </div>
  );

  const renderList = (label, items, renderItem) => (
    <div className="mb-4">
      <h4 className="text-md font-bold text-gray-600 uppercase tracking-wider">{label}</h4>
      {items && items.length > 0 ? (
        <ul className="list-disc list-inside pl-4 text-gray-800 pt-1">
          {items.map((item, index) => (
            <li key={index}>{renderItem ? renderItem(item) : item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-800 pt-1">N/A</p>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 bg-gray-100 print:bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Action Buttons */}
        <div className="mb-4 flex justify-end gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="btn-modern-outline"
          >
            <FaPrint />
            Print
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="btn-modern-primary"
          >
            <FaDownload />
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </button>
        </div>

        {/* Discharge Summary Paper */}
        <div className="bg-white shadow-lg rounded-lg p-8 sm:p-12 border border-gray-200 print:shadow-none print:border-none">
          {/* Header */}
          <header className="flex justify-between items-center border-b-2 border-gray-800 pb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Zahra Maternity Hospital</h1>
              <p className="text-gray-600">Quality care for you and your baby.</p>
            </div>
            <img src="/logo1.png" alt="Hospital Logo" className="h-20 w-auto" />
          </header>

          <h2 className="text-3xl font-bold my-6 text-center text-gray-800">Discharge Summary</h2>

          {/* Patient and Admission Details */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8 border-t border-b py-4 border-gray-200">
            <div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Patient Information</h3>
              {renderField('Name', summary.patientInfo?.name)}
              {renderField('MRN', summary.patientInfo?.mrn)}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Admission Details</h3>
              {renderField('Admission Date', summary.admissionInfo?.admittedAt ? new Date(summary.admissionInfo.admittedAt).toLocaleString() : 'N/A')}
              {renderField('Discharge Date', summary.admissionInfo?.dischargedAt ? new Date(summary.admissionInfo.dischargedAt).toLocaleString() : 'N/A')}
            </div>
            <div className="md:col-span-2">
              {renderField('Age / Sex', `${summary.patientInfo?.age || 'N/A'} / ${summary.patientInfo?.gender || 'N/A'}`)}
            </div>
          </section>

          {/* Clinical Information */}
          <main className="space-y-6">
            {renderField('Admission Diagnosis', summary.primaryDiagnosis, 'p-2 bg-gray-50 rounded-md')}
            {renderList('Secondary Diagnoses', summary.secondaryDiagnoses)}
            {renderField('Treatment Summary', summary.treatmentSummary || summary.hospitalStaySummary, 'p-2 bg-gray-50 rounded-md')}
            {renderList('Procedures Performed', summary.procedures, (p) => `${p.name} on ${new Date(p.date).toLocaleDateString()}`)}
            {renderList('Discharge Medications', summary.dischargeMedications, (med) => `${med.name} - ${med.dose} ${med.frequency}`)}
            {renderField('Follow Up Advice', summary.followUpAdvice, 'p-2 bg-gray-50 rounded-md')}
            {renderField('Additional Notes', summary.notes)}
          </main>

          {/* Footer / Signature */}
          <footer className="mt-12 pt-8 border-t-2 border-gray-800 text-left">
            <h3 className="text-lg font-semibold text-gray-700">Discharged By:</h3>
            <p className="text-gray-800 mt-2 text-xl">{summary.dischargingDoctorName || 'N/A'}</p>
            {summary.finalizationInfo?.finalizedAt && (
              <p className="text-sm text-gray-500 mt-1">Finalized on {new Date(summary.finalizationInfo.finalizedAt).toLocaleString()}</p>
            )}
            <div className="mt-16 border-t-2 border-dotted w-1/2">
              <p className="text-center text-sm text-gray-500 pt-1">Signature</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default DetailedDischargeSummary;
