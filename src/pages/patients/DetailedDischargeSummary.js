import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { FaFileInvoiceDollar } from 'react-icons/fa';

const DetailedDischargeSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !axiosInstance) return;
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(`/patients/${id}`);
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

  if (loading) return <div className="text-center p-8">Loading Comprehensive Discharge Summary...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!data) return <div className="text-center p-8">No data found for this patient.</div>;

  const { patient, appointments, invoices, labTests, prescriptions } = data;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Comprehensive Discharge Summary</h2>
        <button 
          onClick={() => navigate(`/patients/${id}/invoice`)}
          className="bg-teal-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 flex items-center"
        >
          <FaFileInvoiceDollar className="mr-2" />
          View Combined Invoice
        </button>
      </div>

      {/* Patient Details */}
      <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Patient Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <p><strong>Name:</strong> {patient.user?.name}</p>
          <p><strong>Age/Sex:</strong> {patient.age} / {patient.gender}</p>
          <p><strong>MRN:</strong> {patient.mrn}</p>
          <p><strong>Admission Date:</strong> {new Date(patient.admission?.admittedAt).toLocaleDateString()}</p>
          <p><strong>Discharge Date:</strong> {patient.admission?.dischargedAt ? new Date(patient.admission.dischargedAt).toLocaleDateString() : 'N/A'}</p>
          <p className="md:col-span-3"><strong>Primary Diagnosis:</strong> {patient.admission?.finalDiagnosis || 'N/A'}</p>
        </div>
      </div>

      {/* Clinical Summary */}
      <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Clinical Summary</h3>
        <p className="whitespace-pre-wrap">{patient.admission?.dischargeNotes || 'No discharge summary available.'}</p>
      </div>

      {/* Prescriptions */}
      <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Prescriptions on Discharge</h3>
        {prescriptions && prescriptions.length > 0 ? (
          <ul className="list-disc list-inside">
            {prescriptions.map(p => p.drugs.map((drug, index) => (
              <li key={`${p._id}-${index}`} className="mb-2">
                <strong>{drug.name}</strong> - {drug.dosage} {drug.frequency} for {drug.duration}
              </li>
            )))}
          </ul>
        ) : (
          <p>No prescriptions found.</p>
        )}
      </div>

      {/* Lab Tests */}
      <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Lab Test Results</h3>
        {labTests && labTests.length > 0 ? (
          <ul className="list-disc list-inside">
            {labTests.map(test => (
              <li key={test._id} className="mb-2">
                <strong>{test.testType}</strong>: {test.results || 'Pending'} (Status: {test.status})
              </li>
            ))}
          </ul>
        ) : (
          <p>No lab tests found.</p>
        )}
      </div>

    </div>
  );
};

export default DetailedDischargeSummary;
