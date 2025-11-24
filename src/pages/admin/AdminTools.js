import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminTools() {
  const navButtons = [
    { label: 'PATIENTS', color: 'bg-green-400', link: '/patients' },
    { label: 'DOCTORS', color: 'bg-green-400', link: '/doctor' },
    { label: 'LABS', color: 'bg-green-400', link: '/lab' },
    { label: 'FINANCE', color: 'bg-green-400', link: '/finance' },
    { label: 'NURSE', color: 'bg-green-400', link: '/nurse' },
    { label: 'PHARMACY', color: 'bg-green-400', link: '/pharmacy' },
    { label: 'APPOINTMENTS', color: 'bg-indigo-400', link: '/appointments' },
    { label: 'INCOME', color: 'bg-gradient-to-r from-green-400 to-blue-400', link: '/billing' },
    { label: 'NO BEDS', color: 'bg-gradient-to-r from-blue-400 to-green-400', link: '/wards' },
  ];
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-8">Admin Tools</h1>
      <div className="flex flex-wrap gap-6 justify-center">
        {navButtons.map((btn, idx) => (
          <Link
            key={btn.label}
            to={btn.link}
            className={`px-8 py-3 rounded-full text-white font-bold shadow text-lg ${btn.color}`}
            style={{ minWidth: 160, textAlign: 'center' }}
          >
            {btn.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
