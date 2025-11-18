import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import DischargeSummary from '../../components/DischargeSummary';
import Invoice from '../../components/Invoice';
import Spinner from '../../components/Spinner';
import PatientSearch from '../../components/patientSearch';

// This page bridges the .tsx presentation components with the backend API
export default function NewDischargeSummary() {
  const { id: routePatientId } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patient, setPatient] = useState(null);
  const [summaryDetails, setSummaryDetails] = useState(null);
  const [charges, setCharges] = useState([]);
  const [activeTab, setActiveTab] = useState('summary');

  const fetchForPatient = async (patientId) => {
    setLoading(true);
    setError(null);
    try {
      // Patient
      const pRes = await axiosInstance.get(`/patients/${patientId}`);
      const pData = pRes.data?.data || pRes.data || {};

      const transformedPatient = {
        id: pData._id || pData.id || patientId,
        name: pData.firstName && pData.lastName ? `${pData.firstName} ${pData.lastName}` : (pData.fullName || pData.name || 'Unknown'),
        dob: pData.dateOfBirth || pData.dob || 'N/A',
        gender: pData.gender || 'Other',
        address: pData.address || 'N/A',
        contact: pData.phone || pData.contact || 'N/A',
        admissionDate: pData.admissionDate || pData.admittedAt || 'N/A',
        dischargeDate: pData.dischargeDate || pData.dischargedAt || 'N/A',
        admittingPhysician: typeof pData.admittingPhysician === 'object' ? (pData.admittingPhysician?.name || 'N/A') : (pData.admittingPhysician || 'N/A')
      };

      setPatient(transformedPatient);

      // Discharge summary (by discharge id or patient id)
      let summary = null;
      try {
        const sRes = await axiosInstance.get(`/discharge/patient/${patientId}`);
        // endpoint returns list; pick latest
        const list = sRes.data?.data || sRes.data || [];
        summary = Array.isArray(list) && list.length ? list[list.length - 1] : (list || null);
      } catch (e) {
        // fallback: try discharge by id
        try {
          const sRes2 = await axiosInstance.get(`/discharge/${patientId}`);
          summary = sRes2.data?.data || sRes2.data || null;
        } catch (e2) {
          console.warn('No discharge summary found for patient', patientId);
        }
      }

      if (summary) {
        // normalize summary fields to match DischargeSummaryDetails
        const meds = Array.isArray(summary.medicationsOnDischarge)
          ? summary.medicationsOnDischarge
          : (Array.isArray(summary.medications) ? summary.medications : []);

        const normalizedMeds = meds.map(m => ({
          name: m.name || m.medicationName || m.drug || 'Unknown',
          dosage: m.dosage || m.dose || m.quantity || 'N/A',
          frequency: m.frequency || m.frequencyText || 'N/A'
        }));

        const procedures = Array.isArray(summary.proceduresPerformed)
          ? summary.proceduresPerformed
          : (Array.isArray(summary.procedures) ? summary.procedures : []);

        const transformedSummary = {
          admissionDiagnosis: summary.admissionDiagnosis || summary.diagnosis || summary.primaryDiagnosis || 'N/A',
          finalDiagnosis: summary.finalDiagnosis || summary.finalDiagnosisText || 'N/A',
          hospitalCourse: summary.hospitalCourse || summary.clinicalCourse || summary.notes || 'N/A',
          proceduresPerformed: procedures.map(p => typeof p === 'string' ? p : (p.name || p.procedureName || p)),
          medicationsOnDischarge: normalizedMeds,
          followUpInstructions: summary.followUpPlan || summary.followUpInstructions || summary.dischargePlan || 'Follow up as advised',
          conditionOnDischarge: summary.dischargeCondition || 'Stable'
        };

        setSummaryDetails(transformedSummary);

        // Attach invoice/charges if provided on summary
        if (summary.charges && Array.isArray(summary.charges)) {
          const ch = summary.charges.map((c, i) => ({
            id: c._id || `c${i}`,
            description: c.description || c.name || c.item || 'Charge',
            quantity: c.quantity || c.qty || 1,
            unitPrice: parseFloat(c.unitPrice || c.amount || c.price || 0)
          }));
          setCharges(ch);
        }
      } else {
        // no summary: clear details
        setSummaryDetails(null);
        setCharges([]);
      }

      // Billing fallback: fetch invoice or billing by patient
      try {
        const billRes = await axiosInstance.get(`/billing/${patientId}`);
        const billData = billRes.data?.data || billRes.data || {};
        if (Array.isArray(billData.lineItems) && billData.lineItems.length) {
          const mapped = billData.lineItems.map((c, i) => ({
            id: c._id || `b${i}`,
            description: c.description || c.name || 'Charge',
            quantity: c.quantity || 1,
            unitPrice: parseFloat(c.unitPrice || c.amount || c.price || 0)
          }));
          setCharges(mapped);
        }
      } catch (e) {
        // ignore
      }

    } catch (err) {
      console.error('Failed fetching discharge page data', err);
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routePatientId) fetchForPatient(routePatientId);
  }, [routePatientId]);

  const handleSearch = (id) => {
    // navigate to canonical route so URL is shareable
    navigate(`/patients/${id}/discharge-summary`);
    // fetch will be triggered by route change
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <PatientSearch onSearch={handleSearch} isLoading={loading} />
        </div>

        {loading && (
          <div className="py-12"><Spinner /></div>
        )}

        {!loading && error && (
          <div className="bg-white p-6 rounded shadow text-red-600">{error}</div>
        )}

        {!loading && !patient && (
          <div className="bg-white p-6 rounded shadow">No patient selected. Use the search box above.</div>
        )}

        {!loading && patient && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold">Discharge - {patient.name}</h1>
              <div className="space-x-2">
                <button className={`px-4 py-2 rounded ${activeTab==='summary'?'bg-blue-600 text-white':'bg-white border'}`} onClick={()=>setActiveTab('summary')}>Summary</button>
                <button className={`px-4 py-2 rounded ${activeTab==='invoice'?'bg-blue-600 text-white':'bg-white border'}`} onClick={()=>setActiveTab('invoice')}>Invoice</button>
              </div>
            </div>

            <div>
              {activeTab === 'summary' && (
                summaryDetails ? (
                  <DischargeSummary patient={patient} summaryDetails={summaryDetails} />
                ) : (
                  <div className="bg-white p-6 rounded shadow">No discharge summary found for this patient.</div>
                )
              )}

              {activeTab === 'invoice' && (
                <Invoice patient={patient} charges={charges} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
