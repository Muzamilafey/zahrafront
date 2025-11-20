import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { FaFileInvoice, FaPrint } from 'react-icons/fa';
import useHospitalDetails from '../../hooks/useHospitalDetails';

const DetailedDischargeSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const { hospitalDetails, loading: hospitalDetailsLoading } = useHospitalDetails();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !axiosInstance) return;
    const fetchData = async () => {
      try {
        // The backend should provide a comprehensive summary endpoint.
        // This might include patient details, admission info, diagnosis,
        // clinical summary, investigations, and medications.
        const response = await axiosInstance.get(`/admission/${id}/summary`);
        setData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load patient comprehensive data:', err);
        setError('Failed to fetch patient data. You may not have permission.');
        setLoading(false);
      }
    };
    fetchData();
  }, [id, axiosInstance]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || hospitalDetailsLoading) return <div className="text-center p-8">Loading Discharge Summary...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!data) return <div className="text-center p-8">No data found for this patient.</div>;

  // Assuming the API returns a structure like { patient, admission, summary, labTests, prescriptions }
  const { patient, admission, summary, labTests, prescriptions } = data;

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="container mx-auto p-4 max-w-4xl bg-white shadow-lg" id="printable-area">
        
        {/* Hospital Information and Action Buttons */}
        <div className="flex justify-between items-start mb-8 no-print">
          <div className="text-left">
            <h1 className="text-2xl font-bold text-black">{hospitalDetails.name || 'Zahra Maternity Hospital'}</h1>
            <p className="text-md">{hospitalDetails.location || 'P.O. Box 20723, Nairobi'}</p>
            <p className="text-md">{hospitalDetails.contacts || ''}</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <button 
              onClick={() => navigate(`/patients/${id}/invoice`)}
              className="bg-green-600 text-white font-bold py-2 px-4 rounded-md shadow-md hover:bg-green-700 transition duration-300 flex items-center"
            >
              <FaFileInvoice className="mr-2" />
              View Invoice
            </button>
            <button 
              onClick={handlePrint}
              className="bg-gray-700 text-white font-bold py-2 px-4 rounded-md shadow-md hover:bg-gray-800 transition duration-300 flex items-center"
            >
              <FaPrint className="mr-2" />
              Print
            </button>
          </div>
        </div>

        {/* Header for the printable summary */}
        <header className="text-center mb-8 p-4 border-b-4 border-black print-only">
          <h1 className="text-3xl font-bold text-black">{hospitalDetails.name || 'Zahra Maternity Hospital'}</h1>
          <p className="text-lg">{hospitalDetails.location || 'P.O. Box 20723, Nairobi'}</p>
          <p className="text-lg">{hospitalDetails.contacts || ''}</p>
          <h2 className="text-2xl font-semibold mt-4 bg-black text-white py-1">DISCHARGE SUMMARY</h2>
        </header>

        {/* Patient and Admission Details */}
        <section className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6 border-t-2 border-b-2 border-black py-4">
          <div><strong>PATIENT NAME:</strong> {patient?.user?.name || patient?.name}</div>
          <div><strong>ADMISSION DATE:</strong> {admission?.admittedAt ? new Date(admission.admittedAt).toLocaleDateString() : 'N/A'}</div>
          <div><strong>AGE/SEX:</strong> {patient?.age} / {patient?.gender}</div>
          <div><strong>DISCHARGE DATE:</strong> {admission?.dischargedAt ? new Date(admission.dischargedAt).toLocaleDateString() : 'N/A'}</div>
          <div><strong>MRN NO.:</strong> {patient?.mrn || patient?.hospitalId}</div>
          <div><strong>CONSULTANT:</strong> {admission?.consultant?.name || 'N/A'}</div>
        </section>

        {/* Clinical Details */}
        <section className="mb-6">
          <h3 className="font-bold border-b border-black mb-2">ADMISSION DIAGNOSIS</h3>
          <p>{summary?.admissionDiagnosis || 'N/A'}</p>
        </section>

        <section className="mb-6">
          <h3 className="font-bold border-b border-black mb-2">COURSE IN WARD / CLINICAL SUMMARY</h3>
          <p className="whitespace-pre-wrap">{summary?.clinicalSummary || 'No summary available.'}</p>
        </section>

        <section className="mb-6">
          <h3 className="font-bold border-b border-black mb-2">INVESTIGATIONS</h3>
          {labTests && labTests.length > 0 ? (
            <ul className="list-disc list-inside">
              {labTests.map(test => (
                <li key={test._id}><strong>{test.testType}:</strong> {test.results || 'Pending'}</li>
              ))}
            </ul>
          ) : <p>No investigations found.</p>}
        </section>

        <section className="mb-6">
          <h3 className="font-bold border-b border-black mb-2">MEDICATIONS</h3>
          {prescriptions && prescriptions.length > 0 ? (
            <div>
              <h4 className="font-semibold">Medications on Discharge:</h4>
              <ul className="list-disc list-inside mb-2">
                {prescriptions
                  // Assumption: The backend flags discharge medicines.
                  // If not, this filter needs to be adjusted based on the actual data structure.
                  .filter(p => p.isDischargeMedicine)
                  .flatMap(p => p.drugs)
                  .map((drug, index) => (
                    <li key={`discharge-${index}`}>
                      {drug.name} - {drug.dosage} {drug.frequency} for {drug.duration}
                    </li>
                  ))}
              </ul>
              <h4 className="font-semibold">Other Medications:</h4>
              <ul className="list-disc list-inside">
                {prescriptions
                  .filter(p => !p.isDischargeMedicine)
                  .flatMap(p => p.drugs)
                  .map((drug, index) => (
                    <li key={`other-${index}`}>
                      {drug.name} - {drug.dosage} {drug.frequency} for {drug.duration}
                    </li>
                  ))}
              </ul>
            </div>
          ) : <p>No medications found.</p>}
        </section>

        <section className="mb-6">
          <h3 className="font-bold border-b border-black mb-2">ADVICE ON DISCHARGE / FOLLOW UP</h3>
          <p>{summary?.dischargeAdvice || 'Please follow up at the surgical outpatient clinic (SOPC) in 2 weeks.'}</p>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-4 border-t-2 border-black text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Doctor's Name:</strong> _________________________</p>
            </div>
            <div>
              <p><strong>Signature:</strong> _________________________</p>
            </div>
          </div>
          <p className="text-center mt-4 text-xs">This is a computer-generated summary and is not valid for any court of law.</p>
        </footer>
      </div>
      <style jsx global>{`
        @media print {
          .no-print { display: none; }
          .print-only { display: block !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #printable-area { box-shadow: none; margin: 0; max-width: 100%; border-radius: 0; }
        }
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default DetailedDischargeSummary;

