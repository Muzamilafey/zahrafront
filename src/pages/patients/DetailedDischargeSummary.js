import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { FaPrint, FaDownload, FaFileInvoice, FaEdit } from 'react-icons/fa';

const DetailedDischargeSummary = () => {
  const { id } = useParams(); // This is patientId
  const navigate = useNavigate();
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

  const handleOpenInvoice = () => {
    navigate(`/patients/${id}/invoice`);
  };

  const handleEdit = () => {
    if (summary?._id) {
      navigate(`/discharge/${summary._id}/edit`);
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

  const PatientInfoRow = ({ label, value }) => (
    <>
      <div className="font-bold text-xs pr-2">{label}</div>
      <div className="text-xs">: {value || '................................'}</div>
    </>
  );

  const SectionTitle = ({ title }) => (
    <h3 className="font-bold text-sm underline uppercase mt-3 mb-1">{title}</h3>
  );

  return (
    <div className="bg-gray-100 p-4 print:bg-white font-serif">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex justify-end gap-2 print:hidden">
          <button onClick={handleEdit} className="btn-modern-outline text-xs">
            <FaEdit /> Edit
          </button>
          <button onClick={handleOpenInvoice} className="btn-modern-outline text-xs">
            <FaFileInvoice /> Open Invoice
          </button>
          <button onClick={() => window.print()} className="btn-modern-outline text-xs">
            <FaPrint /> Print
          </button>
          <button onClick={handleDownloadPdf} disabled={isDownloading} className="btn-modern-primary text-xs">
            <FaDownload /> {isDownloading ? 'Downloading...' : 'Download PDF'}
          </button>
        </div>

        <div className="bg-white p-6 border-2 border-black print:shadow-none print:border-none">
          <header className="text-center mb-4">
            <h1 className="text-xl font-bold">ZAHRA MATERNITY HOSPITAL</h1>
            <p className="text-xs">P.O. Box 20723, Nairobi, Kenya</p>
            <p className="text-xs">Tel: 020-2726300 | Web: www.zahramaternity.co.ke</p>
            <h2 className="text-base font-bold mt-4 border-y-2 border-black py-1">
              PROVISIONAL DISCHARGE SUMMARY
            </h2>
          </header>

          <section className="border-2 border-black p-2">
            <div className="grid grid-cols-[max-content_1fr_max-content_1fr] gap-x-4 gap-y-1">
              <PatientInfoRow label="Patient Name" value={summary.patientInfo?.name} />
              <PatientInfoRow label="Admission Date" value={summary.admissionInfo?.admittedAt ? new Date(summary.admissionInfo.admittedAt).toLocaleString() : null} />
              <PatientInfoRow label="IP. No" value={summary.admission?.admissionIdLabel} />
              <PatientInfoRow label="Discharge Date" value={summary.admissionInfo?.dischargedAt ? new Date(summary.admissionInfo.dischargedAt).toLocaleString() : null} />
              <PatientInfoRow label="UMR. No" value={summary.patientInfo?.mrn} />
              <PatientInfoRow label="Age / Gender" value={`${summary.patientInfo?.age || ''} / ${summary.patientInfo?.gender || ''}`} />
              <PatientInfoRow label="Room Type" value={summary.admissionInfo?.ward} />
              <PatientInfoRow label="Room No" value={summary.admissionInfo?.bed} />
              <PatientInfoRow label="Consultant" value={summary.dischargingDoctorName} />
              <PatientInfoRow label="Co-Consultant" value={null} />
            </div>
          </section>

          <main className="text-xs">
            <SectionTitle title="Admission Diagnosis" />
            <p>{summary.primaryDiagnosis || 'N/A'}</p>

            <SectionTitle title="Secondary Diagnoses" />
            {summary.secondaryDiagnoses && summary.secondaryDiagnoses.length > 0 ? (
              <ul className="list-decimal list-inside">
                {summary.secondaryDiagnoses.map((dx, i) => <li key={i}>{dx}</li>)}
              </ul>
            ) : <p>N/A</p>}

            <SectionTitle title="Treatment Summary" />
            <p className="whitespace-pre-wrap">{summary.treatmentSummary || summary.hospitalStaySummary || 'N/A'}</p>
            
            <SectionTitle title="Procedures Performed" />
            {summary.procedures && summary.procedures.length > 0 ? (
              <ul className="list-decimal list-inside">
                {summary.procedures.map((p, i) => <li key={i}>{p.name} on {new Date(p.date).toLocaleDateString()}</li>)}
              </ul>
            ) : <p>N/A</p>}

            <SectionTitle title="Discharge Medications" />
            {summary.dischargeMedications && summary.dischargeMedications.length > 0 ? (
              <table className="w-full text-xs mt-1 border-collapse border border-black">
                <thead>
                  <tr>
                    <th className="border border-black p-1 text-left">Medication</th>
                    <th className="border border-black p-1 text-left">Dose</th>
                    <th className="border border-black p-1 text-left">Frequency</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.dischargeMedications.map((med, i) => (
                    <tr key={i}>
                      <td className="border border-black p-1">{med.name}</td>
                      <td className="border border-black p-1">{med.dose}</td>
                      <td className="border border-black p-1">{med.frequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p>N/A</p>}

            <SectionTitle title="Follow Up Advice" />
            <p className="whitespace-pre-wrap">{summary.followUpAdvice || 'N/A'}</p>

            <SectionTitle title="Additional Notes" />
            <p className="whitespace-pre-wrap">{summary.notes || 'N/A'}</p>
          </main>

          <footer className="mt-16 text-xs">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="border-t border-black w-3/4"></div>
                <p className="font-bold pt-1">REGISTRAR</p>
              </div>
              <div>
                <div className="border-t border-black w-3/4"></div>
                <p className="font-bold pt-1">CONSULTANT</p>
                <p className="mt-2">{summary.dischargingDoctorName || 'N/A'}</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default DetailedDischargeSummary;