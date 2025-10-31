import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';

import Login from './pages/Login';
import Register from './pages/Register';
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
import LabDashboard from './components/Dashboard/LabDashboard';
import LabQueue from './pages/LabQueue';
import AdminPatient from './pages/admin/AdminPatient';
import AdminAssignDoctor from './pages/admin/AdminAssignDoctor';
import AdminUser from './pages/admin/AdminUser';
import AppointmentsBilling from './pages/finance/AppointmentsBilling';
import PatientList from './pages/PatientList';
import RegisterPatient from './pages/RegisterPatient';
import Transactions from './pages/finance/Transactions';
import Reports from './pages/finance/Reports';
import Refunds from './pages/finance/Refunds';
import ReceptionAppointments from './pages/reception/Appointments';
import StaffRequests from './pages/staff/StaffRequests';
import ChatPage from './pages/Chat';

function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <Router>
          <Routes>
          <Route path="/" element={<Navigate to="/login" />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
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
          {/* Patient Management Routes */}
          <Route path="/patients" element={<PrivateRoute><Layout><PatientList /></Layout></PrivateRoute>} />
          <Route path="/patients/register" element={<PrivateRoute><Layout><RegisterPatient /></Layout></PrivateRoute>} />
          <Route path="/patients/admitted" element={<PrivateRoute><Layout><AdmittedPatients /></Layout></PrivateRoute>} />
          <Route path="/patients/visits" element={<PrivateRoute><Layout><PatientVisits /></Layout></PrivateRoute>} />
          <Route path="/patients/visits/report" element={<PrivateRoute><Layout><VisitsReport /></Layout></PrivateRoute>} />
          
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
          <Route path="/dashboard/admin/slots" element={<PrivateRoute><Layout><AdminSlots /></Layout></PrivateRoute>} />
            <Route path="/dashboard/admin/managewards" element={<PrivateRoute><Layout><ManageWards /></Layout></PrivateRoute>} />
            <Route path="/dashboard/admin/drugs" element={<PrivateRoute><Layout><DrugsAdmin /></Layout></PrivateRoute>} />

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
          <Route path="/billing" element={<PrivateRoute><Layout><Billing /></Layout></PrivateRoute>} />
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
          <Route path="/dashboard/lab/queue" element={<PrivateRoute><Layout><LabQueue /></Layout></PrivateRoute>} />
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
