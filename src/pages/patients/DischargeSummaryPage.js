import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from 'contexts/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function DischargeSummaryPage() {
  const { id: patientId } = useParams();
  const { axiosInstance } = useContext(AuthContext);

  const [discharge, setDischarge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saveMessage, setSaveMessage] = useState(null);
  const [generatePDFLoading, setGeneratePDFLoading] = useState(false);

  // Load discharge summary
  useEffect(() => {
    loadDischargeSummary();
  }, [patientId, axiosInstance]);

  const loadDischargeSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get all discharge summaries for the patient
      const res = await axiosInstance.get(`/discharge/patient/${patientId}`);
      if (res.data.summaries && res.data.summaries.length > 0) {
        // Use the most recent one
        const latest = res.data.summaries[0];
        setDischarge(latest);
        setEditData({
          dischargeCondition: latest.dischargeCondition,
          dischargeNotes: latest.dischargeNotes,
          followUpPlan: latest.followUpPlan,
          instructionsToPatient: latest.instructionsToPatient,
          dietaryRecommendations: latest.dietaryRecommendations,
          activityRestrictions: latest.activityRestrictions,
          warningSignsToWatch: latest.warningSignsToWatch || []
        });
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load discharge summary');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveDraft = async () => {
    if (!discharge) return;
    try {
      setSaveMessage({ type: 'loading', text: 'Saving...' });
      await axiosInstance.put(`/discharge/update/${discharge._id}`, editData);
      setSaveMessage({ type: 'success', text: 'Draft saved successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
      loadDischargeSummary();
    } catch (e) {
      setSaveMessage({
        type: 'error',
        text: e?.response?.data?.message || 'Failed to save'
      });
    }
  };

  const handleFinalize = async () => {
    if (!discharge) return;
    if (!window.confirm('Are you sure? This will finalize and lock the discharge summary.')) return;

    try {
      setSaveMessage({ type: 'loading', text: 'Finalizing...' });
      await axiosInstance.put(`/discharge/finalize/${discharge._id}`, {
        finalizedBy: localStorage.getItem('userId') // Assuming user ID stored in localStorage
      });
      setSaveMessage({ type: 'success', text: 'Discharge summary finalized' });
      setTimeout(() => setSaveMessage(null), 3000);
      loadDischargeSummary();
    } catch (e) {
      setSaveMessage({
        type: 'error',
        text: e?.response?.data?.message || 'Failed to finalize'
      });
    }
  };

  const handleRefresh = async () => {
    try {
      setSaveMessage({ type: 'loading', text: 'Refreshing data...' });
      await axiosInstance.post(`/discharge/refresh/${discharge._id}`);
      setSaveMessage({ type: 'success', text: 'Data refreshed from source modules' });
      setTimeout(() => setSaveMessage(null), 3000);
      loadDischargeSummary();
    } catch (e) {
      setSaveMessage({
        type: 'error',
        text: e?.response?.data?.message || 'Failed to refresh'
      });
    }
  };

  const handleGeneratePDF = async () => {
    if (!discharge) return;
    setGeneratePDFLoading(true);
    try {
      // Use the backend PDF generation endpoint
      const response = await axiosInstance.post(`/discharge/generate-pdf/${discharge._id}`, {}, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `discharge-summary-${discharge.dischargeNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentChild.removeChild(link);
    } catch (e) {
      setSaveMessage({
        type: 'error',
        text: e?.response?.data?.message || 'Failed to generate PDF'
      });
    } finally {
      setGeneratePDFLoading(false);
    }
  };

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

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
          <button
            onClick={loadDischargeSummary}
            className="mt-2 text-red-700 underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!discharge) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 text-yellow-700">
          <p className="font-semibold">No Discharge Summary</p>
          <p>This patient doesn't have a discharge summary yet. It will be auto-created when the patient is discharged.</p>
        </div>
      </div>
    );
  }

  const isLocked = discharge.finalizationInfo?.locked;
  const canEdit = !isLocked && discharge.status !== 'finalized';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Discharge Summary</h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {discharge.dischargeNumber}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              isLocked
                ? 'bg-green-100 text-green-800'
                : discharge.status === 'reviewed'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {discharge.status === 'finalized' ? 'Finalized & Locked' : `Status: ${discharge.status}`}
            </span>
          </div>
          {saveMessage && (
            <div className={`px-4 py-2 rounded text-sm font-semibold ${
              saveMessage.type === 'success'
                ? 'bg-green-100 text-green-800'
                : saveMessage.type === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {saveMessage.text}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-3 flex-wrap">
        {canEdit && (
          <>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded font-semibold transition ${
                isEditing
                  ? 'bg-gray-500 text-white'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isEditing ? 'Cancel Edit' : 'Edit Summary'}
            </button>
            {isEditing && (
              <>
                <button
                  onClick={handleSaveDraft}
                  className="px-4 py-2 bg-green-500 text-white rounded font-semibold hover:bg-green-600 transition"
                >
                  Save Draft
                </button>
              </>
            )}
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-purple-500 text-white rounded font-semibold hover:bg-purple-600 transition"
            >
              Refresh from Modules
            </button>
            <button
              onClick={handleFinalize}
              className="px-4 py-2 bg-orange-500 text-white rounded font-semibold hover:bg-orange-600 transition"
            >
              Finalize Summary
            </button>
          </>
        )}
        <button
          onClick={handleGeneratePDF}
          disabled={generatePDFLoading}
          className="px-4 py-2 bg-red-500 text-white rounded font-semibold hover:bg-red-600 transition disabled:opacity-50"
        >
          {generatePDFLoading ? 'Generating PDF...' : 'Generate PDF'}
        </button>
      </div>

      {/* Main Content */}
      <div id="discharge-summary-content" className="bg-white rounded-lg shadow-lg p-8">

        {/* Patient Information */}
        <div className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Patient Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-semibold text-gray-800">{discharge.patientInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">MRN</p>
              <p className="font-semibold text-gray-800">{discharge.patientInfo.mrn}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Age</p>
              <p className="font-semibold text-gray-800">{discharge.patientInfo.age}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gender</p>
              <p className="font-semibold text-gray-800">{discharge.patientInfo.gender}</p>
            </div>
          </div>
        </div>

        {/* Admission Information */}
        <div className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Admission Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Ward</p>
              <p className="font-semibold text-gray-800">{discharge.admissionInfo.ward}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bed</p>
              <p className="font-semibold text-gray-800">{discharge.admissionInfo.bed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Admitted</p>
              <p className="font-semibold text-gray-800">
                {new Date(discharge.admissionInfo.admittedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Discharged</p>
              <p className="font-semibold text-gray-800">
                {new Date(discharge.admissionInfo.dischargedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Length of Stay</p>
              <p className="font-semibold text-gray-800">{discharge.admissionInfo.lengthOfStay} days</p>
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Diagnosis</h2>
          <div>
            <p className="text-sm text-gray-600 mb-1">Primary Diagnosis</p>
            <p className="font-semibold text-gray-800 mb-4">{discharge.diagnosis.primary || 'N/A'}</p>
          </div>
          {discharge.diagnosis.secondary && discharge.diagnosis.secondary.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Secondary Diagnoses</p>
              <ul className="list-disc list-inside text-gray-800">
                {discharge.diagnosis.secondary.map((diag, idx) => (
                  <li key={idx}>{diag}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Hospital Stay Summary */}
        <div className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Hospital Stay Summary</h2>
          <div className="bg-gray-50 p-4 rounded">
            {isEditing ? (
              <textarea
                value={editData.hospitalStaySummary || discharge.hospitalStaySummary || ''}
                onChange={(e) => handleEditChange('hospitalStaySummary', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                rows="5"
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">
                {discharge.hospitalStaySummary || 'No summary available'}
              </p>
            )}
          </div>
        </div>

        {/* Investigations */}
        {discharge.investigations && discharge.investigations.length > 0 && (
          <div className="mb-8 border-b pb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Investigations Done</h2>
            <div className="space-y-3">
              {discharge.investigations.map((inv, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-gray-800">{inv.name}</p>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(inv.date).toLocaleDateString()}
                  </p>
                  {inv.results && <p className="text-gray-700">Results: {inv.results}</p>}
                  {inv.findings && <p className="text-gray-700">Findings: {inv.findings}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Procedures */}
        {discharge.procedures && discharge.procedures.length > 0 && (
          <div className="mb-8 border-b pb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Procedures Performed</h2>
            <div className="space-y-3">
              {discharge.procedures.map((proc, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-gray-800">{proc.name}</p>
                  {proc.findings && <p className="text-gray-700">Findings: {proc.findings}</p>}
                  {proc.result && <p className="text-gray-700">Result: {proc.result}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications on Discharge */}
        {discharge.medicationsOnDischarge && discharge.medicationsOnDischarge.length > 0 && (
          <div className="mb-8 border-b pb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Medications on Discharge</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Medicine</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Dosage</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Frequency</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Duration</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {discharge.medicationsOnDischarge.map((med, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{med.name}</td>
                      <td className="px-4 py-2">{med.dosage || '-'}</td>
                      <td className="px-4 py-2">{med.frequency || '-'}</td>
                      <td className="px-4 py-2">{med.duration || '-'}</td>
                      <td className="px-4 py-2">{med.instructions || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Discharge Condition */}
        <div className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Discharge Condition</h2>
          {isEditing ? (
            <select
              value={editData.dischargeCondition}
              onChange={(e) => handleEditChange('dischargeCondition', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="improved">Improved</option>
              <option value="much_improved">Much Improved</option>
              <option value="unchanged">Unchanged</option>
              <option value="worsened">Worsened</option>
              <option value="other">Other</option>
            </select>
          ) : (
            <p className="text-gray-800 font-semibold capitalize">{discharge.dischargeCondition}</p>
          )}
        </div>

        {/* Follow-up Plan */}
        <div className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Follow-up Plan</h2>
          {isEditing ? (
            <textarea
              value={editData.followUpPlan || discharge.followUpPlan || ''}
              onChange={(e) => handleEditChange('followUpPlan', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              rows="4"
              placeholder="Enter follow-up plan..."
            />
          ) : (
            <p className="text-gray-700">{discharge.followUpPlan || 'No follow-up plan specified'}</p>
          )}
        </div>

        {/* Instructions to Patient */}
        <div className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Instructions to Patient</h2>
          {isEditing ? (
            <textarea
              value={editData.instructionsToPatient || discharge.instructionsToPatient || ''}
              onChange={(e) => handleEditChange('instructionsToPatient', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              rows="4"
              placeholder="Enter care instructions..."
            />
          ) : (
            <p className="text-gray-700">{discharge.instructionsToPatient || 'No instructions provided'}</p>
          )}
        </div>

        {/* Dietary Recommendations */}
        <div className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Dietary Recommendations</h2>
          {isEditing ? (
            <textarea
              value={editData.dietaryRecommendations || discharge.dietaryRecommendations || ''}
              onChange={(e) => handleEditChange('dietaryRecommendations', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              rows="3"
              placeholder="Enter dietary recommendations..."
            />
          ) : (
            <p className="text-gray-700">{discharge.dietaryRecommendations || 'No dietary recommendations'}</p>
          )}
        </div>

        {/* Discharging Doctor */}
        <div className="mb-8 pb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Discharging Physician</h2>
          <p className="text-gray-800 font-semibold">{discharge.dischargingDoctorName || 'N/A'}</p>
          {discharge.finalizationInfo?.finalizedAt && (
            <div className="mt-4 text-sm text-gray-600">
              <p>Finalized on: {new Date(discharge.finalizationInfo.finalizedAt).toLocaleString()}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
