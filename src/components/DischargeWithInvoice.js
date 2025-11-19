import React from "react";
import PrintButton from "./PrintButton";

const Row = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-200">
    <span className="text-sm font-medium text-gray-600">{label}</span>
    <span className="text-sm text-gray-900 col-span-2">{value || "N/A"}</span>
  </div>
);

const DischargeWithInvoice = ({ patient, summary, invoice }) => {
  if (!patient && !summary) {
    return <div className="text-red-600">No data found.</div>;
  }

  const handlePrint = () => {
    const printContents = document.getElementById("print-section")?.innerHTML;
    if (!printContents) {
      window.print();
      return;
    }
    const original = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = original;
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div id="print-section">
        <style>
          {`
            @media print {
              body * { visibility: hidden; }
              #print-section, #print-section * { visibility: visible; }
              #print-section { position: absolute; left: 0; top: 0; width: 100%; }
            }
          `}
        </style>

        {/* Hospital Header */}
        <div className="p-6 border-b text-center">
          <h1 className="text-2xl font-bold">Hopewell Hospital</h1>
          <p className="text-sm">123 Wellness Avenue, Health City</p>
          <h2 className="text-xl font-semibold mt-4 text-blue-700">
            Discharge Summary & Invoice
          </h2>
        </div>

        {/* Patient Information */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-blue-700 mb-2 border-b pb-1">
            Patient Information
          </h3>
          <Row label="Patient ID" value={(patient && (patient.id || patient.mrn))} />
          <Row label="Full Name" value={patient?.name || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim()} />
          <Row label="Date of Birth / Age" value={patient?.dob || patient?.age} />
          <Row label="Gender" value={patient?.gender} />
          <Row label="Address" value={patient?.address} />
          <Row label="Contact" value={patient?.contact || patient?.phone} />
        </div>

        {/* Admission & Discharge */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-blue-700 mb-2 border-b pb-1">
            Admission & Discharge
          </h3>
          <Row label="Admission Date" value={summary?.admissionDate || summary?.admissionInfo?.admittedAt} />
          <Row label="Discharge Date" value={summary?.dischargeDate || summary?.admissionInfo?.dischargedAt} />
          <Row label="Condition on Discharge" value={summary?.conditionOnDischarge || summary?.dischargeCondition} />
        </div>

        {/* Diagnoses */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-blue-700">Diagnosis</h3>
          <p className="mt-2 text-sm">
            <strong className="text-gray-600">Primary:</strong>{" "}
            {summary?.admissionDiagnosis || summary?.diagnosis?.primary}
          </p>
          <p className="mt-1 text-sm">
            <strong className="text-gray-600">Final:</strong>{" "}
            {summary?.finalDiagnosis || summary?.diagnosis?.final}
          </p>
        </div>

        {/* Hospital Course */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-blue-700">
            Hospital Course Summary
          </h3>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            {summary?.hospitalCourse || summary?.hospitalStaySummary}
          </p>
        </div>

        {/* Procedures */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-blue-700">
            Procedures Performed
          </h3>
          <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
            {(summary?.proceduresPerformed || summary?.procedures || []).map((proc, i) => (
              <li key={i}>{typeof proc === 'string' ? proc : (proc.name || proc.description || JSON.stringify(proc))}</li>
            ))}
          </ul>
        </div>

        {/* Medications */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-blue-700">
            Medications on Discharge
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            {(summary?.medicationsOnDischarge || summary?.medications || []).map((med, i) => (
              <li key={i}>
                <strong>{med.name || med.label || med.medicineName}</strong> — {med.dosage || med.amount || "N/A"},{" "}
                {med.frequency || med.freq || "N/A"}
              </li>
            ))}
          </ul>
        </div>

        {/* Follow-up */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-blue-700">
            Follow-up Instructions
          </h3>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            {summary?.followUpInstructions || summary?.followUpPlan}
          </p>
        </div>

        {/* Invoice Section */}
        <div className="p-6 border-t">
          <h3 className="text-lg font-semibold text-blue-700 mb-3">
            Hospital Invoice
          </h3>

          <div className="space-y-2 text-sm">
            <Row label="Consultation Fee" value={`KSH ${invoice?.consultation || invoice?.consultationFee || 0}`} />
            <Row label="Bed Charges" value={`KSH ${invoice?.bed || invoice?.bedCharges || 0}`} />
            <Row label="Medication Cost" value={`KSH ${invoice?.meds || invoice?.medicationCost || 0}`} />
            <Row label="Lab Tests Cost" value={`KSH ${invoice?.labs || invoice?.labCost || 0}`} />
            <Row label="Other Charges" value={`KSH ${invoice?.other || invoice?.otherCharges || 0}`} />
          </div>

          <div className="mt-4 text-right">
            <p className="font-semibold text-lg">
              Total:{" "}
              <span className="text-blue-700">
                KSH{" "}
                {(
                  Number(invoice?.consultation || invoice?.consultationFee || 0) +
                  Number(invoice?.bed || invoice?.bedCharges || 0) +
                  Number(invoice?.meds || invoice?.medicationCost || 0) +
                  Number(invoice?.labs || invoice?.labCost || 0) +
                  Number(invoice?.other || invoice?.otherCharges || 0)
                ).toLocaleString()}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* PRINT BUTTON */}
      <div className="px-6 py-4 bg-gray-50 border-t print:hidden">
        <PrintButton onClick={handlePrint} text="Print Full Report" />
      </div>
    </div>
  );
};

export default DischargeWithInvoice;
