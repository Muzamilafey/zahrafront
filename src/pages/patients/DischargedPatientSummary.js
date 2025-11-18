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
  const [editingDiagnoses, setEditingDiagnoses] = useState(false);
  const [draftFinalDiagnosis, setDraftFinalDiagnosis] = useState('');
  const [draftSecondaryDiagnoses, setDraftSecondaryDiagnoses] = useState([]);
  const [diagSaving, setDiagSaving] = useState(false);
  const [diagMessage, setDiagMessage] = useState(null);
  const [diagSuggestions, setDiagSuggestions] = useState([]);
  const [diagLoadingSuggestions, setDiagLoadingSuggestions] = useState(false);
  const [diagSugForIndex, setDiagSugForIndex] = useState(null); // null = none, -1 = final diagnosis, >=0 = secondary index
  const diagSugTimer = React.useRef(null);
  const [dischargeLoading, setDischargeLoading] = useState(false);
  const [dischargeMessage, setDischargeMessage] = useState(null);

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  // when admission changes, initialize drafts
  useEffect(() => {
    if (admission) {
      setDraftFinalDiagnosis(admission.finalDiagnosis || admission.dischargeDiagnosis || '');
      const secs = (admission.secondaryDiagnoses && admission.secondaryDiagnoses.length) ? admission.secondaryDiagnoses.slice() : [];
      setDraftSecondaryDiagnoses(secs);
    }
  }, [admission]);

  // ICD-10 / diagnosis autocomplete
  const fetchDiagSuggestions = async (q, forIndex = -1) => {
    if (!q || q.trim().length < 2) { setDiagSuggestions([]); setDiagLoadingSuggestions(false); return; }
    setDiagLoadingSuggestions(true);
    try {
      const resp = await axiosInstance.get(`/diagnoses?q=${encodeURIComponent(q)}`);
      setDiagSuggestions(resp.data.results || []);
      setDiagSugForIndex(forIndex);
    } catch (e) {
      setDiagSuggestions([]);
    } finally { setDiagLoadingSuggestions(false); }
  };

  const scheduleFetchDiag = (q, forIndex = -1) => {
    if (diagSugTimer.current) clearTimeout(diagSugTimer.current);
    diagSugTimer.current = setTimeout(()=>fetchDiagSuggestions(q, forIndex), 300);
  };

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

      // Load internal pharmacy requests for this patient
      try {
        const internalPharmRes = await axiosInstance.get(`/inpatient/internal-pharmacy/${patientId}`);
        if (internalPharmRes.data.requests && Array.isArray(internalPharmRes.data.requests)) {
          // Convert internal pharmacy requests to medication format
          const internalMeds = internalPharmRes.data.requests.map(req => ({
            _id: req._id,
            name: req.drugName,
            batchNumber: req.batchNumber,
            quantity: req.quantity,
            prescriptionTerm: req.prescriptionTerm,
            duration: req.duration,
            instructions: req.instructions,
            totalCost: (req.price || 0) * (req.quantity || 1),
            price: req.price,
            isInternalRequest: true,
            internalRequestId: req._id,
            createdAt: req.createdAt
          }));
          // Merge with prescriptions
          setMedications(prev => [...prev, ...internalMeds]);
        }
      } catch (e) {
        console.warn('Could not load internal pharmacy requests:', e.message);
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

      // Load internal lab requests for this patient
      try {
        const internalLabRes = await axiosInstance.get(`/inpatient/internal-lab/${patientId}`);
        if (internalLabRes.data.requests && Array.isArray(internalLabRes.data.requests)) {
          // Convert internal lab requests to test format
          const internalTests = internalLabRes.data.requests.map(req => ({
            _id: req._id,
            name: req.testName,
            testType: req.testType,
            isInternalRequest: true,
            internalRequestId: req._id,
            createdAt: req.createdAt,
            status: req.status
          }));
          // Merge with lab tests
          setLabTests(prev => [...prev, ...internalTests]);
        }
      } catch (e) {
        console.warn('Could not load internal lab requests:', e.message);
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

  const handleDischargePatient = async () => {
    if (!window.confirm('Are you sure you want to discharge this patient? This will free the bed and finalize the admission.')) return;
    setDischargeLoading(true);
    setDischargeMessage(null);
    try {
      // Discharge the patient: mark admission as not admitted, set dischargedAt
      const dischargePayload = {
        dischargedAt: new Date().toISOString(),
        isAdmitted: false,
        finalDiagnosis: draftFinalDiagnosis,
        secondaryDiagnoses: draftSecondaryDiagnoses.filter(Boolean)
      };

      // try put to /patients/:id/admission first
      try {
        await axiosInstance.put(`/patients/${patientId}/admission`, dischargePayload);
      } catch (e) {
        if (e?.response?.status === 404 || e?.response?.status === 400) {
          // fallback: try /admissions/:id if patient admission endpoint fails
          if (admission?._id) {
            await axiosInstance.put(`/admissions/${admission._id}`, dischargePayload);
          } else throw e;
        } else throw e;
      }

      // also try to free the bed if bed info is available
      if (admission?.bed && admission?.ward) {
        try {
          await axiosInstance.post(`/wards/${admission.ward}/beds/${admission.bed}/release`);
        } catch (be) {
          console.warn('Failed to release bed:', be?.response?.data || be.message);
          // don't block on bed release failure
        }
      }

      setDischargeMessage({ type: 'success', text: 'Patient discharged successfully' });
      // reload patient data to reflect discharge
      setTimeout(() => loadPatientData(), 1500);
    } catch (err) {
      console.error('Discharge failed', err);
      setDischargeMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to discharge patient' });
    } finally {
      setDischargeLoading(false);
      setTimeout(() => setDischargeMessage(null), 4000);
    }
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

  // Attempt to generate a discharge summary and/or finalize invoice when missing
  const handleGenerateMissingSummary = async () => {
    if (!window.confirm('Attempt to generate a discharge summary (and finalize invoice if available)?')) return;
    setDischargeLoading(true);
    setDischargeMessage(null);
    try {
      // Primary: ask server to discharge the patient which may create summary and invoice
      try {
        const res = await axiosInstance.post(`/patients/${patientId}/discharge`, { dischargeNotes: '' });
        if (res.data && res.data.invoice && res.data.invoice._id) {
          setDischargeMessage({ type: 'success', text: 'Invoice finalized — opening invoice' });
          setTimeout(() => setDischargeMessage(null), 3000);
          const invoiceId = res?.data?.invoice?._id || res?.data?.invoiceId || res?.data?._id || res?.data?.id;
          if (invoiceId) {
            navigate(`/billing/${invoiceId}`);
            return;
          }
          // fallback to billing list filtered by patient
          navigate(`/billing?patientId=${encodeURIComponent(patientId)}`);
          return;
        }
        if (res.data && (res.data.discharge || res.data.summary || res.data.dischargeSummary)) {
          setDischargeMessage({ type: 'success', text: 'Discharge summary created' });
          setTimeout(() => setDischargeMessage(null), 2000);
          loadPatientData();
          return;
        }
      } catch (e) {
        console.warn('Primary discharge creation failed:', e?.response?.status || e?.message);
      }

      // Fallback: try generic /discharge create endpoint
      try {
        const pRes = await axiosInstance.get(`/patients/${patientId}`);
        const patientData = pRes.data.patient || pRes.data;
        const adm = patientData?.admission || (Array.isArray(patientData?.admissionHistory) && patientData.admissionHistory.length ? patientData.admissionHistory[patientData.admissionHistory.length - 1] : null);
        const payload = {
          patientId,
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
        const createRes = await axiosInstance.post(`/discharge`, payload);
        if (createRes.data && (createRes.data.discharge || createRes.data.summary || createRes.data.dischargeSummary)) {
          setDischargeMessage({ type: 'success', text: 'Discharge summary created' });
          setTimeout(() => setDischargeMessage(null), 2000);
          loadPatientData();
          return;
        }
      } catch (fe) {
        console.warn('Fallback creation failed:', fe?.response?.status || fe?.message);
      }

      setDischargeMessage({ type: 'error', text: 'Could not generate discharge summary — backend may not support creation endpoints' });
      setTimeout(() => setDischargeMessage(null), 4000);
    } catch (err) {
      console.error('Error generating missing discharge summary:', err);
      setDischargeMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to generate discharge summary' });
      setTimeout(() => setDischargeMessage(null), 4000);
    } finally {
      setDischargeLoading(false);
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

  // If no admission/discharge summary available, show generate UI
  if (!admission) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 text-yellow-700">
          <p className="font-semibold">No Discharge Summary</p>
          <p>This patient doesn't have a discharge summary yet. It will be auto-created when the patient is discharged.</p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleGenerateMissingSummary}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700"
            >
              Generate Discharge Summary / Invoice
            </button>
            <button
              onClick={() => loadPatientData()}
              className="px-3 py-2 bg-gray-100 text-gray-800 rounded text-sm font-semibold hover:bg-gray-200"
            >
              Refresh
            </button>
          </div>
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
          {patient && admission && admission.isAdmitted && (
            <button
              onClick={handleDischargePatient}
              disabled={dischargeLoading}
              className="btn-brand flex items-center gap-2"
            >
              {dischargeLoading ? 'Discharging…' : 'Discharge Patient'}
            </button>
          )}
        </div>
      </div>

      {dischargeMessage && (
        <div className={`mb-4 p-3 rounded ${dischargeMessage.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {dischargeMessage.text}
        </div>
      )}

      {/* Printable container (wrapped so html2canvas captures only this) */}
      <div id="discharge-summary" className="bg-white print:bg-white">
      {/* Professional Medical Discharge Summary Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6 print:page-break-after-avoid">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{hospital?.name || 'Healthcare Facility'}</h1>
            <p className="text-sm text-gray-600">{hospital?.location || 'Location'}</p>
            {hospital?.phone && <p className="text-sm text-gray-600">Tel: {hospital.phone}</p>}
          </div>
          {hospital?.logo && (
            <img src={hospital.logo} alt="Logo" className="h-20 w-auto" />
          )}
        </div>
        <div className="text-center border-t pt-2">
          <h2 className="text-lg font-bold text-gray-800">PATIENT DISCHARGE SUMMARY</h2>
        </div>
      </div>

      {/* Patient Demographics Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded print:page-break-after-avoid">
        <div>
          <span className="text-xs text-gray-600 font-semibold">PATIENT NAME</span>
          <p className="font-semibold text-gray-900">{patient?.firstName || patient?.user?.name || '-'} {patient?.lastName || ''}</p>
        </div>
        <div>
          <span className="text-xs text-gray-600 font-semibold">HOSPITAL ID</span>
          <p className="font-semibold text-gray-900">{patient?.hospitalId || '-'}</p>
        </div>
        <div>
          <span className="text-xs text-gray-600 font-semibold">MRN</span>
          <p className="font-semibold text-gray-900">{patient?.mrn || '-'}</p>
        </div>
        <div>
          <span className="text-xs text-gray-600 font-semibold">DATE OF BIRTH</span>
          <p className="font-semibold text-gray-900">{patient?.dob ? new Date(patient.dob).toLocaleDateString() : '-'}</p>
        </div>
        <div>
          <span className="text-xs text-gray-600 font-semibold">AGE / GENDER</span>
          <p className="font-semibold text-gray-900">{patient?.age || '-'} yrs / {patient?.gender || '-'}</p>
        </div>
        <div>
          <span className="text-xs text-gray-600 font-semibold">ADMISSION DATE</span>
          <p className="font-semibold text-gray-900">{bedSummary?.admittedAt ? new Date(bedSummary.admittedAt).toLocaleDateString() : '-'}</p>
        </div>
        <div>
          <span className="text-xs text-gray-600 font-semibold">DISCHARGE DATE</span>
          <p className="font-semibold text-gray-900">{bedSummary?.dischargedAt ? new Date(bedSummary.dischargedAt).toLocaleDateString() : '-'}</p>
        </div>
        <div>
          <span className="text-xs text-gray-600 font-semibold">WARD / BED</span>
          <p className="font-semibold text-gray-900">{bedSummary?.ward || '-'} / {bedSummary?.bed || '-'}</p>
        </div>
      </div>

      {/* Patient Header Card */}
      <div className="hidden">
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

      {/* Clinical Information Section */}
      <div className="mb-6 p-4 bg-white border rounded print:page-break-after-avoid">
        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">CLINICAL INFORMATION</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-600 font-semibold">ADMISSION DIAGNOSIS</label>
            <p className="text-gray-900 font-medium">{admission?.admissionDiagnosis || admission?.presentingDiagnosis || '-'}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-semibold">FINAL DIAGNOSIS / DISCHARGE DIAGNOSIS</label>
            <p className="text-gray-900 font-medium">{admission?.finalDiagnosis || admission?.dischargeDiagnosis || '-'}</p>
          </div>
        </div>

        {admission?.secondaryDiagnoses && admission.secondaryDiagnoses.length > 0 && (
          <div className="mb-4">
            <label className="text-xs text-gray-600 font-semibold">SECONDARY DIAGNOSES</label>
            <ul className="list-disc list-inside text-gray-900">
              {admission.secondaryDiagnoses.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>
        )}

        <div className="mb-4">
          <label className="text-xs text-gray-600 font-semibold">CLINICAL SUMMARY</label>
          <p className="text-gray-900 text-sm">{admission?.clinicalSummary || admission?.summaryOfHospitalCourse || '-'}</p>
        </div>

        {(admission?.testResults || admission?.labFindings) && (
          <div className="mb-4">
            <label className="text-xs text-gray-600 font-semibold">TEST RESULTS / LAB FINDINGS</label>
            <p className="text-gray-900 text-sm">{admission.testResults || admission.labFindings || '-'}</p>
          </div>
        )}
      </div>

      {/* Medications Section */}
      {medications && medications.length > 0 && (
        <div className="mb-6 p-4 bg-white border rounded print:page-break-after-avoid">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">MEDICATIONS AT DISCHARGE</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left px-2 py-2 font-semibold text-gray-700">Drug Name</th>
                  <th className="text-left px-2 py-2 font-semibold text-gray-700">Dosage</th>
                  <th className="text-left px-2 py-2 font-semibold text-gray-700">Frequency</th>
                  <th className="text-left px-2 py-2 font-semibold text-gray-700">Duration</th>
                  <th className="text-left px-2 py-2 font-semibold text-gray-700">Instructions</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((med, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-2 py-2">{med.name || '-'}</td>
                    <td className="px-2 py-2">{med.dosage || '-'}</td>
                    <td className="px-2 py-2">{med.prescriptionTerm || med.frequency || '-'}</td>
                    <td className="px-2 py-2">{med.duration || '-'}</td>
                    <td className="px-2 py-2 text-xs">{med.instructions || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lab Tests Section */}
      {labTests && labTests.length > 0 && (
        <div className="mb-6 p-4 bg-white border rounded print:page-break-after-avoid">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">LAB TESTS PERFORMED</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left px-2 py-2 font-semibold text-gray-700">Test Name</th>
                  <th className="text-left px-2 py-2 font-semibold text-gray-700">Result</th>
                  <th className="text-left px-2 py-2 font-semibold text-gray-700">Reference Range</th>
                  <th className="text-left px-2 py-2 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {labTests.map((test, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-2 py-2">{test.testName || test.name || '-'}</td>
                    <td className="px-2 py-2">{test.result || '-'}</td>
                    <td className="px-2 py-2 text-xs">{test.referenceRange || '-'}</td>
                    <td className="px-2 py-2">{test.createdAt ? new Date(test.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Discharge Instructions Section */}
      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded print:page-break-after-avoid">
        <h3 className="text-lg font-bold text-gray-900 mb-2">DISCHARGE INSTRUCTIONS & FOLLOW-UP</h3>
        <div className="text-gray-900 text-sm space-y-2">
          <p><strong>Rest:</strong> Follow prescribed rest period and gradually resume normal activities.</p>
          <p><strong>Diet:</strong> Maintain healthy diet as recommended. Avoid heavy foods initially.</p>
          <p><strong>Follow-up Appointment:</strong> {admission?.followUpDate ? `${new Date(admission.followUpDate).toLocaleDateString()}` : 'To be arranged'}</p>
          <p><strong>Additional Instructions:</strong> {admission?.dischargeInstructions || 'Follow medication schedule. Contact facility if complications arise.'}</p>
        </div>
      </div>

      {/* Signature/Provider Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t-2 border-gray-800 print:page-break-after-avoid">
        <div>
          <p className="text-xs text-gray-600 mb-12">Attending Physician</p>
          <p className="border-t border-gray-900 text-sm font-medium">{admission?.attendingDoctor?.name || admission?.doctorName || '_______________'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-12">Date</p>
          <p className="border-t border-gray-900 text-sm">{bedSummary?.dischargedAt ? new Date(bedSummary.dischargedAt).toLocaleDateString() : '_______________'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-12">Hospital Seal / Stamp</p>
          <p className="border-t border-gray-900 text-sm text-center text-gray-400 h-12"></p>
        </div>
      </div>

          {/* Discharge Details - Hidden */}
          <div className="hidden">
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
              <div className="font-medium">
                { !editingDiagnoses ? (
                  (admission?.finalDiagnosis || admission?.dischargeDiagnosis) || '-'
                ) : (
                  <div className="relative">
                    <input value={draftFinalDiagnosis} onChange={e=>{ setDraftFinalDiagnosis(e.target.value); scheduleFetchDiag(e.target.value, -1); }} className="w-full p-2 border rounded" />
                    {diagSugForIndex === -1 && diagSuggestions && diagSuggestions.length > 0 && (
                      <div className="absolute z-20 bg-white border mt-1 w-full shadow rounded max-h-48 overflow-auto">
                        {diagSuggestions.map((s, i) => (
                          <div key={i} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={()=>{
                            const val = s.code ? `${s.code} ${s.term}` : s.term;
                            setDraftFinalDiagnosis(val);
                            setDiagSuggestions([]);
                            setDiagSugForIndex(null);
                          }}>{s.code ? `${s.code} — ${s.term}` : s.term}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-2">
                <div className="text-sm text-gray-600">Secondary / Additional Diagnoses</div>
                {!editingDiagnoses ? (
                  <div className="font-medium">{(admission?.secondaryDiagnoses && admission.secondaryDiagnoses.length) ? admission.secondaryDiagnoses.join('; ') : '-'}</div>
                ) : (
                  <div>
                    {draftSecondaryDiagnoses.map((d, idx) => (
                      <div key={idx} className="flex gap-2 items-center mb-2">
                        <div className="relative flex-1">
                          <input value={d} onChange={e=>{
                            const v = e.target.value;
                            setDraftSecondaryDiagnoses(s => { const copy = s.slice(); copy[idx]=v; return copy; });
                            scheduleFetchDiag(v, idx);
                          }} className="w-full p-2 border rounded" />
                          {diagSugForIndex === idx && diagSuggestions && diagSuggestions.length > 0 && (
                            <div className="absolute z-20 bg-white border mt-1 w-full shadow rounded max-h-48 overflow-auto">
                              {diagSuggestions.map((s, i) => (
                                <div key={i} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={()=>{
                                  const val = s.code ? `${s.code} ${s.term}` : s.term;
                                  setDraftSecondaryDiagnoses(sList => { const copy = sList.slice(); copy[idx] = val; return copy; });
                                  setDiagSuggestions([]);
                                  setDiagSugForIndex(null);
                                }}>{s.code ? `${s.code} — ${s.term}` : s.term}</div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button type="button" className="btn-outline" onClick={()=>setDraftSecondaryDiagnoses(s=>s.filter((_,i)=>i!==idx))}>Remove</button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button type="button" className="btn-outline" onClick={()=>setDraftSecondaryDiagnoses(s=>[...s,''])}>Add diagnosis</button>
                    </div>
                  </div>
                )}
              </div>
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
        <div className="mt-4">
          {!editingDiagnoses ? (
            <div className="flex gap-2">
              <button className="btn-brand" onClick={()=>setEditingDiagnoses(true)}>Edit Diagnoses</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button className="btn-brand" disabled={diagSaving} onClick={async ()=>{
                setDiagSaving(true); setDiagMessage(null);
                const payload = { finalDiagnosis: draftFinalDiagnosis, secondaryDiagnoses: draftSecondaryDiagnoses.filter(Boolean) };
                try{
                  // Try updating admission record first
                  if (admission?._id) {
                    try{
                      await axiosInstance.put(`/admissions/${admission._id}`, payload);
                    }catch(e){
                      // if admission endpoint not available, try patient admission endpoint
                      if (e?.response?.status === 404 || e?.response?.status === 400) {
                        await axiosInstance.put(`/patients/${patientId}/admission`, payload);
                      } else throw e;
                    }
                  } else {
                    // fallback: update patient admission resource
                    await axiosInstance.put(`/patients/${patientId}/admission`, payload);
                  }
                  // optimistic UI update
                  setAdmission(a => ({ ...(a||{}), ...payload }));
                  setEditingDiagnoses(false);
                  setDiagMessage({ type:'success', text:'Saved diagnoses' });
                }catch(err){
                  console.error('Save diagnoses failed', err);
                  setDiagMessage({ type:'error', text: err?.response?.data?.message || 'Failed to save diagnoses' });
                }finally{ setDiagSaving(false); setTimeout(()=>setDiagMessage(null),3000); }
              }}>{diagSaving ? 'Saving…' : 'Save'}</button>
              <button className="btn-outline" disabled={diagSaving} onClick={()=>{
                // revert drafts to current admission values
                setDraftFinalDiagnosis(admission?.finalDiagnosis || admission?.dischargeDiagnosis || '');
                setDraftSecondaryDiagnoses((admission?.secondaryDiagnoses && admission.secondaryDiagnoses.length) ? admission.secondaryDiagnoses.slice() : []);
                setEditingDiagnoses(false);
                setDiagMessage(null);
              }}>Cancel</button>
              {diagMessage && <div className={`p-2 rounded ${diagMessage.type==='error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{diagMessage.text}</div>}
            </div>
          )}
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
