import React from 'react';

export default function DataTable({ columns, data }) {
  const renderCell = (value, accessor) => {
    // if it's already a React element, render as-is
    if (React.isValidElement(value)) return value;

    // simple status badge handling
    if (accessor === 'status' && typeof value === 'string') {
      const v = value.toLowerCase();
      let cls = 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100';
      if (v.includes('confirmed') || v.includes('paid') || v.includes('completed')) cls = 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200';
      else if (v.includes('requested') || v.includes('pending')) cls = 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200';
      else if (v.includes('cancel') || v.includes('declined') || v.includes('unpaid')) cls = 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200';
      return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}>{value}</span>;
    }

    // primitives are fine
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);

    // try common object shapes: patient/user objects
    if (typeof value === 'object') {
      // patient-like
      if (value.user && (value.user.name || value.user.email)) return value.user.name || value.user.email;
      // nested patient property
      if (value.patient && value.patient.user && (value.patient.user.name || value.patient.user.email)) return value.patient.user.name || value.patient.user.email;
      // plain named object
      if (value.name) return String(value.name);
      if (value._id) return String(value._id);
      try { return JSON.stringify(value); } catch (e) { return String(value); }
    }

    return String(value);
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100 dark:bg-gray-900 dark:border-gray-700">
      <table className="min-w-full table-auto">
        <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 dark:from-transparent dark:to-transparent dark:border-gray-700">
          <tr>
            {columns.map(c => (
              <th key={c.accessor} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150 dark:hover:bg-gray-800">
              {columns.map(c => (
                <td key={c.accessor} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 align-top">{renderCell(row[c.accessor] ?? '', c.accessor)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
