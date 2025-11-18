import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

// --- Components ---

const PrintButton = ({ onClick, text }) => {
  return (
    <div className="flex justify-end">
      <button
        onClick={onClick}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7V9h6v3z" clipRule="evenodd" />
        </svg>
        {text}
      </button>
    </div>
  );
};

const Spinner = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-full animate-spin border-4 border-solid border-blue-500 border-t-transparent"></div>
      <p className="mt-4 text-lg text-gray-600">Loading Discharge Summary...</p>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-200">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 col-span-2 sm:mt-0">{value || 'N/A'}</dd>
  </div>
);

const DischargeSummaryContent = ({ patient, summaryDetails }) => {
  const handlePrint = () => {
    const printContents = document.getElementById('discharge-summary-printable')?.innerHTML;
    const originalContents = document.body.innerHTML;
    if (printContents) {
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div id="discharge-summary-printable">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #discharge-summary-printable, #discharge-summary-printable * { visibility: visible; }
            #discharge-summary-printable { position: absolute; left: 0; top: 0; width: 100%; }
            .print-header { display: block !important; }
          }
        `}</style>
        <div className="p-6">
          <div className="print-header hidden text-center mb-6">
            <h1 className="text-2xl font-bold">Zahra Maternity & Child Care Hospital</h1>
            <p className="text-sm">Mogadishu, Somalia | TEL 0722568879</p>
            <h2 className="text-xl font-semibold mt-4">Discharge Summary</h2>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold border-b pb-2 mb-3 text-blue-700">Patient Information</h3>
            <dl>
              <DetailRow label="Patient ID" value={patient.id} />
              <DetailRow label="Full Name" value={patient.name} />
              <DetailRow label="Date of Birth" value={patient.dob} />
              <DetailRow label="Gender" value={patient.gender} />
              <DetailRow label="Address" value={patient.address} />
              <DetailRow label="Contact" value={patient.contact} />
            </dl>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold border-b pb-2 mb-3 text-blue-700">Admission & Discharge</h3>
            <dl>
              <DetailRow label="Admission Date" value={patient.admissionDate} />
              <DetailRow label="Discharge Date" value={patient.dischargeDate} />
              <DetailRow label="Admitting Physician" value={patient.admittingPhysician} />
              <DetailRow label="Condition on Discharge" value={summaryDetails.conditionOnDischarge} />
            </dl>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-700">Diagnosis</h3>
              <p className="mt-2 text-sm">
                <strong className="text-gray-600">On Admission:</strong> {summaryDetails.admissionDiagnosis}
              </p>
              <p className="mt-1 text-sm">
                <strong className="text-gray-600">Final:</strong> {summaryDetails.finalDiagnosis}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-700">Hospital Course Summary</h3>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                {summaryDetails.hospitalCourse}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-700">Procedures Performed</h3>
              {summaryDetails.proceduresPerformed && summaryDetails.proceduresPerformed.length > 0 ? (
                <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                  {summaryDetails.proceduresPerformed.map((proc, index) => (
                    <li key={index}>{proc}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-700">No procedures recorded</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-700">Medications on Discharge</h3>
              {summaryDetails.medicationsOnDischarge && summaryDetails.medicationsOnDischarge.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {summaryDetails.medicationsOnDischarge.map((med, index) => (
                    <li key={index}>
                      <strong>{med.name}</strong> - {med.dosage}, {med.frequency}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-700">No medications prescribed</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-700">Follow-up Instructions</h3>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                {summaryDetails.followUpInstructions}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t print:hidden">
        <PrintButton onClick={handlePrint} text="Print Summary" />
      </div>
    </div>
  );
};

const InvoiceContent = ({ patient, charges }) => {
  const subtotal = charges && charges.length > 0
    ? charges.reduce((acc, charge) => acc + (charge.quantity || 1) * (charge.unitPrice || 0), 0)
    : 0;
  const taxRate = 0.0;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handlePrint = () => {
    const printContents = document.getElementById('invoice-printable')?.innerHTML;
    const originalContents = document.body.innerHTML;
    if (printContents) {
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div id="invoice-printable">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #invoice-printable, #invoice-printable * { visibility: visible; }
            #invoice-printable { position: absolute; left: 0; top: 0; width: 100%; }
            .print-header { display: flex !important; }
          }
        `}</style>
        <div className="p-6">
          <div className="print-header hidden justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold">Zahra Maternity & Child Care Hospital</h1>
              <p className="text-sm">Mogadishu, Somalia | TEL 0722568879</p>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">INVOICE</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-8">
            <div>
              <h4 className="font-semibold text-gray-600">Billed To:</h4>
              <p className="font-bold text-gray-900">{patient.name}</p>
              <p className="text-gray-700">{patient.address}</p>
            </div>
            <div className="text-right">
              <p>
                <strong className="text-gray-600">Invoice #:</strong> INV-{patient.id.slice(-5)}-{new Date().getFullYear()}
              </p>
              <p>
                <strong className="text-gray-600">Date Issued:</strong> {formatDate(new Date().toISOString())}
              </p>
              <p>
                <strong className="text-gray-600">Due Date:</strong> {formatDate(new Date(new Date().setDate(new Date().getDate() + 30)).toISOString())}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Description</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">Qty</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">Unit Price</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {charges && charges.length > 0 ? (
                  charges.map(charge => (
                    <tr key={charge.id} className="border-b">
                      <td className="px-4 py-2">{charge.description}</td>
                      <td className="px-4 py-2 text-right">{charge.quantity || 1}</td>
                      <td className="px-4 py-2 text-right">${(charge.unitPrice || 0).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">
                        ${((charge.quantity || 1) * (charge.unitPrice || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-2 text-center text-gray-500">
                      No charges recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-6">
            <div className="w-full max-w-xs text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Tax ({(taxRate * 100).toFixed(0)}%)</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 mt-2 border-t-2 border-gray-300">
                <span className="font-bold text-base">Total Due:</span>
                <span className="font-bold text-base">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-xs text-gray-500 text-center">
            <p>Thank you for choosing Zahra Maternity & Child Care Hospital.</p>
            <p>For billing questions, please call +1 (555) 234-5678.</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t print:hidden">
        <PrintButton onClick={handlePrint} text="Print Invoice" />
      </div>
    </div>
  );
};

// --- Main Template Page ---
const DischargeSummaryTemplate = () => {
  const { id: patientId } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState(null);
  const [summaryDetails, setSummaryDetails] = useState(null);
  const [charges, setCharges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!patientId) {
        setError('Patient ID is required');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch patient data
        const patientRes = await axiosInstance.get(`/patients/${patientId}`);
        const patientData = patientRes.data.patient;

        // Get admission data for dates and physician
        let admissionData = null;
        if (patientData?.admissionHistory && patientData.admissionHistory.length > 0) {
          admissionData = patientData.admissionHistory[patientData.admissionHistory.length - 1];
        } else if (patientData?.admission) {
          admissionData = patientData.admission;
        }

        // Build patient object with proper formatting
        const formattedPatient = {
          id: patientData._id || patientData.hospitalId || 'N/A',
          name: `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim() || patientData.user?.name || 'Unknown',
          dob: patientData.dob ? new Date(patientData.dob).toLocaleDateString() : 'N/A',
          gender: patientData.gender || 'Not specified',
          address: patientData.address || 'Not provided',
          contact: patientData.contact || patientData.phone || 'Not provided',
          admissionDate: admissionData?.admittedAt
            ? new Date(admissionData.admittedAt).toLocaleDateString()
            : 'N/A',
          dischargeDate: admissionData?.dischargedAt
            ? new Date(admissionData.dischargedAt).toLocaleDateString()
            : 'N/A',
          admittingPhysician: admissionData?.attendingDoctor?.name || admissionData?.doctorName || 'N/A'
        };

        // Build summary details from admission data
        const summary = {
          admissionDiagnosis: admissionData?.admissionDiagnosis || 'Not recorded',
          finalDiagnosis: admissionData?.finalDiagnosis || admissionData?.dischargeDiagnosis || 'Not recorded',
          hospitalCourse: admissionData?.clinicalSummary || admissionData?.summaryOfHospitalCourse || 'No summary available',
          proceduresPerformed: admissionData?.procedures || [],
          medicationsOnDischarge: [], // Will populate from prescriptions
          followUpInstructions: admissionData?.dischargeInstructions || 'Follow medication schedule and attend follow-up appointments as advised.',
          conditionOnDischarge: admissionData?.dischargeCondition || 'Stable'
        };

        // Fetch prescriptions/medications
        try {
          const prescRes = await axiosInstance.get(`/prescriptions`);
          const allPresc = prescRes?.data?.prescriptions || prescRes?.data || [];
          if (Array.isArray(allPresc)) {
            const meds = [];
            allPresc.forEach(p => {
              const pPatientId = p.patient?._id || p.patient || p.patientId || p.appointment?.patient?._id;
              const matchesPatient = String(pPatientId) === String(patientData._id) || String(pPatientId) === String(patientId);
              if (!matchesPatient) return;

              // Extract medications from various possible fields
              const medsCandidates = [];
              if (Array.isArray(p.drugs)) medsCandidates.push(...p.drugs);
              else if (Array.isArray(p.medications)) medsCandidates.push(...p.medications);
              else if (p.drug) medsCandidates.push(p.drug);
              else if (p.name) medsCandidates.push(p);

              medsCandidates.forEach(d => {
                if (!d) return;
                meds.push({
                  name: d.name || d.drugName || d.medicationName || p.name || 'Unknown',
                  dosage: d.dosage || d.dose || d.form || 'N/A',
                  frequency: d.frequency || d.prescriptionTerm || 'As prescribed'
                });
              });
            });
            summary.medicationsOnDischarge = meds;
          }
        } catch (e) {
          console.warn('Could not load medications:', e?.message);
        }

        // Fetch billing charges
        try {
          const billingRes = await axiosInstance.get(`/billing`);
          const allInvoices = billingRes.data?.invoices || [];
          const patientInvoices = allInvoices.filter(
            inv => String(inv.patient?._id) === String(patientData._id) || String(inv.patientId) === String(patientId)
          );

          const chargesFromBilling = [];
          patientInvoices.forEach(inv => {
            if (Array.isArray(inv.items)) {
              inv.items.forEach(item => {
                chargesFromBilling.push({
                  id: item.id || `${inv._id}-${item.name}`,
                  description: item.name || item.description || 'Service',
                  quantity: item.quantity || 1,
                  unitPrice: item.price || item.unitPrice || 0
                });
              });
            }
          });
          setCharges(chargesFromBilling.length > 0 ? chargesFromBilling : []);
        } catch (e) {
          console.warn('Could not load billing charges:', e?.message);
        }

        setPatient(formattedPatient);
        setSummaryDetails(summary);
      } catch (err) {
        console.error('Error loading discharge summary:', err);
        setError(err?.response?.data?.message || err.message || 'Failed to load discharge summary');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [patientId, axiosInstance]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!patient || !summaryDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">No data available for this patient</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 p-4 md:p-8">
      <header className="bg-white shadow-md rounded-lg mb-8 p-6 print:hidden">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Discharge Summary & Invoice</h1>
            <p className="text-gray-600 mt-1">Patient: {patient.name}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-700 print:text-black">Discharge Summary</h2>
            <DischargeSummaryContent patient={patient} summaryDetails={summaryDetails} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-700 print:text-black">Patient Invoice</h2>
            <InvoiceContent patient={patient} charges={charges} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DischargeSummaryTemplate;
