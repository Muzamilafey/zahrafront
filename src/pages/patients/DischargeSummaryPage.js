import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from 'contexts/AuthContext';

const FACILITY_INFO = {
  name: 'ZAHRA MATERNITY & CHILD CARE HOSPITAL',
  phone: 'TEL 0722568879',
  email: 'info@zahrahospital.com',
  address: 'Mogadishu, Somalia'
};

export default function DischargeSummaryPage() {
  const { id: patientId } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();

  const [discharge, setDischarge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDischargeSummary = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/discharge/${patientId}`);
        setDischarge(response.data);
      } catch (error) {
        console.error('Failed to load discharge summary:', error);
      }
      setLoading(false);
    };

    loadDischargeSummary();
  }, [patientId, axiosInstance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading discharge summary...</p>
        </div>
      </div>
    );
  }

  if (!discharge) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 text-yellow-700 mb-4">
          <p className="font-semibold">No Discharge Summary</p>
          <p>This patient doesn't have a discharge summary yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{FACILITY_INFO.name}</h1>
          <p className="text-lg font-semibold text-gray-600">Discharge Summary</p>
        </div>

        {/* Patient Details */}
        <div className="grid grid-cols-2 gap-4 mb-8 border-b pb-4">
          <div>
            <p><strong>Patient Name:</strong> {discharge.patientInfo.name}</p>
            <p><strong>MRN:</strong> {discharge.patientInfo.mrn}</p>
          </div>
          <div>
            <p><strong>Date of Birth:</strong> {discharge.patientInfo.dob ? new Date(discharge.patientInfo.dob).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Attending Physician:</strong> {discharge.dischargingDoctorName}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-2">Admission Date</h3>
              <p>{new Date(discharge.admissionInfo.admittedAt).toLocaleDateString()}</p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-2">Discharge Date</h3>
              <p>{new Date(discharge.admissionInfo.dischargedAt).toLocaleDateString()}</p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-2">Discharge Diagnosis</h3>
              <p>{discharge.diagnosis.primary}</p>
              {discharge.diagnosis.secondary && discharge.diagnosis.secondary.length > 0 && (
                <ul className="list-disc list-inside mt-2">
                  {discharge.diagnosis.secondary.map((diag, index) => (
                    <li key={index}>{diag}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-2">History of Present Illness</h3>
              <p>{discharge.hospitalStaySummary || 'N/A'}</p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-2">Hospital Course</h3>
              <p>{discharge.dischargeNotes || 'N/A'}</p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-2">Discharge Medications</h3>
              {discharge.medicationsOnDischarge && discharge.medicationsOnDischarge.length > 0 ? (
                <ul className="list-disc list-inside">
                  {discharge.medicationsOnDischarge.map((med, index) => (
                    <li key={index}>{med.name} - {med.dosage} {med.frequency}</li>
                  ))}
                </ul>
              ) : <p>N/A</p>}
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-2">Discharge Instructions</h3>
              <p>{discharge.instructionsToPatient || 'N/A'}</p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-2">Follow-up</h3>
              <p>{discharge.followUpPlan || 'N/A'}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-2">Charges</h3>
              {discharge.charges && discharge.charges.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="py-2">Description</th>
                      <th className="py-2">Quantity</th>
                      <th className="py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discharge.charges.map((charge, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{charge.description}</td>
                        <td className="py-2">{charge.qty}</td>
                        <td className="py-2">{charge.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p>N/A</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}