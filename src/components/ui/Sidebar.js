import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FaTachometerAlt, FaUsers, FaCalendarAlt, FaPills, FaFileInvoiceDollar, FaUserPlus, FaFolder, FaClock, FaBoxes, FaEnvelope, FaBars, FaChevronLeft, FaCog, FaChevronDown, FaChevronUp } from 'react-icons/fa';

export default function Sidebar({ role }) {
  const { axiosInstance, user } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    } catch (e) { return false; }
  });

  useEffect(()=>{
    try { localStorage.setItem('sidebarCollapsed', collapsed ? 'true' : 'false'); } catch(e){}
  },[collapsed]);

  const toggleCollapsed = () => setCollapsed(s => !s);

  const common = [
    { to: '/dashboard', label: 'Overview', icon: <FaTachometerAlt />, perm: 'overview' },
    { to: '/profile', label: 'Profile', icon: <FaUsers />, perm: 'profile' },
  ];

  const itemsByRole = {
    admin: [
      { to: '/appointments', label: 'Appointments', icon: <FaCalendarAlt />, perm: 'appointments' },
      { to: '/dashboard/admin/patients', label: 'Patients', icon: <FaUsers />, perm: 'patients' },
      { to: '/dashboard/admin/users', label: 'Manage Users', icon: <FaUsers />, perm: 'manageUsers' },
      { to: '/dashboard/admin/settings', label: 'Settings', icon: <FaCog />, perm: 'settings' },
      { to: '/dashboard/admin/doctors', label: 'Doctors', icon: <FaUserPlus />, perm: 'doctors' },
      { to: '/dashboard/admin/departments', label: 'Departments', icon: <FaFolder />, perm: 'departments' },
      { to: '/dashboard/admin/doctors', label: "Doctors' Schedule", icon: <FaClock />, perm: 'doctorsSchedule' },
      { to: '/dashboard/admin/consultations', label: 'Consultations', icon: <FaFolder />, perm: 'consultations' },
      { to: '/dashboard/admin/slots', label: 'Available Slots', icon: <FaClock />, perm: 'availableSlots' },
      { to: '/billing', label: 'Payments / Invoices', icon: <FaFileInvoiceDollar />, perm: 'billing' },
      { to: '/dashboard/admin/managewards', label: 'Manage Wards', icon: <FaFolder />, perm: 'manageWards' },
      { to: '/dashboard/admin/nurseassignment', label: 'Nurse Assignment', icon: <FaUsers />, perm: 'nurseAssignment' },
      { to: '/pharmacy', label: 'Inventory', icon: <FaBoxes />, perm: 'inventory' },
      { to: '/dashboard/admin/drugs', label: 'Drugs', icon: <FaPills />, perm: 'drugs' },
      { to: '/dashboard/messages', label: 'Messages', icon: <FaEnvelope />, perm: 'messages' },
      // Laboratory links for admins
      { to: '/dashboard/lab', label: 'Lab Dashboard', icon: <FaFolder />, perm: 'lab' },
      { to: '/dashboard/lab/queue', label: 'Lab Queue', icon: <FaFolder />, perm: 'labQueue' },
      { to: '/dashboard/lab/requests', label: 'View Lab Requests', icon: <FaFolder />, perm: 'labRequests' },
      { to: '/dashboard/lab/review', label: 'Review Lab Tests', icon: <FaFolder />, perm: 'lab' },
      { to: '/dashboard/lab/tests', label: 'Lab Tests Catalog', icon: <FaFileInvoiceDollar />, perm: 'lab' },
      { to: '/dashboard/lab/prices', label: 'Lab Tests Prices', icon: <FaFileInvoiceDollar />, perm: 'lab' },
      { to: '/dashboard/lab/patient-report', label: 'Lab Visits Report', icon: <FaCalendarAlt />, perm: 'lab' },
      { to: '/dashboard/lab/templates', label: 'Lab Templates', icon: <FaFolder />, perm: 'lab' },
    ],
    doctor: [
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
      { to: '/dashboard/lab', label: 'Lab Dashboard', icon: <FaFolder />, perm: 'lab' },
      { to: '/dashboard/lab/queue', label: 'Lab Queue', icon: <FaFolder />, perm: 'labQueue' },
      { to: '/dashboard/lab/requests', label: 'View Lab Requests', icon: <FaFolder />, perm: 'labRequests' },
      { to: '/dashboard/admin/drugs', label: 'Drugs', icon: <FaPills />, perm: 'drugs' },
      { to: '/pharmacy', label: 'Inventory', icon: <FaBoxes />, perm: 'inventory' },
      { to: '/dashboard/admin/users', label: 'Manage Users', icon: <FaUsers />, perm: 'manageUsers' },
    ],
    pharmacist: [
      { to: '/dashboard/pharmacy', label: 'Inventory', icon: <FaPills />, perm: 'inventory' },
      { to: '/pharmacy/pos', label: 'POS', icon: <FaFileInvoiceDollar />, perm: 'inventory' },
      { to: '/dashboard/pharmacy/transactions', label: 'Transactions', icon: <FaFileInvoiceDollar />, perm: 'inventory' },
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
      { to: '/dashboard/lab', label: 'Lab Dashboard', icon: <FaFolder />, perm: 'lab' },
    ],
    lab: [
      { to: '/dashboard/lab', label: 'Lab Dashboard', icon: <FaFolder />, perm: 'lab' },
      { to: '/dashboard/lab/queue', label: 'Lab Queue', icon: <FaFolder />, perm: 'labQueue' },
      { to: '/dashboard/lab/requests', label: 'View Lab Requests', icon: <FaFolder />, perm: 'labRequests' },
      { to: '/dashboard/lab/review', label: 'Review Lab Tests', icon: <FaFolder />, perm: 'lab' },
      { to: '/dashboard/lab/prices', label: 'Lab Tests Prices', icon: <FaFileInvoiceDollar />, perm: 'lab' },
      { to: '/dashboard/lab/patient-report', label: 'Lab Visits Report', icon: <FaCalendarAlt />, perm: 'lab' },
      { to: '/dashboard/lab/templates', label: 'Lab Templates', icon: <FaFolder />, perm: 'lab' },
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

  // collect lab-related links (those under /dashboard/lab) and filter by permissions
  const labItems = items.filter(i => typeof i.to === 'string' && i.to.startsWith('/dashboard/lab'));

  useEffect(()=>{
    if(role === 'doctor'){
      (async ()=>{
        try{
          const res = await axiosInstance.get('/patients/admitted');
          setAdmittedCount((res.data.patients || []).length || 0);
        }catch(e){ /* ignore */ }
      })();
    }
  }, [role]);

  const [hovered, setHovered] = useState(false);

  if (collapsed) {
    return (<>

            {/* (removed collapsed/hover-only Laboratory group - keep full group only) */}
      <div className="relative">
        <aside
          className="w-16 bg-white border-r min-h-screen p-2 hidden md:block"
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

              {/* remaining items */}
              {items.filter(i => !patientItems.find(p => p.to === i.to)).map(i => (
                <Link key={i.to} to={i.to} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                  <div className="text-sm text-brand-600">{i.icon}</div>
                  <div className="text-sm">{i.label}</div>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </>);
  }

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4 hidden md:block sticky top-14" style={{ alignSelf: 'flex-start' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-xl font-bold text-brand-700">CoreCare</div>
          <div className="text-sm text-gray-500"></div>
        </div>
        <button onClick={toggleCollapsed} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Collapse sidebar">
          <FaChevronLeft />
        </button>
      </div>
      
      <nav className="flex flex-col gap-2">
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

        {/* remaining items */}
        {items.filter(i => !patientItems.find(p => p.to === i.to) && !labItems.find(l => l.to === i.to)).map(i => (
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
