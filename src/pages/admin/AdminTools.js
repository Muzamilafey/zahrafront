import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminTools() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin Tools</h1>
      <div className="space-y-3">
        <Link to="/lab/tests/new" className="inline-block btn-brand px-4 py-2 bg-brand-600 text-white rounded">
          Create Diagnoses
        </Link>
      </div>
    </div>
  );
}
