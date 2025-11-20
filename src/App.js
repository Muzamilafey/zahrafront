import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import ClinicalSummary from './pages/ClinicalSummary';

import Login from './pages/Login';

import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Appointments from './pages/Appointments';
import Pharmacy from './pages/Pharmacy';
import Billing from './pages/Billing';
import NotFound from './pages/NotFound';

import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminSettings from './pages/admin/AdminSettings';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminPatients from './pages/admin/AdminPatients';
import AdminNurseAssignment from './pages/admin/AdminNurseAssignment';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminConsultations from './pages/admin/AdminConsultations';
import ManagementCharges from './pages/admin/ManagementCharges';
import AdmittedPatients from './pages/AdmittedPatients';
import PatientVisits from './pages/PatientVisits';
import VisitsReport from './pages/VisitsReport';
import AdminSlots from './pages/admin/AdminSlots';
import ManageWards from './pages/admin/ManageWards';
import DrugsAdmin from './pages/admin/DrugsAdmin';
import DoctorDashboard from './components/Dashboard/DoctorDashboard';
import PatientsForMe from './pages/doctor/PatientsForMe';
import AppointmentsForMe from './pages/doctor/AppointmentsForMe';
import AdmitPatient from './pages/doctor/AdmitPatient';
import DoctorAdmittedPatients from './pages/doctor/AdmittedPatients';
import PatientDashboard from './components/Dashboard/PatientDashboard';
import PatientPrescriptions from './pages/patient/Prescriptions';
import PharmacistDashboard from './components/Dashboard/PharmacistDashboard';
import POS from './pages/pharmacy/POS';
import FinanceDashboard from './components/Dashboard/FinanceDashboard';
import ReceptionistDashboard from './components/Dashboard/ReceptionistDashboard';
import NurseDashboard from './components/Dashboard/NurseDashboard';
import NurseAdmissionHistory from './pages/nurse/NurseAdmissionHistory';
import LabDashboard from './pages/lab/LabDashboard';
import LabQueue from './pages/lab/LabQueue';
import LabRequests from './pages/lab/LabRequests';
import LabTestReview from './pages/lab/LabTestReview';
import LabTests from './pages/lab/LabTests';
import LabPrices from './pages/lab/LabPrices';
import LabTemplates from './pages/lab/LabTemplates';
import LabPatientReport from './pages/lab/LabPatientReport';
import LabResult from './pages/lab/LabResult';
import AdminPatient from './pages/admin/AdminPatient';
import AdminAssignDoctor from './pages/admin/AdminAssignDoctor';
import AdminUser from './pages/admin/AdminUser';
import AppointmentsBilling from './pages/finance/AppointmentsBilling';
import PatientList from './pages/PatientList';
import RegisterPatient from './pages/RegisterPatient';
import PatientDetail from './pages/PatientDetail';
import PatientPayments from './pages/PatientPayments';
import NewVisit from './pages/visits/NewVisit';
import ErrorBoundary from './components/ErrorBoundary';
import Transactions from './pages/finance/Transactions';
import Reports from './pages/finance/Reports';
import Refunds from './pages/finance/Refunds';
import ReceptionAppointments from './pages/reception/Appointments';
import StaffRequests from './pages/staff/StaffRequests';
import ChatPage from './pages/Chat';
import AdmissionSummary from './pages/admission/AdmissionSummary';
import OutpatientHistory from './pages/admission/patient-history/OutpatientHistory';
import InpatientHistory from './pages/admission/patient-history/InpatientHistory';
import BedReallocation from './pages/admission/patient-history/BedReallocation';
import Allergies from './pages/admission/medical-records/Allergies';
import AdmissionLabRequests from './pages/admission/medical-records/LabRequests';
import RadiologyRequests from './pages/admission/medical-records/RadiologyRequests';
import Procedures from './pages/admission/medical-records/Procedures';
import NewDoctorVisit from './pages/admission/clinical-services/NewDoctorVisit';
import NewMealBill from './pages/admission/billing/NewMealBill';
import NewTheatreBill from './pages/admission/billing/NewTheatreBill';
import NewLabBill from './pages/admission/billing/NewLabBill';
import NewPharmacyBill from './pages/admission/billing/NewPharmacyBill';
import MealBills from './pages/admission/billing/MealBills';
import TheatreBills from './pages/admission/billing/TheatreBills';
import LabBills from './pages/admission/billing/LabBills';
import PharmacyBills from './pages/admission/billing/PharmacyBills';
import MiscellaneousBills from './pages/admission/billing/MiscellaneousBills';
import Placeholder from './components/Placeholder';
import DischargeSummary from './pages/patients/DischargeSummary';
import DischargedPatientSummary from './pages/patients/DischargedPatientSummary';
import DischargeSummaryPage from './pages/patients/DischargeSummaryPage';
import DischargeSummaryTemplate from './pages/patients/DischargeSummaryTemplate';
import DischargedPatientsList from './pages/patients/DischargedPatientsList';
import PatientDischargePage from './pages/patients/PatientDischargePage';
import NewDischargeSummary from './pages/patients/NewDischargeSummary';
import DetailedDischargeSummary from './pages/patients/DetailedDischargeSummary';
import DischargeLauncher from './pages/patients/DischargeLauncher';
import InvoiceDetail from './pages/finance/InvoiceDetail';
import InvoicePage from './pages/finance/InvoicePage';
import InternalPharmacyRequests from './pages/admission/pharmacy/InternalPharmacyRequests';
import DispenseDrugs from './pages/pharmacy/DispenseDrugs';
import RegisterUser from './pages/admin/RegisterUser';
import ManageMeals from './pages/admin/ManageMeals';
import LabTestDetail from './pages/lab/LabTestDetail';

function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <Router>
          <Routes>
          <Route path="/" element={<Navigate to="/login" />} />

          <Route path="/login" element={<Login />} />
          
          
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardRouter />
              </PrivateRoute>
            }
          />

          <Route path="/dashboard/admin" element={<PrivateRoute><Layout><AdminDashboard /></Layout></PrivateRoute>} />
          <Route path="/dashboard/admin/users" element={<PrivateRoute><Layout><AdminUsers /></Layout></PrivateRoute>} />
          <Route path="/dashboard/admin/doctors" element={<PrivateRoute><Layout><AdminDoctors /></Layout></PrivateRoute>} />
          <Route path="/dashboard/admin/register" element={<PrivateRoute><Layout><RegisterUser /></Layout></PrivateRoute>} />
          {/* Patient Management Routes */}
          <Route path="/patients" element={<PrivateRoute><Layout><PatientList /></Layout></PrivateRoute>} />
          <Route path="/patients/register" element={<PrivateRoute><Layout><RegisterPatient /></Layout></PrivateRoute>} />
          <Route path="/patients/admitted" element={<PrivateRoute><Layout><AdmittedPatients /></Layout></PrivateRoute>} />
          <Route path="/patients/visits" element={<PrivateRoute><Layout><PatientVisits /></Layout></PrivateRoute>} />
          <Route path="/patients/visits/report" element={<PrivateRoute><Layout><VisitsReport /></Layout></PrivateRoute>} />
          <Route path="/patients/visits/new" element={<PrivateRoute><Layout><NewVisit /></Layout></PrivateRoute>} />
          <Route path="/patients/:id" element={<PrivateRoute><Layout><ErrorBoundary><PatientDetail /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/payments" element={<PrivateRoute><Layout><PatientPayments /></Layout></PrivateRoute>} />
          <Route path="/patients/:id/invoice" element={<PrivateRoute><Layout><ErrorBoundary><InvoicePage /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/labtests/:id" element={<PrivateRoute><Layout><ErrorBoundary><LabTestDetail /></ErrorBoundary></Layout></PrivateRoute>} />
          {/* Admission patient-specific pages (history, bed mgmt, visits, meal bills) */}
          <Route path="/patients/:id/outpatient-history" element={<PrivateRoute><Layout><ErrorBoundary><OutpatientHistory /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/inpatient-history" element={<PrivateRoute><Layout><ErrorBoundary><InpatientHistory /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/bed-reallocation" element={<PrivateRoute><Layout><ErrorBoundary><BedReallocation /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/new-doctor-visit" element={<PrivateRoute><Layout><ErrorBoundary><NewDoctorVisit /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/new-meal-bill" element={<PrivateRoute><Layout><ErrorBoundary><NewMealBill /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/change-admission-date" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Change Admission Date" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/new-nurse-visit" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="New Nurse Visit" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/new-physio-visit" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="New Physiotherapist Visit" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/physio-requests" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Physio Requests" /></ErrorBoundary></Layout></PrivateRoute>} />

          {/* Medical Records */}
          <Route path="/patients/:id/allergies" element={<PrivateRoute><Layout><ErrorBoundary><Allergies /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/lab-requests" element={<PrivateRoute><Layout><ErrorBoundary><AdmissionLabRequests /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/radiology-requests" element={<PrivateRoute><Layout><ErrorBoundary><RadiologyRequests /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/procedures" element={<PrivateRoute><Layout><ErrorBoundary><Procedures /></ErrorBoundary></Layout></PrivateRoute>} />

          {/* Service Records */}
          <Route path="/patients/:id/pharmacy-requests" element={<PrivateRoute><Layout><ErrorBoundary><InternalPharmacyRequests /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/transport-bills" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Transport Bills" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/previous-doctor-visits" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Previous Doctor Visits" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/previous-nurse-visits" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Previous Nurse Visits" /></ErrorBoundary></Layout></PrivateRoute>} />

          {/* Additional Services */}
          <Route path="/patients/:id/previous-physio-visits" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Previous Physio Visits" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/bill-exclusions" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Bill Exclusions" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/new-nutritionist-visit" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="New Nutritionist Visit" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/previous-nutritionist-visits" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Previous Nutritionist Visits" /></ErrorBoundary></Layout></PrivateRoute>} />

          {/* Billing & Insurance */}
          <Route path="/patients/:id/nhif-applicability" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="NHIF Applicability" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/nhif-rebate" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="NHIF Rebate" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/new-core-fee" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="New Inpatient Core Fee" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/core-fees" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Inpatient Core Fees" /></ErrorBoundary></Layout></PrivateRoute>} />

          {/* Medical Documentation */}
          <Route path="/patients/:id/new-operation-notes" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="New Operation Notes" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/operation-notes" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Operation Notes" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/uploads" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Patient Uploads" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/drug-requests" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Department Drug Requests" /></ErrorBoundary></Layout></PrivateRoute>} />

          {/* Treatment Records */}
          <Route path="/patients/:id/new-treatment" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="New Treatment Record" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/treatment-chart" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Treatment Chart" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/new-anaesthetic" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="New Anaesthetic Record" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/anaesthetic-records" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Anaesthetic Records" /></ErrorBoundary></Layout></PrivateRoute>} />

          {/* View Bills (lists) */}
          <Route path="/patients/:id/meal-bills" element={<PrivateRoute><Layout><ErrorBoundary><MealBills /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/theatre-bills" element={<PrivateRoute><Layout><ErrorBoundary><TheatreBills /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/lab-bills" element={<PrivateRoute><Layout><ErrorBoundary><LabBills /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/pharmacy-bills" element={<PrivateRoute><Layout><ErrorBoundary><PharmacyBills /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/misc-bills" element={<PrivateRoute><Layout><ErrorBoundary><MiscellaneousBills /></ErrorBoundary></Layout></PrivateRoute>} />

          {/* Billing Settings */}
          <Route path="/patients/:id/set-bill-limit" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Set Inpatient Bill Limit" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/set-package" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Set Package Amount" /></ErrorBoundary></Layout></PrivateRoute>} />

          {/* Clinical Documentation */}
          <Route path="/patients/:id/clinical-summary" element={<PrivateRoute><Layout><ErrorBoundary><ClinicalSummary /></ErrorBoundary></Layout></PrivateRoute>} />
          {/* Unified discharge summary page with real data from tsx components */}
          <Route path="/patients/:id/discharge-summary" element={<PrivateRoute><Layout><ErrorBoundary><NewDischargeSummary /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/detailed-discharge-summary" element={<PrivateRoute><Layout><ErrorBoundary><DetailedDischargeSummary /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/discharge" element={<PrivateRoute><Layout><ErrorBoundary><DischargeLauncher /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/discharge-template" element={<PrivateRoute><Layout><ErrorBoundary><NewDischargeSummary /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/discharge" element={<PrivateRoute><Layout><ErrorBoundary><NewDischargeSummary /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/discharge/:id" element={<PrivateRoute><Layout><ErrorBoundary><NewDischargeSummary /></ErrorBoundary></Layout></PrivateRoute>} />
          {/* Discharge invoice page removed (handled via billing/invoice routes) */}
          <Route path="/discharge/new" element={<PrivateRoute><Layout><ErrorBoundary><NewDischargeSummary /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/discharge/summary/:id" element={<PrivateRoute><Layout><ErrorBoundary><NewDischargeSummary /></ErrorBoundary></Layout></PrivateRoute>} />

          {/* Dedicated page for discharged patients */}
          <Route path="/patients/discharged" element={<PrivateRoute><Layout><DischargedPatientsList /></Layout></PrivateRoute>} />
          <Route path="/patients/:id/diagnosis" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Diagnosis" /></ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/patients/:id/referral-letter" element={<PrivateRoute><Layout><ErrorBoundary><Placeholder title="Referral Letter" /></ErrorBoundary></Layout></PrivateRoute>} />
          
          {/* Admission Summary Routes */}
          <Route path="/admission/:patientId/summary" element={<PrivateRoute><Layout><ErrorBoundary>
            <AdmissionSummary />
          </ErrorBoundary></Layout></PrivateRoute>} />

          {/* Admission Billing Routes */}
          <Route path="/admission/:id/billing/theatre" element={<PrivateRoute><Layout><ErrorBoundary>
            <NewTheatreBill />
          </ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/admission/:id/billing/meal" element={<PrivateRoute><Layout><ErrorBoundary>
            <NewMealBill />
          </ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/admission/:id/billing/lab" element={<PrivateRoute><Layout><ErrorBoundary>
            <NewLabBill />
          </ErrorBoundary></Layout></PrivateRoute>} />
          <Route path="/admission/:id/billing/pharmacy" element={<PrivateRoute><Layout><ErrorBoundary>
            <NewPharmacyBill />
          </ErrorBoundary></Layout></PrivateRoute>} />
          
          {/* Admin Routes */}
          <Route path="/dashboard/admin/patients" element={<PrivateRoute><Layout><AdminPatients /></Layout></PrivateRoute>} />
          <Route path="/dashboard/admin/patients/:id" element={<PrivateRoute><Layout><AdminPatient /></Layout></PrivateRoute>} />
          <Route path="/dashboard/admin/patients/:id/assign" element={<PrivateRoute><Layout><AdminAssignDoctor /></Layout></PrivateRoute>} />
          <Route path="/dashboard/admin/users/:id" element={<PrivateRoute><Layout><AdminUser /></Layout></PrivateRoute>} />
          <Route path="/dashboard/admin/settings" element={<PrivateRoute><Layout><AdminSettings /></Layout></PrivateRoute>} />
          <Route path="/dashboard/admin/notifications" element={<PrivateRoute><Layout><AdminNotifications /></Layout></PrivateRoute>} />
          <Route path="/dashboard/admin/nurseassignment" element={<PrivateRoute><Layout><AdminNurseAssignment /></Layout></PrivateRoute>} />
          <Route path="/dashboard/admin/departments" element={<PrivateRoute><Layout><AdminDepartments /></Layout></PrivateRoute>} />
          <Route path="/dashboard/admin/consultations" element={<PrivateRoute><Layout><AdminConsultations /></Layout></PrivateRoute>} />
          <Route path="/dashboard/admin/management-charges" element={<PrivateRoute><Layout><ManagementCharges /></Layout></PrivateRoute>} />
          <Route path="/dashboard/admin/slots" element={<PrivateRoute><Layout><AdminSlots /></Layout></PrivateRoute>} />
            <Route path="/dashboard/admin/managewards" element={<PrivateRoute><Layout><ManageWards /></Layout></PrivateRoute>} />
            <Route path="/dashboard/admin/drugs" element={<PrivateRoute><Layout><DrugsAdmin /></Layout></PrivateRoute>} />
            <Route path="/dashboard/admin/meals" element={<PrivateRoute><Layout><ManageMeals /></Layout></PrivateRoute>} />

          {/* Doctor specific routes */}
          <Route path="/dashboard/doctor/patients" element={<PrivateRoute><Layout><PatientsForMe /></Layout></PrivateRoute>} />
          <Route path="/dashboard/doctor/appointments" element={<PrivateRoute><Layout><AppointmentsForMe /></Layout></PrivateRoute>} />
            <Route path="/dashboard/doctor/admitpatient" element={<PrivateRoute><Layout><AdmitPatient /></Layout></PrivateRoute>} />
             <Route path="/dashboard/doctor/admitted" element={<PrivateRoute><Layout><DoctorAdmittedPatients /></Layout></PrivateRoute>} />

          <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
          <Route path="/appointments" element={<PrivateRoute><Layout><Appointments /></Layout></PrivateRoute>} />
          {/* Patient-specific route (used by sidebar) */}
          <Route path="/dashboard/patient/appointments" element={<PrivateRoute><Layout><Appointments /></Layout></PrivateRoute>} />
          <Route path="/dashboard/patient/prescriptions" element={<PrivateRoute><Layout><PatientPrescriptions /></Layout></PrivateRoute>} />
          <Route path="/pharmacy" element={<PrivateRoute><Layout><Pharmacy /></Layout></PrivateRoute>} />
          <Route path="/pharmacy/pos" element={<PrivateRoute><Layout><POS /></Layout></PrivateRoute>} />
          <Route path="/dashboard/pharmacy/dispense" element={<PrivateRoute><Layout><DispenseDrugs /></Layout></PrivateRoute>} />
          <Route path="/billing" element={<PrivateRoute><Layout><Billing /></Layout></PrivateRoute>} />
          <Route path="/billing/:invoiceId" element={<PrivateRoute><Layout><InvoiceDetail /></Layout></PrivateRoute>} />
          <Route path="/finance/invoices/:id" element={<PrivateRoute><Layout><InvoicePage /></Layout></PrivateRoute>} />
          <Route path="/dashboard/finance/appointments" element={<PrivateRoute><Layout><AppointmentsBilling /></Layout></PrivateRoute>} />
          <Route path="/dashboard/finance/transactions" element={<PrivateRoute><Layout><Transactions /></Layout></PrivateRoute>} />
          <Route path="/dashboard/finance/reports" element={<PrivateRoute><Layout><Reports /></Layout></PrivateRoute>} />
          <Route path="/dashboard/finance/refunds" element={<PrivateRoute><Layout><Refunds /></Layout></PrivateRoute>} />
          <Route path="/dashboard/reception/appointments" element={<PrivateRoute><Layout><ReceptionAppointments /></Layout></PrivateRoute>} />
          <Route path="/dashboard/reception" element={<PrivateRoute><Layout><ReceptionistDashboard /></Layout></PrivateRoute>} />
          <Route path="/dashboard/nurse" element={<PrivateRoute><Layout><NurseDashboard /></Layout></PrivateRoute>} />
          <Route path="/dashboard/staff" element={<PrivateRoute><Layout><StaffRequests /></Layout></PrivateRoute>} />
          <Route path="/dashboard/nurse/admissions" element={<PrivateRoute><Layout><NurseAdmissionHistory /></Layout></PrivateRoute>} />
          <Route path="/dashboard/messages" element={<PrivateRoute><Layout><ChatPage /></Layout></PrivateRoute>} />

          <Route path="*" element={<NotFound />} />
          {/* Laboratory Routes */}
          <Route path="/dashboard/lab" element={<PrivateRoute><Layout><LabDashboard /></Layout></PrivateRoute>} />
          <Route path="/dashboard/lab/queue" element={<PrivateRoute><Layout><LabQueue /></Layout></PrivateRoute>} />
          <Route path="/dashboard/lab/requests" element={<PrivateRoute><Layout><LabRequests /></Layout></PrivateRoute>} />
          <Route path="/dashboard/lab/review" element={<PrivateRoute><Layout><LabTestReview /></Layout></PrivateRoute>} />
          <Route path="/dashboard/lab/tests" element={<PrivateRoute><Layout><LabTests /></Layout></PrivateRoute>} />
          <Route path="/dashboard/lab/prices" element={<PrivateRoute><Layout><LabPrices /></Layout></PrivateRoute>} />
          <Route path="/dashboard/lab/patient-report" element={<PrivateRoute><Layout><LabPatientReport /></Layout></PrivateRoute>} />
          <Route path="/dashboard/lab/templates" element={<PrivateRoute><Layout><LabTemplates /></Layout></PrivateRoute>} />
          <Route path="/lab/results/:requestId" element={<PrivateRoute><Layout><LabResult /></Layout></PrivateRoute>} />
        </Routes>
        </Router>
      </UIProvider>
    </AuthProvider>
  );
}

function DashboardRouter() {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  switch (user.role) {
    case 'admin':
      return <Layout><AdminDashboard /></Layout>;
    case 'doctor':
      return <Layout><DoctorDashboard /></Layout>;
    case 'patient':
      return <Layout><PatientDashboard /></Layout>;
    case 'pharmacist':
      return <Layout><PharmacistDashboard /></Layout>;
    case 'finance':
      return <Layout><FinanceDashboard /></Layout>;
    case 'receptionist':
      return <Layout><ReceptionistDashboard /></Layout>;
    case 'nurse':
      return <Layout><NurseDashboard /></Layout>;
    case 'cleaning':
      return <Layout><StaffRequests /></Layout>;
    case 'maintenance':
      return <Layout><StaffRequests /></Layout>;
    case 'lab_technician':
      return <Layout><LabDashboard /></Layout>;
    default:
      return <NotFound />;
  }
}

export default App;
