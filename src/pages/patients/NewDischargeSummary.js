import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const NewDischargeSummary = () => {
  const { id } = useParams(); // Patient ID from URL
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  
  const [patient, setPatient] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch Patient Data on Load
  useEffect(() => {
    if (!id || !axiosInstance) return;
    const fetchPatient = async () => {
      try {
        const response = await axiosInstance.get(`/patients/${id}`);
        setPatient(response.data.patient);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load patient data:', err);
        setError('Failed to fetch patient data. You may not have permission to view this patient.');
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id, axiosInstance]);

  const handleDischarge = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to discharge this patient? This will finalize their admission and generate an invoice.')) return;

    try {
      // This endpoint in patientRoutes.js handles setting discharge date, notes, and finalizing the invoice.
      await axiosInstance.post(`/patients/${id}/discharge`, {
        dischargeNotes: summary,
      });
      
      alert('Patient Discharged Successfully');
      
      // The user is likely a doctor or admin, so redirect to the patient's main page or the discharged list
      navigate(`/patients/${id}`);

    } catch (err) {
      console.error('Error discharging patient:', err);
      alert(err.response?.data?.message || 'Error discharging patient');
    }
  };

  if (loading) return <div className="text-center p-8">Loading patient details...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!patient) return <div className="text-center p-8">No patient data found.</div>;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Hospital Discharge Form</h2>
        <Link to={`/patients/${id}/detailed-discharge-summary`} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300">
            Open Detailed Summary
        </Link>
      </div>
      
      <div className="bg-white shadow-lg rounded-xl p-8 mb-6 border border-gray-200">
        <h3 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Patient Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p><strong>Name:</strong> {patient.user?.name || `${patient.firstName} ${patient.lastName}`}</p>
          <p><strong>Age/Sex:</strong> {patient.age ? `${patient.age} / ${patient.gender}` : 'N/A'}</p>
          <p><strong>Admission Date:</strong> {patient.admission?.admittedAt ? new Date(patient.admission.admittedAt).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Room Number:</strong> {patient.admission?.room || 'N/A'}</p>
          <p className="md:col-span-2"><strong>Primary Diagnosis:</strong> {patient.admission?.finalDiagnosis || 'N/A'}</p>
        </div>
      </div>

      <form onSubmit={handleDischarge} className="bg-white shadow-lg rounded-xl p-8 border border-gray-200">
        <h3 className="text-2xl font-semibold mb-4 text-gray-700">Medical Discharge Summary</h3>
        <p className="text-sm text-gray-600 mb-4">
          Enter the final discharge summary below. This will include medication instructions, follow-up details, and other clinical notes. 
          This action is final and will lock the patient's admission record.
        </p>
        <textarea
          rows="8"
          placeholder="Enter medication instructions, follow-up details, and any other clinical notes for the discharge summary..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
        />
        
        <div className="mt-6 text-right">
          <button type="submit" className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-300">
            Finalize Discharge
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewDischargeSummary;