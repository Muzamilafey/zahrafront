import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from 'contexts/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Facility Information - Update as needed
const FACILITY_INFO = {
  name: 'ZAHRA MATERNITY & CHILD CARE HOSPITAL',
  phone: 'TEL 0722568879',
  email: 'info@zahrahospital.com',
  address: 'Mogadishu, Somalia'
};

export default function DischargeSummaryPage() {
  const { id: patientId } = useParams();
  const { axiosInstance, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const printRef = useRef();

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

  // When no discharge summary exists, try to generate/create one and (optionally) finalize invoice
  const handleGenerateMissingSummary = async () => {
    setSaveMessage({ type: 'loading', text: 'Attempting to generate discharge summary...' });
    try {
      // Primary attempt: call the discharge endpoint which may create discharge summary and finalize invoice
      try {
        const res = await axiosInstance.post(`/patients/${patientId}/discharge`, { dischargeNotes: '' });
        // If server returned an invoice, navigate to the invoice view
        if (res.data && res.data.invoice && res.data.invoice._id) {
          setSaveMessage({ type: 'success', text: 'Invoice finalized — opening invoice' });
          setTimeout(() => setSaveMessage(null), 2500);
          navigate(`/billing/${res.data.invoice._id}`);
          return;
        }
        // If server returned a discharge summary object, reload it
        if (res.data && (res.data.discharge || res.data.summary || res.data.dischargeSummary)) {
          setSaveMessage({ type: 'success', text: 'Discharge summary created' });
          setTimeout(() => setSaveMessage(null), 2000);
          loadDischargeSummary();
          return;
        }
      } catch (e) {
        // proceed to fallback creation if the primary endpoint doesn't exist or failed
        console.warn('Primary discharge creation failed or not available:', e?.response?.status || e?.message);
      }

      // Fallback: fetch patient + admission info and POST to generic /discharge endpoint if available
      try {
        const pRes = await axiosInstance.get(`/patients/${patientId}`);
        const patientData = pRes.data.patient || pRes.data;
        const adm = patientData?.admission || (Array.isArray(patientData?.admissionHistory) && patientData.admissionHistory.length ? patientData.admissionHistory[patientData.admissionHistory.length - 1] : null);
        const payload = {
          patientId: patientId,
          patientInfo: {
            name: patientData.user?.name || patientData.name,
            mrn: patientData.mrn || patientData.hospitalId,
            age: patientData.age,
            gender: patientData.gender
          },
          admissionInfo: adm ? {
            admittedAt: adm.admittedAt,
            dischargedAt: adm.dischargedAt,
            ward: adm.ward,
            bed: adm.bed
          } : undefined,
        };
        try {
          const createRes = await axiosInstance.post(`/discharge`, payload);
          if (createRes.data && (createRes.data.discharge || createRes.data.summary || createRes.data.dischargeSummary)) {
            setSaveMessage({ type: 'success', text: 'Discharge summary created' });
            setTimeout(() => setSaveMessage(null), 2000);
            loadDischargeSummary();
            return;
          }
        } catch (ce) {
          console.warn('Fallback /discharge create failed:', ce?.response?.status || ce?.message);
        }
      } catch (pe) {
        console.warn('Failed to fetch patient for fallback creation:', pe?.message || pe);
      }

      setSaveMessage({ type: 'error', text: 'Could not generate discharge summary — backend may not support creation endpoints' });
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err) {
      console.error('Error generating missing discharge summary:', err);
      setSaveMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to generate discharge summary' });
      setTimeout(() => setSaveMessage(null), 4000);
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
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                if (!window.confirm('Attempt to generate a discharge summary (and finalize invoice if available)?')) return;
                handleGenerateMissingSummary();
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700"
            >
              Generate Discharge Summary / Invoice
            </button>
            <button
              onClick={() => loadDischargeSummary()}
              className="px-3 py-2 bg-gray-100 text-gray-800 rounded text-sm font-semibold hover:bg-gray-200"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isLocked = discharge.finalizationInfo?.locked;
  const canEdit = !isLocked && discharge.status !== 'finalized';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Toolbar - Hidden on Print */}
      <div className="sticky top-0 z-50 bg-white shadow-md border-b p-4 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Discharge Summary</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                {discharge.dischargeNumber}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isLocked
                  ? 'bg-green-100 text-green-800'
                  : discharge.status === 'reviewed'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {discharge.status === 'finalized' ? 'Finalized & Locked' : `Status: ${discharge.status}`}
              </span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            {canEdit && (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-2 rounded text-sm font-semibold transition ${
                    isEditing
                      ? 'bg-gray-500 text-white'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
                {isEditing && (
                  <button
                    onClick={handleSaveDraft}
                    className="px-3 py-2 bg-green-500 text-white text-sm rounded font-semibold hover:bg-green-600"
                  >
                    Save
                  </button>
                )}
                <button
                  onClick={handleRefresh}
                  className="px-3 py-2 bg-purple-500 text-white text-sm rounded font-semibold hover:bg-purple-600"
                >
                  Refresh
                </button>
                <button
                  onClick={handleFinalize}
                  className="px-3 py-2 bg-orange-500 text-white text-sm rounded font-semibold hover:bg-orange-600"
                >
                  Finalize
                </button>
                {user && user.role === 'admin' && (
                  <button
                    onClick={async () => {
                      if (!window.confirm('This will finalize admission invoice for the patient. Continue?')) return;
                      try {
                        setSaveMessage({ type: 'loading', text: 'Finalizing invoice...' });
                        const res = await axiosInstance.post(`/patients/${patientId}/discharge`, { dischargeNotes: '' });
                        setSaveMessage({ type: 'success', text: 'Invoice finalized' });
                        setTimeout(() => setSaveMessage(null), 3000);
                        if (res.data && res.data.invoice && res.data.invoice._id) {
                          navigate(`/billing/${res.data.invoice._id}`);
                          return;
                        }
                        // fallback: refresh discharge summary
                        loadDischargeSummary();
                      } catch (e) {
                        setSaveMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to finalize invoice' });
                        setTimeout(() => setSaveMessage(null), 4000);
                      }
                    }}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded font-semibold hover:bg-red-700"
                  >
                    Finalize Invoice
                  </button>
                )}
              </>
            )}
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-indigo-500 text-white text-sm rounded font-semibold hover:bg-indigo-600"
            >
              🖨️ Print
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={generatePDFLoading}
              className="px-3 py-2 bg-red-500 text-white text-sm rounded font-semibold hover:bg-red-600 disabled:opacity-50"
            >
              {generatePDFLoading ? 'Generating...' : '📄 PDF'}
            </button>
          </div>

          {saveMessage && (
            <div className={`w-full px-4 py-2 rounded text-sm font-semibold text-center ${
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

      {/* Printable Document */}
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div ref={printRef} id="discharge-summary-content" className="bg-white rounded-lg shadow-lg print:shadow-none">

          {/* === HOSPITAL HEADER === */}
          <div className="border-b-4 border-gray-800 p-6 md:p-8 text-center bg-gradient-to-b from-gray-50 to-white">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 tracking-wide">
              {FACILITY_INFO.name}
            </h1>
            <div className="text-sm md:text-base font-semibold text-gray-700 mb-4">
              <p>{FACILITY_INFO.phone}</p>
              <p>{FACILITY_INFO.email}</p>
            </div>
            <p className="text-xs md:text-sm text-gray-600 mb-6">
              {FACILITY_INFO.address}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-widest">
              DISCHARGE SUMMARY
            </h2>
          </div>

          {/* === PATIENT & ADMISSION DETAILS === */}
          <div className="p-6 md:p-8 border-b-2 border-gray-300">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6">
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">INPATIENT'S FILE NO.</p>
                <p className="text-sm md:text-base font-bold text-gray-900 border-b border-gray-400 pb-1">
                  {discharge.patientInfo.mrn || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">PATIENT'S NAME</p>
                <p className="text-sm md:text-base font-bold text-gray-900 border-b border-gray-400 pb-1">
                  {discharge.patientInfo.name}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">PATIENT'S AGE</p>
                <p className="text-sm md:text-base font-bold text-gray-900 border-b border-gray-400 pb-1">
                  {discharge.patientInfo.age} YEARS
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">DATE OF ADMISSION</p>
                <p className="text-sm md:text-base font-bold text-gray-900 border-b border-gray-400 pb-1">
                  {new Date(discharge.admissionInfo.admittedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">DATE OF DISCHARGE</p>
                <p className="text-sm md:text-base font-bold text-gray-900 border-b border-gray-400 pb-1">
                  {new Date(discharge.admissionInfo.dischargedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">WARD</p>
                <p className="text-sm md:text-base font-bold text-gray-900 border-b border-gray-400 pb-1">
                  {discharge.admissionInfo.ward || 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">ATTENDING DOCTOR(S)</p>
                <p className="text-sm md:text-base font-semibold text-gray-900 border-b border-gray-400 pb-1">
                  {discharge.dischargingDoctorName || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">GENDER</p>
                <p className="text-sm md:text-base font-semibold text-gray-900 border-b border-gray-400 pb-1">
                  {discharge.patientInfo.gender || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">BED/ROOM(S)</p>
                <p className="text-sm md:text-base font-semibold text-gray-900 border-b border-gray-400 pb-1">
                  {discharge.admissionInfo.bed || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* === DIAGNOSIS === */}
          <div className="p-6 md:p-8 border-b-2 border-gray-300">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 uppercase tracking-wide mb-4">DIAGNOSIS</h3>
            <div>
              <p className="text-sm font-semibold text-gray-700 uppercase mb-2">PRIMARY</p>
              <p className="text-base text-gray-900 font-semibold border-b-2 border-gray-400 pb-3 mb-4">
                {discharge.diagnosis.primary || 'N/A'}
              </p>
            </div>
            {discharge.diagnosis.secondary && discharge.diagnosis.secondary.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 uppercase mb-2">SECONDARY DIAGNOSIS/DIAGNOSES</p>
                <div className="text-base text-gray-900 border-b-2 border-gray-400 pb-3">
                  {discharge.diagnosis.secondary.map((diag, idx) => (
                    <p key={idx} className="mb-1">{idx + 1}. {diag}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* === INVESTIGATIONS === */}
          {discharge.investigations && discharge.investigations.length > 0 && (
            <div className="p-6 md:p-8 border-b-2 border-gray-300">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 uppercase tracking-wide mb-4">INVESTIGATIONS</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-400 bg-gray-100">
                      <th className="text-left p-2 font-bold text-gray-900">TEST</th>
                      <th className="text-left p-2 font-bold text-gray-900">POSITIVE</th>
                      <th className="text-left p-2 font-bold text-gray-900">INPUT</th>
                      <th className="text-left p-2 font-bold text-gray-900">NORMAL VALUES</th>
                      <th className="text-left p-2 font-bold text-gray-900">FLAG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discharge.investigations.map((inv, idx) => (
                      <tr key={idx} className="border-b border-gray-300">
                        <td className="p-2 text-gray-900">{inv.name}</td>
                        <td className="p-2 text-gray-900">{inv.findings ? 'YES' : '-'}</td>
                        <td className="p-2 text-gray-900">{inv.results || '-'}</td>
                        <td className="p-2 text-gray-900">{inv.findings || '-'}</td>
                        <td className="p-2 text-gray-900">{inv.status || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === OPERATIONS === */}
          {discharge.procedures && discharge.procedures.length > 0 && (
            <div className="p-6 md:p-8 border-b-2 border-gray-300">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 uppercase tracking-wide mb-4">OPERATIONS</h3>
              <div className="space-y-2">
                {discharge.procedures.map((proc, idx) => (
                  <p key={idx} className="text-base text-gray-900">
                    {idx + 1}) {proc.name}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* === MEDICATION === */}
          {discharge.medicationsOnDischarge && discharge.medicationsOnDischarge.length > 0 && (
            <div className="p-6 md:p-8 border-b-2 border-gray-300">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 uppercase tracking-wide mb-4">MEDICATION</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-400 bg-gray-100">
                      <th className="text-left p-2 font-bold text-gray-900">NO</th>
                      <th className="text-left p-2 font-bold text-gray-900">MEDICINE NAME</th>
                      <th className="text-left p-2 font-bold text-gray-900">DOSAGE</th>
                      <th className="text-left p-2 font-bold text-gray-900">FREQUENCY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discharge.medicationsOnDischarge.map((med, idx) => (
                      <tr key={idx} className="border-b border-gray-300">
                        <td className="p-2 text-gray-900">{idx + 1}</td>
                        <td className="p-2 text-gray-900">{med.name}</td>
                        <td className="p-2 text-gray-900">{med.dosage || '-'}</td>
                        <td className="p-2 text-gray-900">{med.frequency || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === DISCHARGE DRUGS === */}
          <div className="p-6 md:p-8 border-b-2 border-gray-300">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 uppercase tracking-wide mb-4">DISCHARGE DRUG(S)</h3>
            {isEditing ? (
              <textarea
                value={editData.dischargeNotes || discharge.dischargeNotes || ''}
                onChange={(e) => handleEditChange('dischargeNotes', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                rows="4"
              />
            ) : (
              <div className="text-sm text-gray-900 border-b-2 border-gray-400 pb-3 min-h-[60px]">
                {discharge.dischargeNotes ? (
                  discharge.dischargeNotes.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))
                ) : (
                  <p className="text-gray-500">See medications table above</p>
                )}
              </div>
            )}
          </div>

          {/* === CLINICAL SUMMARY === */}
          <div className="p-6 md:p-8 border-b-2 border-gray-300">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 uppercase tracking-wide mb-4">CLINICAL SUMMARY</h3>
            {isEditing ? (
              <textarea
                value={editData.hospitalStaySummary || discharge.hospitalStaySummary || ''}
                onChange={(e) => handleEditChange('hospitalStaySummary', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                rows="6"
              />
            ) : (
              <div className="text-base text-gray-900 whitespace-pre-wrap border-b-2 border-gray-400 pb-4 min-h-[100px]">
                {discharge.hospitalStaySummary || 'PATIENT WAS PRESENTED TO THE FACILITY WITH...'}
              </div>
            )}
          </div>

          {/* === FOLLOW-UP PLAN === */}
          <div className="p-6 md:p-8">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 uppercase tracking-wide mb-4">FOLLOW-UP PLAN</h3>
            {isEditing ? (
              <textarea
                value={editData.followUpPlan || discharge.followUpPlan || ''}
                onChange={(e) => handleEditChange('followUpPlan', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                rows="3"
              />
            ) : (
              <div className="text-base text-gray-900">
                {discharge.followUpPlan || 'Follow-up as advised'}
              </div>
            )}
          </div>

          {/* === SIGNATURE SECTION === */}
          <div className="p-6 md:p-8 border-t-4 border-gray-800 mt-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wide mb-16">DOCTOR'S NAME</p>
                <div className="border-b-2 border-gray-800"></div>
                <p className="text-xs text-gray-600 mt-2">SIGNATURE</p>
              </div>
              <div>
                <p className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wide mb-16">AUTHORIZED PERSON</p>
                <div className="border-b-2 border-gray-800"></div>
                <p className="text-xs text-gray-600 mt-2">SIGNATURE</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          #discharge-summary-content {
            box-shadow: none;
            border-radius: 0;
            max-width: 100%;
            page-break-inside: avoid;
          }
          @page {
            margin: 0.5in;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
