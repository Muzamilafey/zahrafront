import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams } from 'react-router-dom';
import { AuthContext } from "../contexts/AuthContext";

export default function DischargeSummary({ patientId }) {
  const { id: routeId } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const effectivePatientId = patientId || routeId;
  const [admission, setAdmission] = useState(null);
  const [treatmentSummary, setTreatmentSummary] = useState("");
  const [dischargeMedications, setDischargeMedications] = useState("");
  const summaryRef = useRef();

  useEffect(() => {
    if (!effectivePatientId || !axiosInstance) return;
    axiosInstance
      .get(`/admissions/${effectivePatientId}`)
      .then((res) => {
        const admissionData = res.data;
        // Map the received data to the structure the component expects
        const mappedAdmission = {
          patientName: admissionData.patient?.user?.name || 'N/A',
          patientId: admissionData.patient?.mrn || 'N/A',
          age: admissionData.patient?.age || 'N/A',
          gender: admissionData.patient?.gender || 'N/A',
          ward: admissionData.ward || 'N/A',
          diagnosis: admissionData.finalDiagnosis || 'N/A',
          dateAdmitted: admissionData.admittedAt || admissionData.createdAt,
          dateDischarged: admissionData.dischargedAt,
          doctorInCharge: admissionData.doctor?.user?.name || 'N/A', // Assuming doctor is populated
          treatmentSummary: admissionData.clinicalSummary || '',
          dischargeMedications: '', // This seems to be an editable field, not from API
          finalNotes: admissionData.dischargeNotes || ''
        };
        setAdmission(mappedAdmission);
        setTreatmentSummary(mappedAdmission.treatmentSummary);
      })
      .catch((err) => {
        console.error("Failed to load admission data:", err);
      });
  }, [effectivePatientId, axiosInstance]);

  const printSummary = () => {
    if (!summaryRef.current) return;
    const printContents = summaryRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  if (!admission) {
    return (
      <div className="p-4 text-center text-gray-600">Loading admission info...</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded mt-6 font-sans">
      <div ref={summaryRef}>
        <h1 className="text-3xl font-bold mb-6 text-center">Discharge Summary</h1>

        <section className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold text-gray-700">Patient Name</p>
            <p>{admission.patientName}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Patient ID</p>
            <p>{admission.patientId}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Age</p>
            <p>{admission.age}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Gender</p>
            <p>{admission.gender}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Ward</p>
            <p>{admission.ward}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Diagnosis</p>
            <p>{admission.diagnosis}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Date Admitted</p>
            <p>{admission.dateAdmitted ? new Date(admission.dateAdmitted).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Date Discharged</p>
            <p>{admission.dateDischarged ? new Date(admission.dateDischarged).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="font-semibold text-gray-700">Doctor in Charge</p>
            <p>{admission.doctorInCharge}</p>
          </div>
        </section>

        <section className="mb-6">
          <label className="font-semibold text-gray-700 block mb-1" htmlFor="treatmentSummary">
            Treatment Summary
          </label>
          <textarea
            id="treatmentSummary"
            rows={6}
            className="w-full border border-gray-300 rounded p-2 resize-y"
            value={treatmentSummary}
            onChange={(e) => setTreatmentSummary(e.target.value)}
          />
        </section>

        <section className="mb-6">
          <label className="font-semibold text-gray-700 block mb-1" htmlFor="dischargeMedications">
            Discharge Medications
          </label>
          <textarea
            id="dischargeMedications"
            rows={4}
            className="w-full border border-gray-300 rounded p-2 resize-y"
            value={dischargeMedications}
            onChange={(e) => setDischargeMedications(e.target.value)}
          />
        </section>

        <section className="mb-6">
          <p className="font-semibold text-gray-700 mb-1">Final Notes</p>
          <p className="whitespace-pre-wrap border border-gray-200 rounded p-3 bg-gray-50">
            {admission.finalNotes || "-"}
          </p>
        </section>
      </div>

      <div className="text-center">
        <button
          onClick={printSummary}
          className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition"
          type="button"
        >
          Print Discharge Summary
        </button>
      </div>
    </div>
  );
}