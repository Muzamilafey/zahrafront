import React from 'react';

// Only include links to pages that exist in your project
const navButtons = [
  { label: 'PATIENTS', color: 'bg-green-400', link: '/dashboard/admin/patients' },
  { label: 'DOCTORS', color: 'bg-green-400', link: '/dashboard/admin/doctors' },
  { label: 'LABS', color: 'bg-green-400', link: '/dashboard/admin/labs' },
  { label: 'FINANCE', color: 'bg-green-400', link: '/dashboard/admin/finance' },
  { label: 'NURSE', color: 'bg-green-400', link: '/dashboard/admin/nurse' },
  { label: 'PHARMACY', color: 'bg-green-400', link: '/dashboard/admin/pharmacy' },
  { label: 'APPOINTMENTS', color: 'bg-indigo-400', link: '/dashboard/admin/appointments' },
  { label: 'INCOME', color: 'bg-gradient-to-r from-green-400 to-blue-400', link: '/dashboard/admin/income' },
  { label: 'NO BEDS', color: 'bg-gradient-to-r from-blue-400 to-green-400', link: '/dashboard/admin/nobeds' },
];

export default function AdminTools() {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-8">Admin Tools</h1>
      <div className="flex flex-wrap gap-6 justify-center">
        {navButtons.map((btn, idx) => (
          <a
            key={btn.label}
            href={btn.link}
            className={`px-8 py-3 rounded-full text-white font-bold shadow text-lg ${btn.color}`}
            style={{ minWidth: 160, textAlign: 'center' }}
          >
            {btn.label}
          </a>
        ))}
      </div>
    </div>
  );
}
