import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

const LabVisitsReportPerPatient = () => {
  const { axiosInstance } = useContext(AuthContext);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/patients/search?q=${searchTerm}`);
      setSearchResults(response.data.patients);
      setSelectedPatient(null);
      setReport([]);
    } catch (err) {
      setError('Failed to search for patients.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setSearchTerm('');
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/lab/reports/patient/${patient._id}`);
      setReport(response.data.tests);
    } catch (err) {
      setError(`Failed to fetch report for ${patient.user.name}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Lab Visits Report (Per Patient)</h1>

      <form onSubmit={handleSearch} className="mb-4 max-w-md">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for a patient by name or MRN..."
            className="flex-grow mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <button type="submit" className="btn-modern-primary">Search</button>
        </div>
      </form>

      {searchResults.length > 0 && (
        <ul className="bg-white shadow-md rounded-lg max-w-md mb-4">
          {searchResults.map(p => (
            <li key={p._id} onClick={() => handleSelectPatient(p)} className="p-2 border-b cursor-pointer hover:bg-gray-100">
              {p.user.name} (MRN: {p.mrn})
            </li>
          ))}
        </ul>
      )}

      {selectedPatient && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Report for: {selectedPatient.user.name}</h2>
          {loading ? (
            <p>Loading report...</p>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.length > 0 ? (
                    report.map(item => (
                      <tr key={item._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.testType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.resultsText || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{item.status}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-sm text-gray-500">No lab tests found for this patient.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default LabVisitsReportPerPatient;