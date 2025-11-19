import React from 'react';
import PrintButton from './PrintButton';

const DetailRow = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-200">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 col-span-2 sm:mt-0">{value || 'N/A'}</dd>
  </div>
);

const DischargeSummary = ({ summary, patient, summaryDetails }) => {
  // Accept either `summary` (original prop) or (patient + summaryDetails) as used by bridge
  const data = summary || summaryDetails || {};
  const patientData = patient || data.patientInfo || {};

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

  if (!data) return <div>No summary available</div>;

  const {
    admissionDiagnosis,
    finalDiagnosis,
    hospitalCourse,
    proceduresPerformed,
    medicationsOnDischarge,
    followUpInstructions,
    conditionOnDischarge
  } = data;

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div id="discharge-summary-printable">
        <style>{`@media print { body * { visibility: hidden; } #discharge-summary-printable, #discharge-summary-printable * { visibility: visible; } #discharge-summary-printable { position: absolute; left: 0; top: 0; width: 100%; } .print-header { display: block !important; } }`}</style>
        <div className="p-6">
          <div className="print-header hidden text-center mb-6">
            <h1 className="text-2xl font-bold">Hopewell Hospital</h1>
            <p className="text-sm">123 Wellness Avenue, Health City</p>
            <h2 className="text-xl font-semibold mt-4">Discharge Summary</h2>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold border-b pb-2 mb-3 text-blue-700">Patient Information</h3>
            <dl>
              <DetailRow label="Patient ID" value={patientData.id || patientData.mrn} />
              <DetailRow label="Full Name" value={patientData.name} />
              <DetailRow label="Date of Birth" value={patientData.dob || patientData.age} />
              <DetailRow label="Gender" value={patientData.gender} />
              <DetailRow label="Address" value={patientData.address} />
              <DetailRow label="Contact" value={patientData.contact || patientData.phone} />
            </dl>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold border-b pb-2 mb-3 text-blue-700">Admission & Discharge</h3>
            <dl>
              <DetailRow label="Admission Date" value={(patientData.admissionDate || (data.admissionInfo && data.admissionInfo.admittedAt)) || 'N/A'} />
              <DetailRow label="Discharge Date" value={(patientData.dischargeDate || (data.admissionInfo && data.admissionInfo.dischargedAt)) || 'N/A'} />
              <DetailRow label="Condition on Discharge" value={conditionOnDischarge} />
            </dl>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-700">Diagnosis</h3>
              <p className="mt-2 text-sm"><strong className="text-gray-600">Primary:</strong> {admissionDiagnosis}</p>
              <p className="mt-1 text-sm"><strong className="text-gray-600">Final:</strong> {finalDiagnosis}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-700">Hospital Course Summary</h3>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">{hospitalCourse}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-700">Procedures Performed</h3>
              <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                {(proceduresPerformed || []).map((proc, idx) => <li key={idx}>{typeof proc === 'string' ? proc : (proc.name || proc)}</li>)}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-700">Medications on Discharge</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {(medicationsOnDischarge || []).map((med, idx) => (
                  <li key={idx}><strong>{med.name}</strong> - {med.dosage || med.quantity || 'N/A'}, {med.frequency || 'N/A'}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-700">Follow-up Instructions</h3>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">{followUpInstructions}</p>
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

export default DischargeSummary;
