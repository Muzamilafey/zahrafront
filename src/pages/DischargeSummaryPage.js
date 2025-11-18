import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function DischargeSummaryPage() {
  const { id } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axiosInstance.get(`/discharge/${id}`);
        setSummary(response.data);
      } catch (error) {
        console.error('Failed to fetch discharge summary:', error);
      }
      setLoading(false);
    };

    fetchSummary();
  }, [id, axiosInstance]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!summary) {
    return <div className="p-6">Discharge summary not found.</div>;
  }

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold text-brand-700 mb-4">Discharge Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Patient Information</h3>
          <p><strong>Name:</strong> {summary.patientInfo.name}</p>
          <p><strong>MRN:</strong> {summary.patientInfo.mrn}</p>
          <p><strong>Age:</strong> {summary.patientInfo.age}</p>
          <p><strong>Gender:</strong> {summary.patientInfo.gender}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Admission Information</h3>
          <p><strong>Admitted At:</strong> {new Date(summary.admissionInfo.admittedAt).toLocaleString()}</p>
          <p><strong>Discharged At:</strong> {new Date(summary.admissionInfo.dischargedAt).toLocaleString()}</p>
          <p><strong>Ward:</strong> {summary.admissionInfo.ward}</p>
          <p><strong>Admitting Doctor:</strong> {summary.admissionInfo.admittingDoctorName}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Diagnosis</h3>
          <p><strong>Primary Diagnosis:</strong> {summary.diagnosis.primary}</p>
          {summary.diagnosis.secondary && summary.diagnosis.secondary.length > 0 && (
            <p><strong>Secondary Diagnoses:</strong> {summary.diagnosis.secondary.join(', ')}</p>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Condition at Discharge</h3>
          <p>{summary.dischargeCondition}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Medications on Discharge</h3>
          <ul>
            {summary.medicationsOnDischarge.map((med, index) => (
              <li key={index}>{med.name} - {med.dosage} {med.frequency}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Follow-up Plan</h3>
          <p>{summary.followUpPlan}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Discharging Doctor</h3>
          <p>{summary.dischargingDoctorName}</p>
        </div>
      </div>
    </div>
  );
}
