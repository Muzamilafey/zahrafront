import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const DischargeSummary = () => {
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
        setError('Failed to fetch patient data');
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id, axiosInstance]);

  const handleDischarge = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to discharge this patient?')) return;

    try {
      // Update DB status to 'Discharged'
      const response = await axiosInstance.post(`/patients/${id}/discharge`, {
        dischargeNotes: summary,
        dischargeDate: new Date().toISOString()
      });
      
      alert('Patient Discharged Successfully');
      if (response.data.invoice && response.data.invoice._id) {
        navigate(`/billing/${response.data.invoice._id}`); // Redirect to invoice after discharge
      } else {
        navigate(`/patients/${id}`); // Fallback redirect
      }
    } catch (err) {
      alert('Error discharging patient');
    }
  };

  if (loading) return <div>Loading patient details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!patient) return <div>No patient data found.</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Hospital Discharge Form</h2>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-2">Patient Details</h3>
        <p><strong>Name:</strong> {patient.user?.name || `${patient.firstName} ${patient.lastName}`}</p>
        <p><strong>Age/Sex:</strong> {patient.age} / {patient.gender}</p>
        <p><strong>Admission Date:</strong> {patient.admission?.admittedAt ? new Date(patient.admission.admittedAt).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Room Number:</strong> {patient.admission?.room || 'N/A'}</p>
        <p><strong>Diagnosis:</strong> {patient.admission?.finalDiagnosis || 'N/A'}</p>
      </div>

      <form onSubmit={handleDischarge} className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-2">Medical Discharge Summary</h3>
        <textarea
          rows="6"
          placeholder="Enter medication instructions, follow-up details, and notes..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded-md"
        />
        
        <div className="mt-4">
          <button type="submit" className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-red-700 transition duration-300">Finalize Discharge</button>
        </div>
      </form>
    </div>
  );
};

export default DischargeSummary;