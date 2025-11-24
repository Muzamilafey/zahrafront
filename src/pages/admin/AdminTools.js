import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminTools() {

  const navButtons = [
    { label: 'PATIENTS', color: 'bg-green-500 hover:bg-green-600', link: '/patients' },
    { label: 'DOCTORS', color: 'bg-green-500 hover:bg-green-600', link: '/doctor' },
    { label: 'LABS', color: 'bg-green-500 hover:bg-green-600', link: '/lab' },
    { label: 'FINANCE', color: 'bg-green-500 hover:bg-green-600', link: '/finance' },
    { label: 'NURSE', color: 'bg-green-500 hover:bg-green-600', link: '/nurse' },
    { label: 'PHARMACY', color: 'bg-green-500 hover:bg-green-600', link: '/pharmacy' },
    { label: 'APPOINTMENTS', color: 'bg-blue-800 hover:bg-blue-900', link: '/appointments' },
    { label: 'INCOME', color: 'bg-gradient-to-r from-green-400 to-blue-400 hover:from-green-500 hover:to-blue-500', link: '/billing' },
    { label: 'NO BEDS', color: 'bg-gradient-to-r from-blue-400 to-green-400 hover:from-blue-500 hover:to-green-500', link: '/wards' },
    { label: 'CREATE DIAGNOSIS', color: 'bg-purple-600 hover:bg-purple-700', link: '/diagnosis/create' },
  ];

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-8">Admin Tools</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-center">
        {navButtons.map((btn) => (
          <Link
            key={btn.label}
            to={btn.link}
            className={`px-8 py-6 rounded-lg text-white font-bold shadow text-lg transition-all duration-150 hover:scale-105 ${btn.color}`}
            style={{ minWidth: 180, textAlign: 'center', display: 'block' }}
          >
            {btn.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
