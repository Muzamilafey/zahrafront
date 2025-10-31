import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';

export default function AdmissionSummary() {
  const { patientId } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadPatientDetails();
  }, [patientId]);

  const loadPatientDetails = async () => {
    try {
      const res = await axiosInstance.get(`/patients/${patientId}`);
      setPatient(res.data.patient);
    } catch (error) {
      setToast({ message: 'Failed to load patient details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const buttonGroups = [
    {
      title: "Patient History",
      buttons: [
        { label: "OutPatient History", action: () => navigate(`/patients/${patientId}/outpatient-history`) },
        { label: "InPatient History", action: () => navigate(`/patients/${patientId}/inpatient-history`) },
        { label: "Bed Reallocation", action: () => navigate(`/patients/${patientId}/bed-reallocation`) },
        { label: "Change Admission Date", action: () => navigate(`/patients/${patientId}/change-admission-date`) }
      ]
    },
    {
      title: "Clinical Services",
      buttons: [
        { label: "New Doctor Visit", action: () => navigate(`/patients/${patientId}/new-doctor-visit`) },
        { label: "New Nurse Visit", action: () => navigate(`/patients/${patientId}/new-nurse-visit`) },
        { label: "New Physiotherapist Visit", action: () => navigate(`/patients/${patientId}/new-physio-visit`) },
        { label: "Internal Physiotherapy Request(s)", action: () => navigate(`/patients/${patientId}/physio-requests`) }
      ]
    },
    {
      title: "Medical Records",
      buttons: [
        { label: "Allergies", action: () => navigate(`/patients/${patientId}/allergies`) },
        { label: "Internal Lab Request(s)", action: () => navigate(`/patients/${patientId}/lab-requests`) },
        { label: "Internal Radiology Request(s)", action: () => navigate(`/patients/${patientId}/radiology-requests`) },
        { label: "Procedure(s) Performed", action: () => navigate(`/patients/${patientId}/procedures`) }
      ]
    },
    {
      title: "Service Records",
      buttons: [
        { label: "Internal Pharmacy Request(s)", action: () => navigate(`/patients/${patientId}/pharmacy-requests`) },
        { label: "Transport Bills", action: () => navigate(`/patients/${patientId}/transport-bills`) },
        { label: "Previous Doctor Visits", action: () => navigate(`/patients/${patientId}/previous-doctor-visits`) },
        { label: "Previous Nurse Visits", action: () => navigate(`/patients/${patientId}/previous-nurse-visits`) }
      ]
    },
    {
      title: "Additional Services",
      buttons: [
        { label: "Previous Physiotherapist Visits", action: () => navigate(`/patients/${patientId}/previous-physio-visits`) },
        { label: "Bill Exclusions", action: () => navigate(`/patients/${patientId}/bill-exclusions`) },
        { label: "New Nutritionist Visit", action: () => navigate(`/patients/${patientId}/new-nutritionist-visit`) },
        { label: "Previous Nutritionist Visits", action: () => navigate(`/patients/${patientId}/previous-nutritionist-visits`) }
      ]
    },
    {
      title: "Billing & Insurance",
      buttons: [
        { label: "NHIF Applicability", action: () => navigate(`/patients/${patientId}/nhif-applicability`) },
        { label: "Bill NHIF Rebate Cash", action: () => navigate(`/patients/${patientId}/nhif-rebate`) },
        { label: "New Inpatient Core Fee", action: () => navigate(`/patients/${patientId}/new-core-fee`) },
        { label: "View Inpatient Core Fees", action: () => navigate(`/patients/${patientId}/core-fees`) }
      ]
    },
    {
      title: "Medical Documentation",
      buttons: [
        { label: "New Operation Notes", action: () => navigate(`/patients/${patientId}/new-operation-notes`) },
        { label: "View Operation Notes", action: () => navigate(`/patients/${patientId}/operation-notes`) },
        { label: "Patient Details Upload(s)", action: () => navigate(`/patients/${patientId}/uploads`) },
        { label: "Department Drugs Request(s)", action: () => navigate(`/patients/${patientId}/drug-requests`) }
      ]
    },
    {
      title: "Treatment Records",
      buttons: [
        { label: "New Treatment Record", action: () => navigate(`/patients/${patientId}/new-treatment`) },
        { label: "Treatment Chart", action: () => navigate(`/patients/${patientId}/treatment-chart`) },
        { label: "New Anaesthetic Record", action: () => navigate(`/patients/${patientId}/new-anaesthetic`) },
        { label: "View Anaesthetic Records", action: () => navigate(`/patients/${patientId}/anaesthetic-records`) }
      ]
    },
    {
      title: "Bills & Fees",
      buttons: [
        { label: "New Patient Meal Bill", action: () => navigate(`/patients/${patientId}/new-meal-bill`) },
        { label: "New Patient Theatre Bill", action: () => navigate(`/patients/${patientId}/new-theatre-bill`) },
        { label: "Internal Theatre Items Request(s)", action: () => navigate(`/patients/${patientId}/theatre-requests`) },
        { label: "New InPatient Miscellaneous Fees Bill", action: () => navigate(`/patients/${patientId}/new-misc-bill`) }
      ]
    },
    {
      title: "View Bills",
      buttons: [
        { label: "View Patient Meal Bills", action: () => navigate(`/patients/${patientId}/meal-bills`) },
        { label: "View Patient Theatre Bills", action: () => navigate(`/patients/${patientId}/theatre-bills`) },
        { label: "View InPatient Miscellaneous Fees Bills", action: () => navigate(`/patients/${patientId}/misc-bills`) }
      ]
    },
    {
      title: "Billing Settings",
      buttons: [
        { label: "Set Inpatient Bill Limit", action: () => navigate(`/patients/${patientId}/set-bill-limit`) },
        { label: "Set Package Amount", action: () => navigate(`/patients/${patientId}/set-package`) }
      ]
    },
    {
      title: "Clinical Documentation",
      buttons: [
        { label: "Clinical Summary", action: () => navigate(`/patients/${patientId}/clinical-summary`) },
        { label: "Discharge Summary", action: () => navigate(`/patients/${patientId}/discharge-summary`) },
        { label: "Diagnosis", action: () => navigate(`/patients/${patientId}/diagnosis`) },
        { label: "Referral Letter", action: () => navigate(`/patients/${patientId}/referral-letter`) }
      ]
    }
  ];

  if (loading) {
    return <div className="p-4">Loading patient details...</div>;
  }

  if (!patient) {
    return <div className="p-4 text-red-600">Patient not found</div>;
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <h1 className="text-2xl font-bold mb-2">In-Patient Admission Profile</h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-semibold">INPATIENT'S FILE NO:</span> {patient.fileNumber || patient.hospitalId}</p>
            <p><span className="font-semibold">PATIENT'S NAME:</span> {patient.user?.name}</p>
            <p><span className="font-semibold">PATIENT'S AGE:</span> {patient.age}</p>
          </div>
          <div>
            <p><span className="font-semibold">ADMISSION DATE:</span> {new Date(patient.admission?.admittedAt).toLocaleDateString()}</p>
            <p><span className="font-semibold">ADMISSION TIME:</span> {new Date(patient.admission?.admittedAt).toLocaleTimeString()}</p>
            <p><span className="font-semibold">PAYMENT DETAILS:</span> {patient.paymentMode}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buttonGroups.map((group, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3 pb-2 border-b">{group.title}</h2>
            <div className="grid gap-2">
              {group.buttons.map((button, buttonIndex) => (
                <button
                  key={buttonIndex}
                  onClick={button.action}
                  className="btn-secondary text-left px-3 py-2 text-sm"
                >
                  {button.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}