import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import DischargeSummary from '../components/DischargeSummary';
import Invoice from '../components/Invoice';
import Spinner from '../components/Spinner';
import { Patient, DischargeSummaryDetails, Charge } from '../types';

/**
 * DischargePage - Comprehensive discharge view with summary and invoice
 * Fetches real data from backend and displays using TypeScript components
 */
const DischargePage = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patient, setPatient] = useState(null);
  const [dischargeSummaryData, setDischargeSummaryData] = useState(null);
  const [charges, setCharges] = useState([]);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'invoice'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch patient data
        const patientRes = await axiosInstance.get(`/patients/${patientId}`);
        const patientData = patientRes.data?.data || patientRes.data || {};

        // Transform backend patient data to match Patient interface
        const transformedPatient = {
          id: patientData._id || patientData.id || patientId,
          name: patientData.firstName && patientData.lastName 
            ? `${patientData.firstName} ${patientData.lastName}` 
            : patientData.fullName || patientData.name || 'Unknown',
          dob: patientData.dateOfBirth || patientData.dob || 'N/A',
          gender: patientData.gender || 'Other',
          address: patientData.address || 'N/A',
          contact: patientData.phone || patientData.contact || 'N/A',
          admissionDate: patientData.admissionDate || 'N/A',
          dischargeDate: patientData.dischargeDate || 'N/A',
          admittingPhysician: typeof patientData.admittingPhysician === 'object' 
            ? (patientData.admittingPhysician?.name || 'N/A')
            : (patientData.admittingPhysician || 'N/A'),
        };

        setPatient(transformedPatient);

        // Fetch discharge summary
        try {
          const summaryId = patientData._id || patientData.id || patientId;
          const summaryRes = await axiosInstance.get(`/discharge/${summaryId}`);
          const summaryData = summaryRes.data?.data || summaryRes.data || {};

          console.log('[DischargePage] Discharge Summary Data:', summaryData);

          // Transform discharge summary data
          const medicationsArray = Array.isArray(summaryData.medicationsOnDischarge) 
            ? summaryData.medicationsOnDischarge 
            : (Array.isArray(summaryData.medications) ? summaryData.medications : []);

          // Ensure medications have required fields
          const normalizedMedications = medicationsArray.map(med => ({
            name: med.name || med.medicationName || 'Unknown medication',
            dosage: med.dosage || med.dose || '1 tab',
            frequency: med.frequency || 'Twice daily',
          }));

          const proceduresArray = Array.isArray(summaryData.proceduresPerformed)
            ? summaryData.proceduresPerformed
            : (Array.isArray(summaryData.procedures) ? summaryData.procedures : []);

          const transformedSummary = {
            admissionDiagnosis: summaryData.admissionDiagnosis || 'Not specified',
            finalDiagnosis: summaryData.finalDiagnosis || summaryData.diagnosis || 'Not specified',
            hospitalCourse: summaryData.hospitalCourse || summaryData.clinicalCourse || 'No details available',
            proceduresPerformed: proceduresArray.map(p => typeof p === 'string' ? p : (p.name || p.procedureName || p)),
            medicationsOnDischarge: normalizedMedications,
            followUpInstructions: summaryData.followUpPlan || summaryData.followUpInstructions || 'Schedule follow-up with your physician',
            conditionOnDischarge: summaryData.dischargeCondition || 'Stable',
          };

          setDischargeSummaryData(transformedSummary);

          // Transform charges/line items from discharge summary if available
          if (summaryData.charges && Array.isArray(summaryData.charges)) {
            const transformedCharges = summaryData.charges.map((charge, idx) => ({
              id: charge._id || `charge-${idx}`,
              description: charge.description || charge.name || 'Service',
              quantity: charge.quantity || 1,
              unitPrice: parseFloat(charge.unitPrice || charge.amount || 0),
            }));
            setCharges(transformedCharges);
          }
        } catch (summaryErr) {
          console.warn('[DischargePage] Failed to fetch discharge summary:', summaryErr.message);
          // Use default summary if endpoint fails
          setDischargeSummaryData({
            admissionDiagnosis: 'Pending',
            finalDiagnosis: 'Pending',
            hospitalCourse: 'No details available',
            proceduresPerformed: [],
            medicationsOnDischarge: [],
            followUpInstructions: 'Schedule follow-up with your physician',
            conditionOnDischarge: 'Stable',
          });
        }

        // Fetch charges/billing separately if needed
        try {
          const chargesRes = await axiosInstance.get(`/billing/${patientData._id || patientData.id || patientId}`);
          const billingData = chargesRes.data?.data || chargesRes.data || {};
          
          if (billingData.lineItems && Array.isArray(billingData.lineItems)) {
            const transformedCharges = billingData.lineItems.map((charge, idx) => ({
              id: charge._id || `charge-${idx}`,
              description: charge.description || charge.name || 'Service',
              quantity: charge.quantity || 1,
              unitPrice: parseFloat(charge.unitPrice || charge.amount || 0),
            }));
            setCharges(transformedCharges);
          }
        } catch (chargesErr) {
          console.warn('[DischargePage] Failed to fetch charges:', chargesErr.message);
        }
      } catch (err) {
        console.error('[DischargePage] Error fetching discharge data:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load discharge summary');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchData();
    }
  }, [patientId, axiosInstance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-700 mb-6">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!patient || !dischargeSummaryData) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <p className="text-gray-700">No discharge data available</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Patient Discharge</h1>
          <div className="w-20"></div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-2 rounded-md font-medium transition ${
              activeTab === 'summary'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Discharge Summary
          </button>
          <button
            onClick={() => setActiveTab('invoice')}
            className={`px-6 py-2 rounded-md font-medium transition ${
              activeTab === 'invoice'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Invoice
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'summary' && (
            <DischargeSummary patient={patient} summaryDetails={dischargeSummaryData} />
          )}
          {activeTab === 'invoice' && (
            <Invoice patient={patient} charges={charges} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DischargePage;
