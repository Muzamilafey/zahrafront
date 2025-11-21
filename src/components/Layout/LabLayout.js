import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FaFlask, FaUserFriends, FaChartBar, FaFileInvoice, FaVials, FaThList } from 'react-icons/fa';
import Topbar from '../ui/Topbar';
import { AuthContext } from '../../contexts/AuthContext';

const labNavLinks = [
  { to: '/lab/requests-inpatient', text: 'Inpatient Requests', icon: <FaUserFriends /> },
  { to: '/lab/requests-outpatient', text: 'Outpatient Requests', icon: <FaUserFriends /> },
  { to: '/lab/internal-visits', text: 'Internal Patient Visits', icon: <FaFlask /> },
  { to: '/lab/external-visits', text: 'External Patient Visits', icon: <FaFlask /> },
  { to: '/lab/visits-report', text: 'Visits Report', icon: <FaChartBar /> },
  { to: '/lab/visits-report-patient', text: 'Patient Visits Report', icon: <FaChartBar /> },
  { to: '/lab/referrals-report', text: 'Referrals Report', icon: <FaFileInvoice /> },
  { to: '/lab/prices', text: 'Test Prices', icon: <FaFileInvoice /> },
  { to: '/lab/templates/register', text: 'Register Template', icon: <FaVials /> },
  { to: '/lab/templates', text: 'View Templates', icon: <FaThList /> },
  { to: '/lab/templates/order', text: 'Template Order', icon: <FaThList /> },
];

const LabLayout = () => {
  const { user, logout } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      <Topbar user={user} onLogout={logout} />
      <div className="flex h-[calc(100vh-64px)]">
        <aside className="w-64 bg-white shadow-md no-print">
          <div className="p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-teal-600">Lab Section</h2>
            <button onClick={() => navigate('/dashboard')} title="Open Dashboard" className="text-sm px-2 py-1 bg-teal-50 border rounded text-teal-700">Open</button>
          </div>
          <nav>
            <ul>
              {labNavLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 ${
                        isActive ? 'bg-teal-100 border-r-4 border-teal-500' : ''
                      }`
                  >
                    <span className="mr-3">{link.icon}</span>
                    {link.text}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LabLayout;
