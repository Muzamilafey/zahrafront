import React, { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { TriageForm, TriageHistory } from '../../modules/triage';

export default function TriageManagement() {
  const { user } = useContext(AuthContext);

  // Check if user has access
  if (!user || !['admin', 'doctor', 'nurse'].includes(user.role)) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          <h2 className="font-bold">Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Triage Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Record and manage patient triage assessments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">New Assessment</h2>
            </div>
            <div className="p-6">
              <TriageForm />
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">Assessment History</h2>
            </div>
            <div className="p-6">
              <TriageHistory />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
