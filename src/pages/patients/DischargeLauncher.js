import React from 'react';
import { useNavigate } from 'react-router-dom';
import PatientSearch from '../../components/patientSearch';

const DischargeLauncher = () => {
  const navigate = useNavigate();

  const handleSearch = (patientId) => {
    if (!patientId) return;
    // Normalize patientId if necessary
    const id = encodeURIComponent(patientId.trim());
    navigate(`/patients/${id}/discharge-summary`);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Open Discharge Summary</h2>
      <p className="text-sm text-gray-600 mb-4">Search for a patient by ID to open their discharge summary (admin access required).</p>
      <PatientSearch onSearch={handleSearch} />
    </div>
  );
};

export default DischargeLauncher;
