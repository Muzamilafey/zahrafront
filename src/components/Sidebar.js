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
  });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const isActive = (path) => location.pathname === path;

  const hasAccess = (key, defaultCheck = true) => {
    // if permissions are defined on the user, prefer them
    if (user?.permissions && typeof user.permissions === 'object') {
      const sb = user.permissions.sidebar || {};
      if (typeof sb[key] !== 'undefined') {
        const allowed = !!sb[key];
        console.debug(`[Sidebar] hasAccess("${key}") =`, allowed, 'for user', user?._id);
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
        { to: '/patients', label: 'All Patients', perm: 'patients' },
        { to: '/patients/register', label: 'Register Patient', perm: 'patients' },
        { to: '/dashboard/doctor/admitpatient', label: 'Admit Patient', perm: 'patients' },
        { to: '/patients/admitted', label: 'Admitted Patients', perm: 'patients' },
        { to: '/patients/discharged', label: 'Discharged Patients', perm: 'patients' },
        { to: '/patients/visits', label: 'Patient Visits', perm: 'patients' },
        { to: '/patients/visits/report', label: 'Visits Report', perm: 'patients' },
      ],
    },
    {
      id: 'admin',
      title: 'Administration',
      defaultCheck: user?.role === 'admin',
      items: [
        { to: '/dashboard/admin', label: 'Dashboard', perm: 'manageUsers' },
        { to: '/dashboard/admin/users', label: 'Users', perm: 'manageUsers' },
        { to: '/dashboard/admin/doctors', label: 'Doctors', perm: 'doctors' },
        { to: '/dashboard/admin/settings', label: 'Settings', perm: 'settings' },
        { to: '/dashboard/admin/register', label: 'Register User', perm: 'manageUsers' },
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
                // show item if: admin (bypass), or user has explicit permission granted
                const showItem = user?.role === 'admin' || hasAccess(it.perm, false);
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