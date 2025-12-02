import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FaTachometerAlt, FaUsers, FaCalendarAlt, FaPills, FaFileInvoiceDollar, FaUserPlus, FaFolder, FaClock, FaBoxes, FaEnvelope, FaBars, FaChevronLeft, FaCog, FaChevronDown, FaChevronUp, FaClipboard, FaStethoscope, FaBriefcase } from 'react-icons/fa';

export default function Sidebar({ role, onCollapse }) {
  const { axiosInstance, user } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    } catch (e) { return false; }
  });

  useEffect(()=>{
    try { localStorage.setItem('sidebarCollapsed', collapsed ? 'true' : 'false'); } catch(e){}
    if (onCollapse) onCollapse(collapsed);
  },[collapsed, onCollapse]);

  const toggleCollapsed = () => setCollapsed(s => !s);

  const common = [
    { to: '/dashboard', label: 'Overview', icon: <FaTachometerAlt />, perm: 'overview' },
    { to: '/profile', label: 'Profile', icon: <FaUsers />, perm: 'profile' },
  ];

  const itemsByRole = {
    admin: [
      { to: '/appointments', label: 'Appointments', icon: <FaCalendarAlt />, perm: 'appointments' },
      { to: '/dashboard/admin/patients', label: 'Patients', icon: <FaUsers />, perm: 'patients' },
      { to: '/dashboard/admin/tools', label: 'Admin Tools', icon: <FaBars />, perm: 'manageDiagnoses' },
      { to: '/dashboard/admin/users', label: 'Manage Users', icon: <FaUsers />, perm: 'manageUsers' },
      { to: '/dashboard/admin/settings', label: 'Settings', icon: <FaCog />, perm: 'settings' },
      { to: '/dashboard/admin/doctors', label: 'Doctors', icon: <FaUserPlus />, perm: 'doctors' },
      { to: '/dashboard/admin/departments', label: 'Departments', icon: <FaFolder />, perm: 'departments' },
      { to: '/dashboard/admin/doctors', label: "Doctors' Schedule", icon: <FaClock />, perm: 'doctorsSchedule' },
      { to: '/dashboard/admin/consultations', label: 'Consultations', icon: <FaFolder />, perm: 'consultations' },
      { to: '/dashboard/admin/management-charges', label: 'Management Charges', icon: <FaFileInvoiceDollar />, perm: 'manageCharges' },
      { to: '/dashboard/admin/slots', label: 'Available Slots', icon: <FaClock />, perm: 'availableSlots' },
      { to: '/billing', label: 'Payments / Invoices', icon: <FaFileInvoiceDollar />, perm: 'billing' },
      { to: '/dashboard/admin/managewards', label: 'Manage Wards', icon: <FaFolder />, perm: 'manageWards' },
      { to: '/dashboard/admin/nurseassignment', label: 'Nurse Assignment', icon: <FaUsers />, perm: 'nurseAssignment' },
      { to: '/pharmacy', label: 'Inventory', icon: <FaBoxes />, perm: 'inventory' },
      { to: '/pharmacy/pos', label: 'POS', icon: <FaFileInvoiceDollar />, perm: 'inventory' },
      { to: '/pharmacy/dispense', label: 'Dispense Requests', icon: <FaBoxes />, perm: 'inventory' },
      { to: '/pharmacy/reverse', label: 'Reverse Confirmed', icon: <FaBoxes />, perm: 'inventory' },
      { to: '/pharmacy/injections', label: 'Injections', icon: <FaBoxes />, perm: 'inventory' },
      { to: '/pharmacy/inventory', label: 'Inventory', icon: <FaBoxes />, perm: 'inventory' },
      { to: '/pharmacy/register-drugs', label: 'Register Drugs', icon: <FaPills />, perm: 'inventory' },
      { to: '/pharmacy/sales-report', label: 'Transactions', icon: <FaFileInvoiceDollar />, perm: 'inventory' },
      { to: '/pharmacy/edit-group', label: 'Edit Medication Groups', icon: <FaBoxes />, perm: 'inventory' },
      { to: '/dashboard/admin/drugs', label: 'Drugs', icon: <FaPills />, perm: 'drugs' },
      { to: '/dashboard/messages', label: 'Messages', icon: <FaEnvelope />, perm: 'messages' },
      
      { to: '/symptomate', label: 'Symptomate', icon: <FaEnvelope />, perm: 'symptoms' },
      // Laboratory links for admins
      { to: '/lab', label: 'Lab Dashboard', icon: <FaFolder />, perm: 'lab' },
      { to: '/lab/requests-inpatient', label: 'Inpatient Requests', icon: <FaFolder />, perm: 'lab' },
      { to: '/lab/requests-outpatient', label: 'Outpatient Requests', icon: <FaFolder />, perm: 'lab' },
      { to: '/lab/internal-visits', label: 'Internal Visits', icon: <FaFolder />, perm: 'lab' },
      { to: '/lab/external-visits', label: 'External Visits', icon: <FaFolder />, perm: 'lab' },
      { to: '/lab/visits-report', label: 'Visits Report', icon: <FaCalendarAlt />, perm: 'lab' },
      { to: '/lab/prices', label: 'Lab Tests Prices', icon: <FaFileInvoiceDollar />, perm: 'lab' },
      { to: '/lab/templates', label: 'Lab Templates', icon: <FaFolder />, perm: 'lab' },
      { to: '/dashboard/mortuary', label: 'Mortuary', icon: <FaBriefcase />, perm: 'mortuary' },
      { to: '/triage', label: 'Triage Assessments', icon: <FaClipboard />, perm: 'triage' },
      { to: '/consultations', label: 'Consultations', icon: <FaStethoscope />, perm: 'consultations' },
    ],
    doctor: [
        { to: '/triage', label: 'Triage Assessments', icon: <FaClipboard />, perm: 'triage' },
        { to: '/consultations', label: 'Consultations', icon: <FaStethoscope />, perm: 'consultations' },
      { to: '/dashboard/doctor/appointments', label: 'Appointments', icon: <FaCalendarAlt />, perm: 'appointments' },
      { to: '/dashboard/doctor/admitpatient', label: 'Admit Patient', icon: <FaUserPlus />, perm: 'patients' },
      { to: '/dashboard/doctor/admitted', label: 'Admitted Patients', icon: <FaUsers />, perm: 'patients' },
      { to: '/dashboard/doctor/patients', label: 'Patients', icon: <FaUsers />, perm: 'patients' },
      { to: '/dashboard/messages', label: 'Messages', icon: <FaEnvelope />, perm: 'messages' },
      // admin-grantable permissions for doctors
      { to: '/appointments', label: 'View Appointments', icon: <FaCalendarAlt />, perm: 'appointments' },
      { to: '/dashboard/admin/slots', label: 'Available Slots', icon: <FaClock />, perm: 'availableSlots' },
      { to: '/dashboard/admin/consultations', label: 'Consultations', icon: <FaFolder />, perm: 'consultations' },
      { to: '/billing', label: 'Payments / Invoices', icon: <FaFileInvoiceDollar />, perm: 'billing' },
      { to: '/lab', label: 'Lab Dashboard', icon: <FaFolder />, perm: 'lab' },
      { to: '/lab/requests-inpatient', label: 'Inpatient Requests', icon: <FaFolder />, perm: 'lab' },
      { to: '/lab/requests-outpatient', label: 'Outpatient Requests', icon: <FaFolder />, perm: 'lab' },
      { to: '/dashboard/admin/drugs', label: 'Drugs', icon: <FaPills />, perm: 'drugs' },
      { to: '/pharmacy', label: 'Inventory', icon: <FaBoxes />, perm: 'inventory' },
      { to: '/dashboard/admin/users', label: 'Manage Users', icon: <FaUsers />, perm: 'manageUsers' },
    ],
    pharmacist: [
      { to: '/pharmacy', label: 'Pharmacy Home', icon: <FaPills />, perm: 'inventory' },
      { to: '/pharmacy/pos', label: 'POS', icon: <FaFileInvoiceDollar />, perm: 'inventory' },
      { to: '/pharmacy/dispense', label: 'Dispense Requests', icon: <FaBoxes />, perm: 'inventory' },
      { to: '/pharmacy/reverse', label: 'Reverse Confirmed', icon: <FaBoxes />, perm: 'inventory' },
      { to: '/pharmacy/injections', label: 'Injections', icon: <FaBoxes />, perm: 'inventory' },
      { to: '/pharmacy/inventory', label: 'Inventory', icon: <FaBoxes />, perm: 'inventory' },
      { to: '/pharmacy/register-drugs', label: 'Register Drugs', icon: <FaPills />, perm: 'inventory' },
      { to: '/pharmacy/sales-report', label: 'Transactions', icon: <FaFileInvoiceDollar />, perm: 'inventory' },
      { to: '/pharmacy/edit-group', label: 'Edit Medication Groups', icon: <FaBoxes />, perm: 'inventory' },
      { to: '/dashboard/messages', label: 'Messages', icon: <FaEnvelope />, perm: 'messages' },
      // admin-grantable permissions
      { to: '/appointments', label: 'View Appointments', icon: <FaCalendarAlt />, perm: 'appointments' },
      { to: '/dashboard/admin/patients', label: 'Patients', icon: <FaUsers />, perm: 'patients' },
      { to: '/dashboard/admin/slots', label: 'Available Slots', icon: <FaClock />, perm: 'availableSlots' },
      { to: '/billing', label: 'Payments / Invoices', icon: <FaFileInvoiceDollar />, perm: 'billing' },
      { to: '/dashboard/admin/drugs', label: 'Drugs', icon: <FaPills />, perm: 'drugs' },
    ],
    finance: [
      { to: '/billing', label: 'Billing', icon: <FaFileInvoiceDollar />, perm: 'billing' },
      { to: '/dashboard/finance/transactions', label: 'Transactions', icon: <FaFileInvoiceDollar />, perm: 'billing' },
      { to: '/dashboard/finance/appointments', label: 'Bill Appointments', icon: <FaCalendarAlt />, perm: 'billing' },
      { to: '/dashboard/finance/reports', label: 'Reports', icon: <FaFileInvoiceDollar />, perm: 'billing' },
      { to: '/dashboard/finance/refunds', label: 'Refunds', icon: <FaFileInvoiceDollar />, perm: 'billing' },
      { to: '/dashboard/messages', label: 'Messages', icon: <FaEnvelope />, perm: 'messages' },
      // admin-grantable permissions
      { to: '/appointments', label: 'View Appointments', icon: <FaCalendarAlt />, perm: 'appointments' },
      { to: '/dashboard/admin/patients', label: 'Patients', icon: <FaUsers />, perm: 'patients' },
      { to: '/dashboard/admin/users', label: 'Manage Users', icon: <FaUsers />, perm: 'manageUsers' },
    ],
    receptionist: [
      { to: '/dashboard/reception', label: 'Registration', icon: <FaUserPlus />, perm: 'patients' },
      { to: '/dashboard/reception/appointments', label: 'Appointments', icon: <FaCalendarAlt />, perm: 'appointments' },
      { to: '/dashboard/messages', label: 'Messages', icon: <FaEnvelope />, perm: 'messages' },
      // admin-grantable permissions
      { to: '/dashboard/admin/slots', label: 'Available Slots', icon: <FaClock />, perm: 'availableSlots' },
      { to: '/dashboard/admin/consultations', label: 'Consultations', icon: <FaFolder />, perm: 'consultations' },
      { to: '/billing', label: 'Payments / Invoices', icon: <FaFileInvoiceDollar />, perm: 'billing' },
    ],
    patient: [
      { to: '/dashboard/patient/appointments', label: 'My Appointments', icon: <FaCalendarAlt />, perm: 'appointments' },
      { to: '/dashboard/patient/prescriptions', label: 'Prescriptions', icon: <FaPills />, perm: 'drugs' },
    ],
    nurse: [
      { to: '/dashboard/nurse', label: 'Nurse Dashboard', icon: <FaUsers />, perm: 'nurse' },
      { to: '/dashboard/nurse/admissions', label: 'Admission History', icon: <FaClock />, perm: 'patients' },
      { to: '/dashboard/messages', label: 'Messages', icon: <FaEnvelope />, perm: 'messages' },
      // admin-grantable permissions
      { to: '/appointments', label: 'View Appointments', icon: <FaCalendarAlt />, perm: 'appointments' },
      { to: '/dashboard/admin/patients', label: 'Patients', icon: <FaUsers />, perm: 'patients' },
      { to: '/dashboard/admin/consultations', label: 'Consultations', icon: <FaFolder />, perm: 'consultations' },
      { to: '/lab', label: 'Lab Dashboard', icon: <FaFolder />, perm: 'lab' },
      { to: '/triage', label: 'Triage Assessments', icon: <FaClipboard />, perm: 'triage' },
      { to: '/consultations', label: 'Consultations', icon: <FaStethoscope />, perm: 'consultations' },
    ],
    lab: [
      { to: '/lab', label: 'Lab Dashboard', icon: <FaFolder />, perm: 'lab' },
      { to: '/lab/requests-inpatient', label: 'Inpatient Requests', icon: <FaFolder />, perm: 'lab' },
      { to: '/lab/requests-outpatient', label: 'Outpatient Requests', icon: <FaFolder />, perm: 'lab' },
      { to: '/lab/internal-visits', label: 'Internal Visits', icon: <FaFolder />, perm: 'lab' },
      { to: '/lab/external-visits', label: 'External Visits', icon: <FaFolder />, perm: 'lab' },
      { to: '/lab/visits-report', label: 'Visits Report', icon: <FaCalendarAlt />, perm: 'lab' },
      { to: '/lab/prices', label: 'Lab Tests Prices', icon: <FaFileInvoiceDollar />, perm: 'lab' },
      { to: '/lab/templates', label: 'Lab Templates', icon: <FaFolder />, perm: 'lab' },
      { to: '/patients', label: 'Inpatient Requests', icon: <FaUsers />, perm: 'patients' },
      { to: '/dashboard/messages', label: 'Messages', icon: <FaEnvelope />, perm: 'messages' },
      // admin-grantable permissions
      { to: '/appointments', label: 'View Appointments', icon: <FaCalendarAlt />, perm: 'appointments' },
      { to: '/dashboard/admin/patients', label: 'Patients', icon: <FaUsers />, perm: 'patients' },
      { to: '/dashboard/admin/consultations', label: 'Consultations', icon: <FaFolder />, perm: 'consultations' },
      { to: '/billing', label: 'Payments / Invoices', icon: <FaFileInvoiceDollar />, perm: 'billing' },
    ],
    cleaning: [
      { to: '/dashboard/staff', label: 'My Tasks', icon: <FaBoxes /> },
    ],
    maintenance: [
      { to: '/dashboard/staff', label: 'My Tasks', icon: <FaBoxes /> },
    ],
  };

  // patient related links (shown under a collapsible group)
  const patientItems = [
    { to: '/patients', label: 'All Patients', icon: <FaUsers />, perm: 'patients' },
    { to: '/patients/register', label: 'Register Patient', icon: <FaUserPlus />, perm: 'patients' },
    { to: '/dashboard/doctor/admitpatient', label: 'Admit Patient', icon: <FaUserPlus />, perm: 'patients' },
    { to: '/patients/admitted', label: 'Admitted Patients', icon: <FaUsers />, perm: 'patients' },
    { to: '/patients/discharged', label: 'Discharge / Invoices', icon: <FaFileInvoiceDollar />, perm: 'patients' },
    { to: '/patients/visits', label: 'Patient Visits', icon: <FaCalendarAlt />, perm: 'patients' },
    { to: '/patients/visits/report', label: 'Visits Report', icon: <FaFileInvoiceDollar />, perm: 'patients' },
  ];

  // decide if patient management should be shown
  const patientVisible = (() => {
    // admin should always see patient management
    if (user && user.role === 'admin') return true;
    // if we have an authenticated user, prefer their explicit per-user permission when set
    if (user && user.permissions && user.permissions.sidebar && typeof user.permissions.sidebar.patients !== 'undefined') {
      return !!user.permissions.sidebar.patients;
    }
    // strict mode: hide unless explicitly assigned
    return false;
  })();

  // helper to check if a sidebar item should be visible based on explicit permissions
  const hasPermissionFor = (key) => {
    // if user has explicit permission set, use that
    const allowed = user && user.permissions && user.permissions.sidebar && typeof user.permissions.sidebar[key] !== 'undefined' ? !!user.permissions.sidebar[key] : false;
    if (user && user._id && !allowed && user.permissions?.sidebar) {
      // debug: log denied permissions
      // console.debug(`User ${user._id}: permission denied for key "${key}", current sidebar:`, user.permissions.sidebar);
    }
    return allowed;
  };

  // helper to filter items based on whether user has any explicit permission assignments
  const filterByPermissions = (itemList) => {
    // admin sees everything
    if (user && user.role === 'admin') return itemList;

    // STRICT MODE: Only show Overview/Profile when no permissions set
    if (!user || !user.permissions || !user.permissions.sidebar || Object.keys(user.permissions.sidebar).length === 0) {
      return itemList.filter(item => item === common[0] || item === common[1]);
    }

    // user has explicit permissions: show only items that have a perm key and
    // which the user has been granted, plus the common overview/profile links
    return itemList.filter(item => {
      if (item === common[0] || item === common[1]) return true;
      // if item has an explicit perm field, use it
      if (item && item.perm) return hasPermissionFor(item.perm);
      // no explicit perm -> hide by default in strict mode
      return false;
    });
  };

  const items = filterByPermissions([...common, ...(patientVisible ? patientItems : []), ...(itemsByRole[role] || [])]);
  
  // DEBUG: log final filtered items
  useEffect(() => {
    if (user) {
      console.debug(`[Sidebar] User: ${user._id}, Role: ${user.role}, Permissions:`, user.permissions?.sidebar || {}, 'Final items count:', items.length);
    }
  }, [user, items]);

  const [patientsOpen, setPatientsOpen] = useState(false);
  const [labOpen, setLabOpen] = useState(false);
  const [pharmacyOpen, setPharmacyOpen] = useState(false);
  const [triageOpen, setTriageOpen] = useState(false);
  const [consultationsOpen, setConsultationsOpen] = useState(false);
  const [mortuaryOpen, setMortuaryOpen] = useState(false);
  const [hrOpen, setHrOpen] = useState(false);
  const [admittedCount, setAdmittedCount] = useState(0);

  // collect lab-related links (those under /dashboard/lab) and filter by permissions
  const labItems = items.filter(i => typeof i.to === 'string' && (i.to.startsWith('/dashboard/lab') || i.to.startsWith('/lab')));
  // collect pharmacy-related links
  const pharmacyItems = items.filter(i => typeof i.to === 'string' && (i.to.startsWith('/pharmacy') || i.to.startsWith('/dashboard/pharmacy')));
  // collect triage-related links
  const triageItems = items.filter(i => typeof i.to === 'string' && i.to.startsWith('/triage'));
  // collect consultation-related links
  const consultationItems = items.filter(i => typeof i.to === 'string' && i.to.startsWith('/consultations'));
  // collect mortuary-related links
  const mortuaryItems = items.filter(i => typeof i.to === 'string' && (i.to.startsWith('/dashboard/mortuary') || i.to.startsWith('/mortuary')));
  // collect HR-related links for admin users
  const hrItems = user?.role === 'admin' ? [
    { to: '/dashboard/hr', label: 'HR Dashboard', icon: <FaBriefcase />, perm: 'humanResource' },
    { to: '/dashboard/employees', label: 'Employees', icon: <FaUsers />, perm: 'humanResource' },
    { to: '/dashboard/attendance', label: 'Attendance', icon: <FaClock />, perm: 'humanResource' },
    { to: '/dashboard/leaves', label: 'Leaves', icon: <FaCalendarAlt />, perm: 'humanResource' },
    { to: '/dashboard/expenses', label: 'Expenses', icon: <FaFileInvoiceDollar />, perm: 'humanResource' },
    { to: '/dashboard/hiring', label: 'Hiring', icon: <FaUserPlus />, perm: 'humanResource' },
    { to: '/dashboard/payroll', label: 'Payroll', icon: <FaFileInvoiceDollar />, perm: 'humanResource' },
    // mortuary links removed from HR group - shown under a dedicated Mortuary collapse
  ] : [];

  useEffect(() => {
    if (role === 'doctor') {
      (async () => {
        try {
          const res = await axiosInstance.get('/patients/admitted');
          setAdmittedCount((res.data.patients || []).length || 0);
        } catch (e) { /* ignore */ }
      })();
    }
  }, [role]);

  const [hovered, setHovered] = useState(false);

  if (collapsed) {
    return (
      <div className="relative">
        <aside
          className="w-16 bg-white border-r p-2 hidden md:flex md:flex-col md:overflow-auto md:min-h-0 md:h-full"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="mb-4 text-center">
            <div className="text-lg font-bold text-brand-700">CC</div>
          </div>
          <nav className="flex flex-col gap-2 items-center">
            {items.map(i => (
              <Link key={i.to} to={i.to} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-100 w-full">
                <div className="text-lg text-brand-600">{i.icon}</div>
                <div className="text-xs text-gray-700">{i.label.split(' ')[0]}</div>
              </Link>
            ))}
            <button onClick={toggleCollapsed} className="mt-4 p-2 text-sm text-gray-600 rounded hover:bg-gray-100" title="Expand sidebar">
              <FaBars />
            </button>
          </nav>
        </aside>
        {/* expanded overlay shown on hover */}
        {hovered && (
          <div
            className="absolute left-16 top-0 w-64 h-full bg-white border-r shadow-md z-50 hidden md:block"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <div className="flex justify-between items-center p-4">
              <div>
                <div className="text-xl font-bold text-brand-700">CoreCare</div>
                <div className="text-sm text-gray-500">Community Hospital</div>
              </div>
              <button onClick={toggleCollapsed} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Collapse sidebar">
                <FaChevronLeft />
              </button>
            </div>
            <nav className="flex flex-col gap-2 p-2">
              {/* Patient management group in hover-expanded overlay - only show if user has permission */}
              {patientVisible && (
                <div>
                  <button onClick={() => setPatientsOpen(p => !p)} className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium hover:bg-gray-100">
                    <div className="flex items-center gap-2"><div className="text-sm text-brand-600"><FaUsers /></div><div>Patients</div></div>
                    <div>{patientsOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
                  </button>
                  {patientsOpen && (
                    <div className="pl-8 flex flex-col">
                      {patientItems.map(i => (
                        <Link key={i.to} to={i.to} onClick={() => setPatientsOpen(false)} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                          <div className="text-sm text-brand-600">{i.icon}</div>
                          <div className="text-sm">{i.label}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Pharmacy group in hover overlay */}
              {pharmacyItems.length > 0 && (
                <div>
                  <button onClick={() => setPharmacyOpen(p => !p)} className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium hover:bg-gray-100">
                    <div className="flex items-center gap-2"><div className="text-sm text-brand-600"><FaPills /></div><div>Pharmacy</div></div>
                    <div>{pharmacyOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
                  </button>
                  {pharmacyOpen && (
                    <div className="pl-8 flex flex-col">
                      {pharmacyItems.map(i => (
                        <Link key={i.to} to={i.to} onClick={() => setPharmacyOpen(false)} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                          <div className="text-sm text-brand-600">{i.icon}</div>
                          <div className="text-sm">{i.label}</div>
                        </Link>
                      ))}
                    </div>
                  )}\
                </div>
              )}
              {/* Triage group in hover overlay */}
              {triageItems.length > 0 && (
                <div>
                  <button onClick={() => setTriageOpen(p => !p)} className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium hover:bg-gray-100">
                    <div className="flex items-center gap-2"><div className="text-sm text-brand-600"><FaClipboard /></div><div>Triage</div></div>
                    <div>{triageOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
                  </button>
                  {triageOpen && (
                    <div className="pl-8 flex flex-col">
                      {triageItems.map(i => (
                        <Link key={i.to} to={i.to} onClick={() => setTriageOpen(false)} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                          <div className="text-sm text-brand-600">{i.icon}</div>
                          <div className="text-sm">{i.label}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Consultations group in hover overlay */}
              {consultationItems.length > 0 && (
                <div>
                  <button onClick={() => setConsultationsOpen(p => !p)} className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium hover:bg-gray-100">
                    <div className="flex items-center gap-2"><div className="text-sm text-brand-600"><FaStethoscope /></div><div>Consultations</div></div>
                    <div>{consultationsOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
                  </button>
                  {consultationsOpen && (
                    <div className="pl-8 flex flex-col">
                      {consultationItems.map(i => (
                        <Link key={i.to} to={i.to} onClick={() => setConsultationsOpen(false)} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                          <div className="text-sm text-brand-600">{i.icon}</div>
                          <div className="text-sm">{i.label}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Mortuary group in hover overlay */}
              {mortuaryItems.length > 0 && (
                <div>
                  <button onClick={() => setMortuaryOpen(p => !p)} className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium hover:bg-gray-100">
                    <div className="flex items-center gap-2"><div className="text-sm text-brand-600"><FaBriefcase /></div><div>Mortuary</div></div>
                    <div>{mortuaryOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
                  </button>
                  {mortuaryOpen && (
                    <div className="pl-8 flex flex-col">
                      {mortuaryItems.map(i => (
                        <Link key={i.to} to={i.to} onClick={() => setMortuaryOpen(false)} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                          <div className="text-sm text-brand-600">{i.icon}</div>
                          <div className="text-sm">{i.label}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Human Resource group in hover overlay */}
              {hrItems.length > 0 && (
                <div>
                  <button onClick={() => setHrOpen(p => !p)} className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium hover:bg-gray-100">
                    <div className="flex items-center gap-2"><div className="text-sm text-brand-600"><FaBriefcase /></div><div>Human Resource</div></div>
                    <div>{hrOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
                  </button>
                  {hrOpen && (
                    <div className="pl-8 flex flex-col">
                      {hrItems.map(i => (
                        <Link key={i.to} to={i.to} onClick={() => setHrOpen(false)} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                          <div className="text-sm text-brand-600">{i.icon}</div>
                          <div className="text-sm">{i.label}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* remaining items */}
              {items.filter(i => !patientItems.find(p => p.to === i.to) && !pharmacyItems.find(p => p.to === i.to) && !labItems.find(l => l.to === i.to) && !triageItems.find(t => t.to === i.to) && !consultationItems.find(c => c.to === i.to)).map(i => (
                <Link key={i.to} to={i.to} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                  <div className="text-sm text-brand-600">{i.icon}</div>
                  <div className="text-sm">{i.label}</div>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    );
  }

  return (
  <aside className="w-64 bg-white border-r p-4 hidden md:flex flex-col md:overflow-auto md:min-h-0 md:h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-xl font-bold text-brand-700">CoreCare</div>
          <div className="text-sm text-gray-500"></div>
        </div>
        <button onClick={toggleCollapsed} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Collapse sidebar">
          <FaChevronLeft />
        </button>
      </div>
      
      <nav className="flex flex-col gap-2 flex-1">
        {/* Patient management group - only show if user has permission */}
        {patientVisible && (
        <div>
          <button onClick={() => setPatientsOpen(p => !p)} className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium hover:bg-gray-100">
            <div className="flex items-center gap-2"><div className="text-sm text-brand-600"><FaUsers /></div><div>Patients</div></div>
            <div>{patientsOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
          </button>
          {patientsOpen && (
            <div className="pl-4 flex flex-col">
              {patientItems.map(i => (
                <Link key={i.to} to={i.to} onClick={() => setPatientsOpen(false)} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                  <div className="text-sm text-brand-600">{i.icon}</div>
                  <div className="text-sm">{i.label}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Laboratory collapsible group */}
        {labItems.length > 0 && (
          <div>
            <button onClick={() => setLabOpen(p => !p)} className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium hover:bg-gray-100">
              <div className="flex items-center gap-2"><div className="text-sm text-brand-600"><FaFolder /></div><div>Laboratory</div></div>
              <div>{labOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
            </button>
            {labOpen && (
              <div className="pl-4 flex flex-col">
                {labItems.map(i => (
                  <Link key={i.to} to={i.to} onClick={() => setLabOpen(false)} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                    <div className="text-sm text-brand-600">{i.icon}</div>
                    <div className="text-sm">{i.label}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pharmacy collapsible group */}
        {pharmacyItems.length > 0 && (
          <div>
            <button onClick={() => setPharmacyOpen(p => !p)} className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium hover:bg-gray-100">
              <div className="flex items-center gap-2"><div className="text-sm text-brand-600"><FaPills /></div><div>Pharmacy</div></div>
              <div>{pharmacyOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
            </button>
            {pharmacyOpen && (
              <div className="pl-4 flex flex-col">
                {pharmacyItems.map(i => (
                  <Link key={i.to} to={i.to} onClick={() => setPharmacyOpen(false)} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                    <div className="text-sm text-brand-600">{i.icon}</div>
                    <div className="text-sm">{i.label}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Triage collapsible group */}
        {triageItems.length > 0 && (
          <div>
            <button onClick={() => setTriageOpen(p => !p)} className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium hover:bg-gray-100">
              <div className="flex items-center gap-2"><div className="text-sm text-brand-600"><FaClipboard /></div><div>Triage</div></div>
              <div>{triageOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
            </button>
            {triageOpen && (
              <div className="pl-4 flex flex-col">
                {triageItems.map(i => (
                  <Link key={i.to} to={i.to} onClick={() => setTriageOpen(false)} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                    <div className="text-sm text-brand-600">{i.icon}</div>
                    <div className="text-sm">{i.label}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Consultations collapsible group */}
        {consultationItems.length > 0 && (
          <div>
            <button onClick={() => setConsultationsOpen(p => !p)} className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium hover:bg-gray-100">
              <div className="flex items-center gap-2"><div className="text-sm text-brand-600"><FaStethoscope /></div><div>Consultations</div></div>
              <div>{consultationsOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
            </button>
            {consultationsOpen && (
              <div className="pl-4 flex flex-col">
                {consultationItems.map(i => (
                  <Link key={i.to} to={i.to} onClick={() => setConsultationsOpen(false)} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                    <div className="text-sm text-brand-600">{i.icon}</div>
                    <div className="text-sm">{i.label}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mortuary collapsible group */}
        {mortuaryItems.length > 0 && (
          <div>
            <button onClick={() => setMortuaryOpen(p => !p)} className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium hover:bg-gray-100">
              <div className="flex items-center gap-2"><div className="text-sm text-brand-600"><FaBriefcase /></div><div>Mortuary</div></div>
              <div>{mortuaryOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
            </button>
            {mortuaryOpen && (
              <div className="pl-4 flex flex-col">
                {mortuaryItems.map(i => (
                  <Link key={i.to} to={i.to} onClick={() => setMortuaryOpen(false)} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                    <div className="text-sm text-brand-600">{i.icon}</div>
                    <div className="text-sm">{i.label}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Human Resource collapsible group */}
        {hrItems.length > 0 && (
          <div>
            <button onClick={() => setHrOpen(p => !p)} className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium hover:bg-gray-100">
              <div className="flex items-center gap-2"><div className="text-sm text-brand-600"><FaBriefcase /></div><div>Human Resource</div></div>
              <div>{hrOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
            </button>
            {hrOpen && (
              <div className="pl-4 flex flex-col">
                {hrItems.map(i => (
                  <Link key={i.to} to={i.to} onClick={() => setHrOpen(false)} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                    <div className="text-sm text-brand-600">{i.icon}</div>
                    <div className="text-sm">{i.label}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* remaining items */}
        {items.filter(i => !patientItems.find(p => p.to === i.to) && !labItems.find(l => l.to === i.to) && !pharmacyItems.find(p => p.to === i.to) && !triageItems.find(t => t.to === i.to) && !consultationItems.find(c => c.to === i.to) && !mortuaryItems.find(m => m.to === i.to) && !hrItems.find(h => h.to === i.to)).map(i => (
          <Link key={i.to} to={i.to} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
            <div className="text-sm text-brand-600">{i.icon}</div>
            <div className="text-sm">{i.label}</div>
            {role === 'doctor' && i.to === '/dashboard/doctor/admitted' && admittedCount > 0 && (
              <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">{admittedCount}</span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  );

}

