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
        // Fetch patient data instead of non-existent /discharge endpoint
        const patientResponse = await axiosInstance.get(`/patients/${patientId}`);
        const patientData = patientResponse.data.patient;
        
        // Get the most recent admission (discharge summary)
        let admissionData = null;
        if (patientData?.admissionHistory && patientData.admissionHistory.length > 0) {
          admissionData = patientData.admissionHistory[patientData.admissionHistory.length - 1];
        } else if (patientData?.admission) {
          admissionData = patientData.admission;
        }

        if (!admissionData) {
          setDischarge(null);
          setLoading(false);
          return;
        }

        // Fetch prescriptions for medications
        let medications = [];
        try {
          const prescRes = await axiosInstance.get(`/prescriptions`);
          if (prescRes.data.prescriptions && Array.isArray(prescRes.data.prescriptions)) {
            medications = prescRes.data.prescriptions
              .filter(p => p.appointment?.patient?._id === patientData._id)
              .flatMap(p => (p.drugs && Array.isArray(p.drugs)) ? p.drugs : []);
          }
        } catch (e) {
          console.warn('Could not load prescriptions:', e.message);
        }

        // Also fetch internal pharmacy requests for this patient
        try {
          const internalPharmRes = await axiosInstance.get(`/inpatient/internal-pharmacy/${patientId}`);
          if (internalPharmRes.data.requests && Array.isArray(internalPharmRes.data.requests)) {
            const internalMeds = internalPharmRes.data.requests.map(req => ({
              name: req.drugName,
              dosage: req.dosage || 'N/A',
              frequency: req.prescriptionTerm || 'As prescribed',
              dose: req.dosage,
              price: req.price,
              quantity: req.quantity
            }));
            medications = [...medications, ...internalMeds];
          }
        } catch (e) {
          console.warn('Could not load internal pharmacy requests:', e.message);
        }

        // Fetch charges/invoices
        let charges = [];
        try {
          const billingRes = await axiosInstance.get(`/billing`);
          if (billingRes.data.invoices && Array.isArray(billingRes.data.invoices)) {
            charges = billingRes.data.invoices
              .filter(inv => (inv.patient?._id === patientData._id || inv.patientId === patientId) && inv.items)
              .flatMap(inv => (Array.isArray(inv.items) ? inv.items : []));
          }
        } catch (e) {
          console.warn('Could not load billing:', e.message);
        }

        // Also fetch management charges if available
        try {
          const chargesRes = await axiosInstance.get(`/charges`);
          if (chargesRes.data && Array.isArray(chargesRes.data)) {
            const patientCharges = chargesRes.data.filter(c => c.patient?._id === patientData._id || c.patientId === patientId);
            const chargeItems = patientCharges.map(c => ({
              description: c.description || c.name || 'Service Charge',
              qty: c.quantity || 1,
              amount: c.amount || c.price || 0
            }));
            charges = [...charges, ...chargeItems];
          }
        } catch (e) {
          console.warn('Could not load management charges:', e.message);
        }

        // Build discharge object from patient data
        const discharge = {
          patientInfo: {
            name: `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim() || patientData.user?.name || 'Unknown',
            mrn: patientData.mrn || patientData.hospitalId || 'N/A',
            dob: patientData.dob
          },
          dischargingDoctorName: admissionData?.attendingDoctor?.name || admissionData?.doctorName || 'N/A',
          admissionInfo: {
            admittedAt: admissionData?.admittedAt,
            dischargedAt: admissionData?.dischargedAt
          },
          diagnosis: {
            primary: admissionData?.finalDiagnosis || admissionData?.dischargeDiagnosis || admissionData?.admissionDiagnosis || 'N/A',
            secondary: admissionData?.secondaryDiagnoses || []
          },
          hospitalStaySummary: admissionData?.clinicalSummary || admissionData?.summaryOfHospitalCourse || 'N/A',
          dischargeNotes: admissionData?.dischargeNotes || admissionData?.clinicalSummary || 'N/A',
          medicationsOnDischarge: medications.map(med => ({
            name: med.name || med.medicationName || 'Unknown',
            dosage: med.dosage || med.dose || 'N/A',
            frequency: med.frequency || med.prescriptionTerm || 'N/A'
          })),
          instructionsToPatient: admissionData?.dischargeInstructions || 'Follow medication schedule and attend follow-up appointments as advised.',
          followUpPlan: admissionData?.followUpDate ? `Follow-up on ${new Date(admissionData.followUpDate).toLocaleDateString()}` : 'To be arranged',
          charges: charges.map(charge => ({
            description: charge.description || charge.name || 'Service',
            qty: charge.quantity || 1,
            amount: charge.amount || charge.price || 0
          }))
        };

        setDischarge(discharge);
      } catch (error) {
        console.error('Failed to load discharge summary:', error);
        setDischarge(null);
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