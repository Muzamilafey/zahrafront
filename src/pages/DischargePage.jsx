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
        const patientData = patientRes.data;

        // Transform backend patient data to match Patient interface
        const transformedPatient = {
          id: patientData._id || patientData.id,
          name: patientData.firstName && patientData.lastName 
            ? `${patientData.firstName} ${patientData.lastName}` 
            : patientData.name,
          dob: patientData.dateOfBirth || patientData.dob,
          gender: patientData.gender || 'Other',
          address: patientData.address || 'N/A',
          contact: patientData.phone || patientData.contact || 'N/A',
          admissionDate: patientData.admissionDate,
          dischargeDate: patientData.dischargeDate,
          admittingPhysician: patientData.admittingPhysician?.name || 'N/A',
        };

        setPatient(transformedPatient);

        // Fetch discharge summary
        try {
          const summaryRes = await axiosInstance.get(`/discharge/${patientData._id || patientData.id}`);
          const summaryData = summaryRes.data;

          // Transform discharge summary data
          const transformedSummary = {
            admissionDiagnosis: summaryData.admissionDiagnosis || 'Not specified',
            finalDiagnosis: summaryData.finalDiagnosis || 'Not specified',
            hospitalCourse: summaryData.hospitalCourse || 'No details available',
            proceduresPerformed: summaryData.proceduresPerformed || [],
            medicationsOnDischarge: summaryData.medications || summaryData.medicationsOnDischarge || [],
            followUpInstructions: summaryData.followUpPlan || summaryData.followUpInstructions || 'Schedule follow-up with your physician',
            conditionOnDischarge: summaryData.dischargeCondition || 'Stable',
          };

          setDischargeSummaryData(transformedSummary);

          // Transform charges/line items from invoice if available
          if (summaryData.charges && Array.isArray(summaryData.charges)) {
            const transformedCharges = summaryData.charges.map((charge, idx) => ({
              id: charge._id || `charge-${idx}`,
              description: charge.description || charge.name || 'Service',
              quantity: charge.quantity || 1,
              unitPrice: charge.unitPrice || charge.amount || 0,
            }));
            setCharges(transformedCharges);
          }
        } catch (summaryErr) {
          console.warn('Failed to fetch discharge summary, using defaults:', summaryErr.message);
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
          const chargesRes = await axiosInstance.get(`/billing/${patientData._id || patientData.id}`);
          if (chargesRes.data && chargesRes.data.lineItems) {
            const transformedCharges = chargesRes.data.lineItems.map((charge, idx) => ({
              id: charge._id || `charge-${idx}`,
              description: charge.description || charge.name || 'Service',
              quantity: charge.quantity || 1,
              unitPrice: charge.unitPrice || charge.amount || 0,
            }));
            setCharges(transformedCharges);
          }
        } catch (chargesErr) {
          console.warn('Failed to fetch charges:', chargesErr.message);
        }
      } catch (err) {
        console.error('Error fetching discharge data:', err);
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
