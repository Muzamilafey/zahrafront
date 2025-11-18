
import React, { useState } from 'react';

interface PatientSearchProps {
  onSearch: (patientId: string) => void;
  isLoading: boolean;
}

const PatientSearch: React.FC<PatientSearchProps> = ({ onSearch, isLoading }) => {
  const [patientId, setPatientId] = useState<string>('PT12345');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(patientId);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <form onSubmit={handleSubmit}>
        <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">
          Patient ID
        </label>
        <div className="mt-1 flex flex-col sm:flex-row rounded-md shadow-sm">
          <input
            type="text"
            id="patientId"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-t-md sm:rounded-none sm:rounded-l-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., PT12345"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-b-md sm:rounded-none sm:rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              'Search Patient'
            )}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">Enter a patient ID to fetch their discharge summary and invoice. (Try PT12345 or PT67890)</p>
      </form>
    </div>
  );
};

export default PatientSearch;
