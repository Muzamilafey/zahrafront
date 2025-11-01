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
  });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const isActive = (path) => location.pathname === path;

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
        <MenuGroup
          title="Patient Management"
          open={openMenus.patients}
          onToggle={() => toggleMenu('patients')}
        >
          <MenuItem to="/patients">All Patients</MenuItem>
          <MenuItem to="/patients/register">Register Patient</MenuItem>
            {/* Admit Patient nav - visible to staff who can admit */}
            {['admin','doctor','receptionist','nurse'].includes(user?.role) && (
              <MenuItem to="/dashboard/doctor/admitpatient">Admit Patient</MenuItem>
            )}
          <MenuItem to="/patients/admitted">Admitted Patients</MenuItem>
          <MenuItem to="/patients/visits">Patient Visits</MenuItem>
          <MenuItem to="/patients/visits/report">Visits Report</MenuItem>
        </MenuGroup>

        {/* Admin Section */}
        {user?.role === 'admin' && (
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
        <MenuGroup
          title="Appointments"
          open={openMenus.appointments}
          onToggle={() => toggleMenu('appointments')}
        >
          <MenuItem to="/appointments">View Appointments</MenuItem>
          <MenuItem to="/appointments/schedule">Schedule Appointment</MenuItem>
        </MenuGroup>

        {/* Billing Section */}
        {['admin', 'finance'].includes(user?.role) && (
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