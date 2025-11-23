import React from 'react';

export default function PharmacyDashboard(){
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Pharmacy Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 rounded">Total Drugs: 0</div>
        <div className="p-4 bg-green-50 rounded">Pending Requests: 0</div>
        <div className="p-4 bg-green-50 rounded">Today Sales: 0</div>
      </div>
    </div>
  );
}
