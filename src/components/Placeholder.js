import React from 'react';

export default function Placeholder({ title }) {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-4">{title || 'Not Implemented'}</h1>
        <p className="text-gray-600">This page is a placeholder. The UI is wired but the full feature is not implemented yet.</p>
      </div>
    </div>
  );
}
