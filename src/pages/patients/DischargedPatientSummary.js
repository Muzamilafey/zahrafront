import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { FaArrowLeft, FaPrint, FaDownload } from 'react-icons/fa';

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
            onClick={handlePrint}
            className="btn-outline flex items-center gap-2"
          >
            <FaPrint /> Print
          </button>
        </div>
      </div>

      {/* Patient Header Card */}
      <div className="bg-gradient-to-r from-brand-50 to-brand-100 border border-brand-200 rounded-lg p-6 mb-6">
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
            <div className="text-lg font-semibold text-green-600">
              ✓ Discharged
            </div>
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
