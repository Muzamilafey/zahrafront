import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { FaArrowLeft, FaPrint, FaDownload } from 'react-icons/fa';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function DischargedPatientSummary() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const [patient, setPatient] = useState(null);
  const [admission, setAdmission] = useState(null);
  const [medications, setMedications] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [bedSummary, setBedSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hospital, setHospital] = useState(null);

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load patient details
      const patientRes = await axiosInstance.get(`/patients/${patientId}`);
      const patientData = patientRes.data.patient;
      setPatient(patientData);
      
      // Get the most recent admission (which should be discharged)
      let admissionData = null;
      if (patientData?.admissionHistory && patientData.admissionHistory.length > 0) {
        // Get the last (most recent) admission from history
        admissionData = patientData.admissionHistory[patientData.admissionHistory.length - 1];
      } else if (patientData?.admission?.dischargedAt) {
        // Fallback to current admission if it's discharged
        admissionData = patientData.admission;
      }
      
      if (admissionData) {
        setAdmission(admissionData);
        setBedSummary({
          ward: admissionData.ward || '-',
          bed: admissionData.bed || '-',
          roomNumber: admissionData.room || '-',
          admittedAt: admissionData.admittedAt,
          dischargedAt: admissionData.dischargedAt,
        });
      }

      // Load prescriptions for this patient (which should include medications)
      try {
        const prescRes = await axiosInstance.get(`/prescriptions`);
        if (prescRes.data.prescriptions && admissionData) {
          // Filter prescriptions from the discharge period for this patient
          const relevantPrescriptions = prescRes.data.prescriptions
            .filter(p => {
              // Check if prescription's appointment's patient matches
              if (p.appointment?.patient?._id !== patientData._id) return false;
              // Check if prescription is within admission period
              if (!admissionData?.admittedAt || !admissionData?.dischargedAt) return true;
              const pDate = new Date(p.createdAt || p.appointment?.date || p.prescribedDate);
              const admitDate = new Date(admissionData.admittedAt);
              const dischargeDate = new Date(admissionData.dischargedAt);
              return pDate >= admitDate && pDate <= dischargeDate;
            })
            .flatMap(p => p.drugs || []);
          
          setMedications(relevantPrescriptions);
        }
      } catch (e) {
        console.warn('Could not load prescriptions:', e.message);
        // Set empty array instead of error
        setMedications([]);
      }

      // Load lab tests/orders for this patient
      try {
        const labRes = await axiosInstance.get(`/lab/orders`);
        if (labRes.data.orders || labRes.data.tests) {
          const allTests = labRes.data.orders || labRes.data.tests || [];
          // Filter lab tests from the discharge period for this patient
          const relevantTests = allTests.filter(t => {
            // Check if test's patient matches
            if (t.patient?._id !== patientData._id && t.patient !== patientData._id) return false;
            // Check if test is within admission period
            if (!admissionData?.admittedAt || !admissionData?.dischargedAt) return true;
            const tDate = new Date(t.createdAt || t.date || t.requestedAt);
            const admitDate = new Date(admissionData.admittedAt);
            const dischargeDate = new Date(admissionData.dischargedAt);
            return tDate >= admitDate && tDate <= dischargeDate;
          });
          setLabTests(relevantTests);
        }
      } catch (e) {
        console.warn('Could not load lab tests:', e.message);
        // Set empty array instead of error
        setLabTests([]);
      }
      // load hospital settings for header/logo
      try{
        const hRes = await axiosInstance.get('/setting/hospital-details');
        setHospital(hRes.data || null);
      }catch(err){ /* ignore */ }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const calculateLOS = () => {
    if (!bedSummary?.admittedAt || !bedSummary?.dischargedAt) return null;
    const admitted = new Date(bedSummary.admittedAt);
    const discharged = new Date(bedSummary.dischargedAt);
    const days = Math.ceil((discharged - admitted) / (1000 * 60 * 60 * 24));
    return days;
  };

  const calculateMedicationCost = () => {
    return medications.reduce((sum, med) => sum + (med.totalCost || 0), 0);
  };

  const calculateLabTestsCost = () => {
    return labTests.reduce((sum, test) => sum + (test.price || test.amount || 0), 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePdf = async () => {
    const element = document.getElementById('discharge-summary');
    if (!element) return alert('Nothing to generate');
    try {
      // render element to canvas
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const filename = `discharge-${patient?.mrn || patient?._id || 'summary'}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF generation failed', err);
      alert('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">Loading discharge summary...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-brand-600 hover:text-brand-700"
        >
          <FaArrowLeft /> Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          {error || 'Patient not found'}
        </div>
      </div>
    );
  }

  const los = calculateLOS();
  const medicationTotal = calculateMedicationCost();
  const labTestsTotal = calculateLabTestsCost();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-brand-600 hover:text-brand-700"
          >
            <FaArrowLeft /> Back to Discharged Patients
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Discharge Summary</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGeneratePdf}
            className="btn-brand flex items-center gap-2"
          >
            <FaDownload /> Generate PDF
          </button>
          <button
            onClick={handlePrint}
            className="btn-outline flex items-center gap-2"
          >
            <FaPrint /> Print
          </button>
        </div>
      </div>

      {/* Printable container (wrapped so html2canvas captures only this) */}
      <div id="discharge-summary">
      {/* Patient Header Card */}
      <div className="bg-gradient-to-r from-brand-50 to-brand-100 border border-brand-200 rounded-lg p-6 mb-6">
        {/* render hospital header/logo if available */}
        {hospital && (hospital.name || hospital.logo || hospital.logoUrl) && (
          <div className="mb-4 flex justify-between items-start">
            <div>
              <div className="text-lg font-bold">{hospital.name}</div>
              {hospital.location && <div className="text-sm text-gray-600">{hospital.location}</div>}
            </div>
            { (hospital.logo || hospital.logoUrl) && (
              <div className="w-24 h-24 ml-4">
                <img src={hospital.logo || hospital.logoUrl} alt="hospital logo" className="object-contain w-full h-full" />
              </div>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Patient Name</div>
            <div className="text-xl font-bold text-gray-800">{patient.user?.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">MRN / Hospital ID</div>
            <div className="text-lg font-semibold text-gray-800">
              {patient.mrn || '-'} / {patient.hospitalId || '-'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Status</div>
            <div className="text-lg font-semibold text-green-600">✓ Discharged</div>
            <div className="text-sm text-gray-600 mt-2">Age / Gender</div>
            <div className="font-medium">{patient.age ? `${patient.age} yrs` : '-'} / {patient.gender || '-'}</div>
            <div className="text-sm text-gray-600 mt-2">Attending Doctor</div>
            <div className="font-medium">{admission?.attendingDoctor?.name || admission?.doctorName || '-'}</div>
            <div className="text-sm text-gray-600 mt-2">Diagnosis at Admission</div>
            <div className="font-medium">{admission?.admissionDiagnosis || admission?.presentingDiagnosis || '-'}</div>
          </div>
        </div>
      </div>

          {/* Discharge Details */}
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h2 className="text-lg font-semibold mb-4">Discharge Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Patient Number</div>
                <div className="font-medium">{patient.mrn || patient.hospitalId || patient._id}</div>
                <div className="text-sm text-gray-600 mt-2">Admission Number</div>
                <div className="font-medium">{admission?.admissionNumber || admission?._id || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Patient Demographics</div>
                <div className="font-medium">{patient.user?.name || '-'} • {patient.age ? `${patient.age} yrs` : '-'} • {patient.gender || '-'}</div>
                <div className="text-sm text-gray-600 mt-2">Contact</div>
                <div className="font-medium">{patient.phone || patient.contact || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Attending Doctor</div>
                <div className="font-medium">{admission?.attendingDoctor?.name || admission?.doctorName || '-'}</div>
                <div className="text-sm text-gray-600 mt-2">Ward / Bed</div>
                <div className="font-medium">{bedSummary?.ward || '-'} / {bedSummary?.bed || '-'}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-sm text-gray-600">Admission Date & Time</div>
                <div className="font-medium">{bedSummary?.admittedAt ? new Date(bedSummary.admittedAt).toLocaleString() : '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Discharge Date & Time</div>
                <div className="font-medium">{bedSummary?.dischargedAt ? new Date(bedSummary.dischargedAt).toLocaleString() : '-'}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600">Diagnosis at Admission</div>
              <div className="font-medium">{admission?.admissionDiagnosis || admission?.presentingDiagnosis || '-'}</div>
            </div>
            <div className="mt-2">
              <div className="text-sm text-gray-600">Final Diagnosis</div>
              <div className="font-medium">{admission?.finalDiagnosis || admission?.dischargeDiagnosis || '-'}</div>
            </div>
          </div>

      {/* Admission & Discharge Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Admission Details */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Admission Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Admitted Date & Time:</span>
              <span className="font-medium">
                {bedSummary?.admittedAt
                  ? new Date(bedSummary.admittedAt).toLocaleString()
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Discharged Date & Time:</span>
              <span className="font-medium">
                {bedSummary?.dischargedAt
                  ? new Date(bedSummary.dischargedAt).toLocaleString()
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Length of Stay:</span>
              <span className="font-medium text-lg">
                {los ? `${los} day${los !== 1 ? 's' : ''}` : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Bed Summary */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Bed Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Ward:</span>
              <span className="font-medium">{bedSummary?.ward || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bed Number:</span>
              <span className="font-medium">{bedSummary?.bed || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Room:</span>
              <span className="font-medium">{bedSummary?.roomNumber || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Medications Taken */}
      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
        <div className="bg-gray-100 border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Medications Administered</h2>
        </div>
        <div className="p-6">
          {medications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No medications recorded for this admission</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Medicine Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Dosage</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Frequency</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-700">Days</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Unit Cost</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {medications.map((med, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{med.name || med.medicationName || '-'}</td>
                      <td className="px-4 py-3">{med.dosage || '-'}</td>
                      <td className="px-4 py-3">{med.frequency || '-'}</td>
                      <td className="text-center px-4 py-3">{med.daysSupplied || med.duration || '-'}</td>
                      <td className="text-right px-4 py-3 font-medium">${(med.unitCost || 0).toFixed(2)}</td>
                      <td className="text-right px-4 py-3 font-semibold text-green-700">
                        ${(med.totalCost || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan="5" className="text-right px-4 py-3">Medications Total:</td>
                    <td className="text-right px-4 py-3 text-lg text-green-700">
                      ${medicationTotal.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Hospital Stay Summary */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h2 className="text-lg font-semibold mb-4">Hospital Stay Summary</h2>
        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-600">Reason for Admission</div>
            <div className="font-medium">{admission?.reasonForAdmission || admission?.presentingComplaint || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Summary of Clinical Findings</div>
            <div className="font-medium">{admission?.clinicalFindings || admission?.summary || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Major Events During Stay</div>
            <div className="font-medium">{(admission?.majorEvents && admission.majorEvents.length) ? admission.majorEvents.join('; ') : (admission?.events ? admission.events.join('; ') : '-')}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Key Investigations</div>
            <div className="font-medium">{labTests.length > 0 ? labTests.map(t => t.name || t.testName).join(', ') : '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Procedures Performed</div>
            <div className="font-medium">{(admission?.procedures && admission.procedures.length) ? admission.procedures.join('; ') : (admission?.proceduresPerformed ? admission.proceduresPerformed.join('; ') : '-')}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Final Primary Diagnosis</div>
            <div className="font-medium">{admission?.finalDiagnosis || admission?.dischargeDiagnosis || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Secondary / Additional Diagnoses</div>
            <div className="font-medium">{(admission?.secondaryDiagnoses && admission.secondaryDiagnoses.length) ? admission.secondaryDiagnoses.join('; ') : '-'}</div>
          </div>
        </div>
      </div>

      {/* Treatment Given */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h2 className="text-lg font-semibold mb-4">Treatment Given</h2>
        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-600">Medications Given During Admission</div>
            <div className="font-medium">{medications.length > 0 ? medications.map(m => m.name || m.medicationName).join(', ') : '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Treatments / Interventions</div>
            <div className="font-medium">{(admission?.treatments && admission.treatments.length) ? admission.treatments.join('; ') : (admission?.interventions ? admission.interventions.join('; ') : '-')}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Surgery / Procedure Notes</div>
            <div className="font-medium">{admission?.surgeryNotes || admission?.operationNotes || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Response to Treatment</div>
            <div className="font-medium">{admission?.responseToTreatment || admission?.treatmentResponse || '-'}</div>
          </div>
        </div>
      </div>

      {/* Discharge Medications (structured) */}
      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
        <div className="bg-gray-100 border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Discharge Medications</h2>
        </div>
        <div className="p-6">
          {medications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No discharge medications recorded</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Drug Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Dosage</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Frequency</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Duration</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {medications.map((m, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{m.name || m.medicationName || '-'}</td>
                      <td className="px-4 py-3">{m.dosage || m.dose || '-'}</td>
                      <td className="px-4 py-3">{m.frequency || '-'}</td>
                      <td className="px-4 py-3">{m.daysSupplied || m.duration || '-'}</td>
                      <td className="px-4 py-3">{m.instructions || m.specialInstructions || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Condition at Discharge */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h2 className="text-lg font-semibold mb-4">Condition at Discharge</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Physical Examination Status</div>
            <div className="font-medium">{admission?.physicalExam || admission?.dischargePhysical || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Stability of the Patient</div>
            <div className="font-medium">{admission?.stability || admission?.dischargeStability || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Discharge Mode</div>
            <div className="font-medium">{admission?.dischargeMode || admission?.dischargedTo || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Mobility and Functional Status</div>
            <div className="font-medium">{admission?.mobilityStatus || admission?.functionalStatus || '-'}</div>
          </div>
        </div>
      </div>

      {/* Follow-Up Plan */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h2 className="text-lg font-semibold mb-4">Follow-Up Plan</h2>
        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-600">Clinic / Doctor to Review</div>
            <div className="font-medium">{admission?.followUp?.clinic || admission?.followUpDoctor || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Follow-Up Date</div>
            <div className="font-medium">{admission?.followUp?.date ? new Date(admission.followUp.date).toLocaleDateString() : (admission?.followUpDate ? new Date(admission.followUpDate).toLocaleDateString() : '-')}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Required Investigations Before Follow-Up</div>
            <div className="font-medium">{(admission?.followUp?.requiredInvestigations && admission.followUp.requiredInvestigations.length) ? admission.followUp.requiredInvestigations.join(', ') : (admission?.requiredInvestigations ? admission.requiredInvestigations.join(', ') : '-')}</div>
          </div>
        </div>
      </div>

      {/* Patient Instructions */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h2 className="text-lg font-semibold mb-4">Patient Instructions</h2>
        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-600">Diet Recommendations</div>
            <div className="font-medium">{admission?.instructions?.diet || admission?.dietInstructions || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Activity / Mobility Guidance</div>
            <div className="font-medium">{admission?.instructions?.activity || admission?.activityInstructions || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Wound Care Instructions</div>
            <div className="font-medium">{admission?.instructions?.woundCare || admission?.woundCare || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Red Flags / Danger Signs</div>
            <div className="font-medium">{admission?.instructions?.redFlags || admission?.redFlags || '-'}</div>
          </div>
        </div>
      </div>

      {/* Lab Tests Taken */}
      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
        <div className="bg-gray-100 border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Laboratory Tests Performed</h2>
        </div>
        <div className="p-6">
          {labTests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No lab tests recorded for this admission</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Test Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Test Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Date Performed</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {labTests.map((test, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{test.name || test.testName || '-'}</td>
                      <td className="px-4 py-3">{test.type || test.category || '-'}</td>
                      <td className="px-4 py-3">
                        {test.date
                          ? new Date(test.date).toLocaleDateString()
                          : test.createdAt
                          ? new Date(test.createdAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            test.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : test.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {test.status || 'pending'}
                        </span>
                      </td>
                      <td className="text-right px-4 py-3 font-semibold text-green-700">
                        ${(test.price || test.amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan="4" className="text-right px-4 py-3">Lab Tests Total:</td>
                    <td className="text-right px-4 py-3 text-lg text-green-700">
                      ${labTestsTotal.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Radiology Summary & Pending Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Radiology Summary</h2>
          <div className="space-y-3">
            <div className="font-medium">{(admission?.radiologyReports && admission.radiologyReports.length) ? admission.radiologyReports.map(r => r.title || r.name).join('; ') : (labTests.filter(t => (t.category || t.type || '').toLowerCase().includes('radi')).length ? labTests.filter(t => (t.category || t.type || '').toLowerCase().includes('radi')).map(t => t.name || t.testName).join(', ') : '-')}</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Pending / Uncompleted Tests</h2>
          <div className="space-y-3">
            {labTests.filter(t => (t.status || 'pending') !== 'completed').length === 0 ? (
              <div className="font-medium">None</div>
            ) : (
              <ul className="list-disc pl-5">
                {labTests.filter(t => (t.status || 'pending') !== 'completed').map((t, i) => (
                  <li key={i} className="font-medium">{t.name || t.testName} — {t.status || 'pending'}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Summary Totals */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-300 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Discharge Summary Totals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded p-4 shadow">
            <div className="text-sm text-gray-600">Medications Cost</div>
            <div className="text-2xl font-bold text-blue-600">${medicationTotal.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded p-4 shadow">
            <div className="text-sm text-gray-600">Lab Tests Cost</div>
            <div className="text-2xl font-bold text-purple-600">${labTestsTotal.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded p-4 shadow">
            <div className="text-sm text-gray-600">Total Discharge Cost</div>
            <div className="text-2xl font-bold text-green-600">
              ${(medicationTotal + labTestsTotal).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Referral & Sign-off */}
      <div className="bg-white rounded-lg shadow mt-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Referral Information</div>
            <div className="font-medium">{admission?.referral || admission?.referredTo || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Doctor's Signature</div>
            <div className="font-medium mt-6">{admission?.attendingDoctor?.name || admission?.doctorName || '-'}</div>
            <div className="text-sm text-gray-600">Timestamp</div>
            <div className="font-medium">{bedSummary?.dischargedAt ? new Date(bedSummary.dischargedAt).toLocaleString() : new Date().toLocaleString()}</div>
          </div>
        </div>
      </div>
      </div>
      {/* Print Styles */}
      <style>{`
        @media print {
          button { display: none !important; }
          .print-hide { display: none !important; }
        }
      `}</style>
    </div>
  );
}
