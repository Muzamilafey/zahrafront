import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FaTachometerAlt, FaUsers, FaCalendarAlt, FaPills, FaFileInvoiceDollar, FaUserPlus, FaFolder, FaClock, FaBoxes, FaEnvelope, FaBars, FaChevronLeft, FaCog, FaChevronDown, FaChevronUp } from 'react-icons/fa';

export default function Sidebar({ role }) {
  const { axiosInstance } = useContext(AuthContext);
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
    { to: '/dashboard', label: 'Overview', icon: <FaTachometerAlt /> },
    { to: '/profile', label: 'Profile', icon: <FaUsers /> },
  ];

  const itemsByRole = {
    admin: [
      
  { to: '/appointments', label: 'Appointments', icon: <FaCalendarAlt /> },
  { to: '/dashboard/admin/patients', label: 'Patients', icon: <FaUsers /> },
  { to: '/dashboard/admin/users', label: 'Manage Users', icon: <FaUsers /> },
  { to: '/dashboard/admin/settings', label: 'Settings', icon: <FaCog /> },
  { to: '/dashboard/admin/doctors', label: 'Doctors', icon: <FaUserPlus /> },
  { to: '/dashboard/admin/departments', label: 'Departments', icon: <FaFolder /> },
      
      { to: '/dashboard/admin/doctors', label: "Doctors' Schedule", icon: <FaClock /> },
  { to: '/dashboard/admin/consultations', label: 'Consultations', icon: <FaFolder /> },
    { to: '/dashboard/admin/slots', label: 'Available Slots', icon: <FaClock /> },
  { to: '/billing', label: 'Payments / Invoices', icon: <FaFileInvoiceDollar /> },
      { to: '/dashboard/admin/managewards', label: 'Manage Wards', icon: <FaFolder /> },
  { to: '/dashboard/admin/nurseassignment', label: 'Nurse Assignment', icon: <FaUsers /> },
      { to: '/pharmacy', label: 'Inventory', icon: <FaBoxes /> },
  { to: '/dashboard/admin/drugs', label: 'Drugs', icon: <FaPills /> },
  { to: '/dashboard/messages', label: 'Messages', icon: <FaEnvelope /> },
    ],
    doctor: [
      { to: '/dashboard/doctor/appointments', label: 'Appointments', icon: <FaCalendarAlt /> },
      { to: '/dashboard/doctor/admitpatient', label: 'Admit Patient', icon: <FaUserPlus /> },
      { to: '/dashboard/doctor/admitted', label: 'Admitted Patients', icon: <FaUsers /> },
      { to: '/dashboard/doctor/patients', label: 'Patients', icon: <FaUsers /> },
      { to: '/dashboard/messages', label: 'Messages', icon: <FaEnvelope /> },
    ],
    pharmacist: [
      { to: '/dashboard/pharmacy', label: 'Inventory', icon: <FaPills /> },
      { to: '/pharmacy/pos', label: 'POS', icon: <FaFileInvoiceDollar /> },
      { to: '/dashboard/pharmacy/transactions', label: 'Transactions', icon: <FaFileInvoiceDollar /> },
      { to: '/dashboard/messages', label: 'Messages', icon: <FaEnvelope /> },
    ],
    finance: [
      { to: '/billing', label: 'Billing', icon: <FaFileInvoiceDollar /> },
      { to: '/dashboard/finance/transactions', label: 'Transactions', icon: <FaFileInvoiceDollar /> },
      { to: '/dashboard/finance/appointments', label: 'Bill Appointments', icon: <FaCalendarAlt /> },
      { to: '/dashboard/finance/reports', label: 'Reports', icon: <FaFileInvoiceDollar /> },
      { to: '/dashboard/finance/refunds', label: 'Refunds', icon: <FaFileInvoiceDollar /> },
      { to: '/dashboard/messages', label: 'Messages', icon: <FaEnvelope /> },
    ],
    receptionist: [
      { to: '/dashboard/reception', label: 'Registration', icon: <FaUserPlus /> },
      { to: '/dashboard/reception/appointments', label: 'Appointments', icon: <FaCalendarAlt /> },
      { to: '/dashboard/messages', label: 'Messages', icon: <FaEnvelope /> },
    ],
    patient: [
      { to: '/dashboard/patient/appointments', label: 'My Appointments', icon: <FaCalendarAlt /> },
      { to: '/dashboard/patient/prescriptions', label: 'Prescriptions', icon: <FaPills /> },
    ],
    nurse: [
      { to: '/dashboard/nurse', label: 'Nurse Dashboard', icon: <FaUsers /> },
      { to: '/dashboard/nurse/admissions', label: 'Admission History', icon: <FaClock /> },
      { to: '/dashboard/messages', label: 'Messages', icon: <FaEnvelope /> },
    ],
    lab: [
      { to: '/dashboard/lab', label: 'Lab Dashboard', icon: <FaFolder /> },
      { to: '/dashboard/messages', label: 'Messages', icon: <FaEnvelope /> },
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
    { to: '/patients', label: 'All Patients', icon: <FaUsers /> },
    { to: '/patients/register', label: 'Register Patient', icon: <FaUserPlus /> },
    { to: '/patients/admitted', label: 'Admitted Patients', icon: <FaUsers /> },
    { to: '/patients/visits', label: 'Patient Visits', icon: <FaCalendarAlt /> },
    { to: '/patients/visits/report', label: 'Visits Report', icon: <FaFileInvoiceDollar /> },
  ];

  const items = [...common, ...patientItems, ...(itemsByRole[role] || [])];
  const [admittedCount, setAdmittedCount] = useState(0);

  const [patientsOpen, setPatientsOpen] = useState(true);

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
    return (
      <div className="relative">
        <aside
          className="w-16 bg-white border-r min-h-screen p-2 hidden md:block"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="mb-4 text-center">
            <div className="text-lg font-bold text-brand-700">G</div>
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
              {/* Patient management group in hover-expanded overlay */}
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
    );
  }

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4 hidden md:block sticky top-14" style={{ alignSelf: 'flex-start' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-xl font-bold text-brand-700">GENZ</div>
          <div className="text-sm text-gray-500">Community Hospital</div>
        </div>
        <button onClick={toggleCollapsed} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Collapse sidebar">
          <FaChevronLeft />
        </button>
      </div>
      
      <nav className="flex flex-col gap-2">
        {/* Patient management group */}
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

        {/* remaining items */}
        {items.filter(i => !patientItems.find(p => p.to === i.to)).map(i => (
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
