import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function Sidebar() {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [openMenus, setOpenMenus] = useState({
    patients: false,
    appointments: false,
    admin: false,
    billing: false,
    lab: false,
    triage: false,
    consultations: false,
    registration: false,
    outpatient: false,
    maternity: false,
    radiology: false,
    mortuary: false,
    employees: false,
    payroll: false,
    humanResource: false,
  });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const isActive = (path) => location.pathname === path;

  const hasAccess = (key, defaultCheck = true) => {
    // special cases for default checks based on role
    if (key === 'dispenseDrugs' && (user?.role === 'pharmacist' || user?.role === 'admin' || user?.role === 'nurse')) {
        return true; // Pharmacists, Admin, and Nurses should see Dispense Drugs by default
    }
    // if permissions are defined on the user, prefer them
    if (user?.permissions && typeof user.permissions === 'object') {
      const sb = user.permissions.sidebar || {};
      if (typeof sb[key] !== 'undefined') {
        const allowed = !!sb[key];
        // console.debug(`[Sidebar] hasAccess("${key}") =`, allowed, 'for user', user?._id); // removed debug
        return allowed;
      }
    }
    return defaultCheck; 
  };
  const MenuItem = ({ to, children }) => (
    <Link
      to={to}
      className={`pl-8 py-2 text-sm ${
        isActive(to)
          ? 'bg-brand-50 text-brand-600 border-l-4 border-brand-500'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {children}
    </Link>
  );

  const MenuGroup = ({ title, open, onToggle, children }) => (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
      >
        <span>{title}</span>
        {open ? (
          <ChevronUpIcon className="w-4 h-4" />
        ) : (
          <ChevronDownIcon className="w-4 h-4" />
        )}
      </button>
      {open && <div className="flex flex-col">{children}</div>}
    </div>
  );
  // Define groups and items with explicit perm keys (align with AdminUser sidebar options)
  const groups = [
    {
      id: 'patients',
      title: 'Patient Management',
      defaultCheck: user?.role === 'admin',
      items: [
        { to: '/patients/discharge', label: 'Discharge Summary', perm: 'patients' },
        { to: '/patients', label: 'All Patients', perm: 'patients' },
        { to: '/patients/register', label: 'Register Patient', perm: 'patients' },
        { to: '/dashboard/doctor/admitpatient', label: 'Admit Patient', perm: 'patients' },
        { to: '/patients/admitted', label: 'Admitted Patients', perm: 'patients' },
        { to: '/patients/discharged', label: 'Discharged Patients', perm: 'patients' },
        { to: '/patients/visits', label: 'Patient Visits', perm: 'patients' },
        { to: '/patients/visits/report', label: 'Visits Report', perm: 'patients' },
        // OPD links grouped under Patients
        { to: '/dashboard/outpatient', label: 'Outpatient Dashboard', perm: 'outpatient' },
        { to: '/opd/register', label: 'Register Visit', perm: 'outpatient' },
        { to: '/opd/triage', label: 'Triage / Vitals', perm: 'triage' },
        { to: '/opd/consultation', label: 'Consultation', perm: 'consultations' },
        { to: '/opd/prescription', label: 'Prescriptions', perm: 'prescriptions' },
        { to: '/opd/queue', label: 'OPD Queue', perm: 'outpatient' },
        { to: '/opd/billing', label: 'OPD Billing', perm: 'billing' },
        { to: '/opd/reports', label: 'OPD Reports', perm: 'outpatient' },
      ],
    },
    {
      id: 'admin',
      title: 'Administration',
      defaultCheck: user?.role === 'admin',
      items: [
        { to: '/dashboard/admin', label: 'Dashboard', perm: 'manageUsers' },
        { to: '/dashboard/pharmacy/dispense', label: 'Dispense Drugs', perm: 'dispenseDrugs' },
        { to: '/dashboard/admin/users', label: 'Users', perm: 'manageUsers' },
        { to: '/dashboard/admin/doctors', label: 'Doctors', perm: 'doctors' },
        { to: '/dashboard/admin/settings', label: 'Settings', perm: 'settings' },
        { to: '/dashboard/admin/register', label: 'Register User', perm: 'manageUsers' },
        { to: '/dashboard/admin/meals', label: 'Manage Meals', perm: 'manageMeals' },
        { to: '/dashboard/admin/tools', label: 'Admin Tools', perm: 'manageDiagnoses' },
        { to: '/lab/tests/new', label: 'Create Diagnoses', perm: 'manageDiagnoses' },
      ],
    },
    {
      id: 'appointments',
      title: 'Appointments',
      defaultCheck: true,
      items: [
        { to: '/appointments', label: 'View Appointments', perm: 'appointments' },
        { to: '/appointments', label: 'Schedule Appointment', perm: 'appointments' },
      ],
    },
    {
      id: 'lab',
      title: 'Laboratory',
      defaultCheck: ['admin','doctor','lab_technician','nurse','finance'].includes(user?.role),
      items: [
        { to: '/dashboard/lab/queue', label: 'Lab Queue', perm: 'labQueue' },
        { to: '/dashboard/lab/requests', label: 'Lab Requests', perm: 'labRequests' },
        { to: '/dashboard/lab/tests', label: 'Lab Tests Catalog', perm: 'lab' },
        { to: '/dashboard/lab/prices', label: 'Lab Tests Prices', perm: 'lab' },
        { to: '/dashboard/lab/patient-report', label: 'Lab Visits Report', perm: 'lab' },
        { to: '/dashboard/lab/templates', label: 'Register Lab Templates', perm: 'lab' },
        { to: '/patients', label: 'Inpatient Requests', perm: 'patients' },
      ],
    },
    {
      id: 'billing',
      title: 'Billing',
      defaultCheck: ['admin', 'finance'].includes(user?.role),
      items: [
        { to: '/billing', label: 'Billing Overview', perm: 'billing' },
        { to: '/billing/transactions', label: 'Transactions', perm: 'billing' },
        { to: '/billing/reports', label: 'Reports', perm: 'billing' },
      ],
    },
    {
      id: 'pharmacy',
      title: 'Pharmacy',
      defaultCheck: ['admin', 'pharmacist', 'nurse'].includes(user?.role),
      items: [
        { to: '/pharmacy', label: 'Pharmacy Home', perm: 'pharmacy' },
        { to: '/pharmacy/pos', label: 'POS', perm: 'pharmacy' },
        { to: '/pharmacy/dispense', label: 'Dispense Requests', perm: 'pharmacy' },
        { to: '/pharmacy/reverse', label: 'Reverse Confirmed', perm: 'pharmacy' },
        { to: '/pharmacy/injections', label: 'Injections', perm: 'pharmacy' },
        { to: '/pharmacy/inventory', label: 'Inventory', perm: 'pharmacy' },
        { to: '/pharmacy/register-drugs', label: 'Register Drugs', perm: 'pharmacy' },
        { to: '/pharmacy/sales-report', label: 'Transactions', perm: 'pharmacy' },
        { to: '/pharmacy/edit-group', label: 'Edit Medication Groups', perm: 'pharmacy' },
      ],
    },
    {
      id: 'triage',
      title: 'Triage Management',
      defaultCheck: ['admin', 'doctor', 'nurse'].includes(user?.role),
      items: [
        { to: '/triage', label: 'Triage Assessments', perm: 'triage' },
        { to: '/triage/history', label: 'Triage History', perm: 'triage' },
      ],
    },
    {
      id: 'consultations',
      title: 'Consultations',
      defaultCheck: ['admin', 'doctor', 'nurse'].includes(user?.role),
      items: [
        { to: '/consultations', label: 'Consultations List', perm: 'consultations' },
        { to: '/consultations/new', label: 'New Consultation', perm: 'consultations' },
        { to: '/consultations/history', label: 'Consultation History', perm: 'consultations' },
      ],
    },
    // Registration group for dedicated registration users
    {
      id: 'registration',
      title: 'Registration',
      defaultCheck: user?.role === 'patient_registration',
      items: [
        { to: '/dashboard/registration', label: 'Registration Dashboard', perm: 'overview' },
        { to: '/patients/register', label: 'Register Patient', perm: 'registerPatient' },
      ],
    },
    // Outpatient group
    // Note: Outpatient links are shown under Patient Management collapse
    // Maternity group
    {
      id: 'maternity',
      title: 'Maternity Services',
      defaultCheck: ['doctor', 'nurse', 'admin'].includes(user?.role),
      items: [
        { to: '/dashboard/maternity', label: 'Maternity Dashboard', perm: 'maternity' },
      ],
    },
    // Radiology group
    {
      id: 'radiology',
      title: 'Radiology',
      defaultCheck: ['radiologist', 'doctor', 'admin'].includes(user?.role),
      items: [
        { to: '/dashboard/radiology', label: 'Radiology Dashboard', perm: 'radiology' },
      ],
    },
    // Mortuary group
    {
      id: 'mortuary',
      title: 'Mortuary Services',
      defaultCheck: ['mortician', 'admin'].includes(user?.role),
      items: [
        { to: '/dashboard/mortuary', label: 'Dashboard', perm: 'mortuary' },
        { to: '/mortuary/register', label: 'Register Body', perm: 'mortuary' },
        { to: '/mortuary/fees', label: 'Service Fees', perm: 'mortuary' },
      ],
    },
    // Employee Management group
    {
      id: 'employees',
      title: 'Employee Management',
      defaultCheck: ['hr', 'admin'].includes(user?.role),
      items: [
        { to: '/dashboard/employees', label: 'Employees', perm: 'employees' },
      ],
    },
    // Payroll group
    {
      id: 'payroll',
      title: 'Payroll',
      defaultCheck: ['hr', 'admin'].includes(user?.role),
      items: [
        { to: '/dashboard/payroll', label: 'Payroll Dashboard', perm: 'payroll' },
      ],
    },
    // Human Resource group
    {
      id: 'humanResource',
      title: 'Human Resource',
      defaultCheck: user?.role === 'admin',
      items: [
        { to: '/dashboard/hr', label: 'HR Dashboard', perm: 'humanResource' },
        { to: '/dashboard/hr/employees', label: 'Employee Management', perm: 'humanResource' },
        { to: '/dashboard/hr/recruitment', label: 'Recruitment', perm: 'humanResource' },
        { to: '/dashboard/hr/attendance', label: 'Attendance', perm: 'humanResource' },
        { to: '/dashboard/hr/leaves', label: 'Leave Management', perm: 'humanResource' },
        { to: '/dashboard/hr/payroll', label: 'Payroll', perm: 'humanResource' },
        { to: '/dashboard/hr/performance', label: 'Performance', perm: 'humanResource' },
        { to: '/dashboard/hr/training', label: 'Training', perm: 'humanResource' },
        { to: '/dashboard/hr/assets', label: 'Asset Management', perm: 'humanResource' },
        { to: '/dashboard/hr/disciplinary', label: 'Disciplinary Actions', perm: 'humanResource' },
        { to: '/dashboard/hr/documents', label: 'Documents', perm: 'humanResource' },
        { to: '/dashboard/hr/analytics', label: 'Analytics', perm: 'humanResource' },
        { to: '/dashboard/hr/notifications', label: 'Notifications', perm: 'humanResource' },
      ],
    },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col overflow-auto">
      <div className="flex-1">
        {groups.map(g => {
          // Determine visibility for the group:
          // - admin always sees groups
          // - if user has explicit sidebar permissions, show the group when any of the group's item.perm keys are true
          // - otherwise fall back to the group's defaultCheck
          let visible = false;
          if (user?.role === 'admin') visible = true;
          else if (user && user.permissions && user.permissions.sidebar && Object.keys(user.permissions.sidebar).length > 0) {
            // check if any item perm for this group is granted
            visible = g.items.some(it => !!user.permissions.sidebar[it.perm]);
          } else {
            visible = !!g.defaultCheck;
          }
          return visible ? (
            <MenuGroup key={g.id} title={g.title} open={openMenus[g.id]} onToggle={() => toggleMenu(g.id)}>
              {g.items.map(it => {
                // show item if: admin (bypass), explicit permission, or group's defaultCheck allows it
                const showItem = user?.role === 'admin' || hasAccess(it.perm, g.defaultCheck);
                return showItem ? <MenuItem key={it.to} to={it.to}>{it.label}</MenuItem> : null;
              })}
            </MenuGroup>
          ) : null;
        })}
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200">
        <Link
          to="/profile"
          className="flex items-center space-x-3 text-sm text-gray-700 hover:text-gray-900"
        >
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-brand-600 font-medium">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{user?.name || 'User'}</div>
            <div className="text-xs text-gray-500 truncate">
              {user?.email || ''}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}