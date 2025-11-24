import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminTools() {

  const navButtons = [
    { label: 'MANAGE USERS', color: 'bg-green-500 hover:bg-green-600', link: '/dashboard/admin/users' },
    { label: 'REGISTER USER', color: 'bg-green-500 hover:bg-green-600', link: '/dashboard/admin/register' },
    { label: 'PATIENTS', color: 'bg-green-500 hover:bg-green-600', link: '/patients' },
    { label: 'DOCTORS', color: 'bg-green-500 hover:bg-green-600', link: '/dashboard/admin/doctors' },
    { label: 'LABS', color: 'bg-green-500 hover:bg-green-600', link: '/lab' },
    { label: 'FINANCE', color: 'bg-green-500 hover:bg-green-600', link: '/billing' },
    { label: 'NURSE', color: 'bg-green-500 hover:bg-green-600', link: '/dashboard/admin//nurseassignment' },
    { label: 'PHARMACY', color: 'bg-green-500 hover:bg-green-600', link: '/pharmacy' },
    { label: 'APPOINTMENTS', color: 'bg-blue-800 hover:bg-blue-900', link: '/appointments' },
    { label: 'INCOME', color: 'bg-gradient-to-r from-green-400 to-blue-400 hover:from-green-500 hover:to-blue-500', link: '/billing' },
    { label: 'WARDS', color: 'bg-gradient-to-r from-blue-400 to-green-400 hover:from-blue-500 hover:to-green-500', link: '/dashboard/admin//managewards' },
    { label: 'CREATE DIAGNOSIS', color: 'bg-purple-600 hover:bg-purple-700', link: '/lab/tests/new' },
    { label: 'MANAGEMENT CHARGES', color: 'bg-green-500 hover:bg-green-600', link: '/dashboard/admin/management-charges' },

  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-900 min-h-screen">
      <h1 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8 text-center">Admin Tools</h1>
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 w-full max-w-5xl mx-auto">
        {navButtons.map((btn) => (
          <Link
            key={btn.label}
            to={btn.link}
            className={`px-4 py-4 sm:px-6 sm:py-6 rounded-lg text-white font-bold shadow text-base sm:text-lg transition-all duration-150 hover:scale-105 ${btn.color}`}
            style={{ minWidth: 0, textAlign: 'center', display: 'block', wordBreak: 'break-word' }}
          >
            {btn.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
