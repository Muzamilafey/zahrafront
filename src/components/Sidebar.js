import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function Sidebar() {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [openMenus, setOpenMenus] = useState({
    patients: true,
    appointments: false,
    admin: false,
    billing: false,
    lab: false,
  });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const isActive = (path) => location.pathname === path;

  const hasAccess = (key, defaultCheck = true) => {
    // if permissions are defined on the user, prefer them
    if (user?.permissions && typeof user.permissions === 'object') {
      const sb = user.permissions.sidebar || {};
      if (typeof sb[key] !== 'undefined') return !!sb[key];
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

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {/* Patients Section */}
        {hasAccess('patients', true) && (
        <MenuGroup
          title="Patient Management"
          open={openMenus.patients}
          onToggle={() => toggleMenu('patients')}
        >
          <MenuItem to="/patients">All Patients</MenuItem>
          <MenuItem to="/patients/register">Register Patient</MenuItem>
          {/* Make Admit Patient always visible for allowed roles, right after Register */}
          {['admin', 'doctor', 'receptionist', 'nurse'].includes(user?.role) && (
            <MenuItem to="/dashboard/doctor/admitpatient"><span className="font-semibold text-brand-700">Admit Patient</span></MenuItem>
          )}
          <MenuItem to="/patients/admitted">Admitted Patients</MenuItem>
          <MenuItem to="/patients/visits">Patient Visits</MenuItem>
          <MenuItem to="/patients/visits/report">Visits Report</MenuItem>
  </MenuGroup>
  )}

        {/* Admin Section */}
        {hasAccess('admin', user?.role === 'admin') && (
          <MenuGroup
            title="Administration"
            open={openMenus.admin}
            onToggle={() => toggleMenu('admin')}
          >
            <MenuItem to="/dashboard/admin">Dashboard</MenuItem>
            <MenuItem to="/dashboard/admin/users">Users</MenuItem>
            <MenuItem to="/dashboard/admin/doctors">Doctors</MenuItem>
            <MenuItem to="/dashboard/admin/settings">Settings</MenuItem>
          </MenuGroup>
        )}

        {/* Appointments Section */}
        {hasAccess('appointments', true) && (
        <MenuGroup
          title="Appointments"
          open={openMenus.appointments}
          onToggle={() => toggleMenu('appointments')}
        >
          <MenuItem to="/appointments">View Appointments</MenuItem>
          <MenuItem to="/appointments/schedule">Schedule Appointment</MenuItem>
  </MenuGroup>
  )}

        {/* Laboratory Section */}
        {hasAccess('lab', ['admin','doctor','lab_technician','nurse','finance'].includes(user?.role)) && (
          <MenuGroup
            title="Laboratory"
            open={openMenus.lab}
            onToggle={() => toggleMenu('lab')}
          >
            <MenuItem to="/dashboard/lab/queue">Lab Queue</MenuItem>
            <MenuItem to="/dashboard/lab/requests">View Lab Requests</MenuItem>
            <MenuItem to="/dashboard/lab/tests">Lab Tests Catalog</MenuItem>
            <MenuItem to="/dashboard/lab/prices">Lab Tests Prices</MenuItem>
            <MenuItem to="/dashboard/lab/patient-report">Lab Visits Report</MenuItem>
            <MenuItem to="/dashboard/lab/templates">Register Lab Templates</MenuItem>
            <MenuItem to="/patients">Inpatient Requests</MenuItem>
          </MenuGroup>
        )}

        {/* Billing Section */}
        {hasAccess('billing', ['admin', 'finance'].includes(user?.role)) && (
          <MenuGroup
            title="Billing"
            open={openMenus.billing}
            onToggle={() => toggleMenu('billing')}
          >
            <MenuItem to="/billing">Billing Overview</MenuItem>
            <MenuItem to="/billing/transactions">Transactions</MenuItem>
            <MenuItem to="/billing/reports">Reports</MenuItem>
          </MenuGroup>
        )}
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