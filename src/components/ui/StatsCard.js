import React from 'react';

export default function StatsCard({ title, value, icon }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-2xl font-bold text-brand-700">{value}</div>
      </div>
      <div className="text-3xl text-gray-300">{icon}</div>
    </div>
  );
}
