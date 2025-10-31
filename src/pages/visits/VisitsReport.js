import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';

export default function VisitsReport() {
  const { axiosInstance } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    includeWalkIns: true
  });

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      queryParams.append('includeWalkIns', filters.includeWalkIns);

      const res = await axiosInstance.get(`/visits/report/by-diagnosis?${queryParams}`);
      setReports(res.data.reports || []);
    } catch (e) {
      setToast({ message: e?.response?.data?.message || 'Failed to load report', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    loadReport();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Visits Report by Diagnosis</h2>

      {/* Filters */}
      <form onSubmit={applyFilters} className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="input w-full"
            />
          </div>
          <div className="flex items-center">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="includeWalkIns"
                checked={filters.includeWalkIns}
                onChange={handleFilterChange}
                className="form-checkbox h-5 w-5 text-brand-600"
              />
              <span className="ml-2 text-gray-700">Include Walk-Ins</span>
            </label>
          </div>
        </div>
        <div className="mt-4">
          <button type="submit" className="btn-brand">Generate Report</button>
        </div>
      </form>

      {/* Report Table */}
      {loading ? (
        <div className="text-center">Loading report...</div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Visits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Walk-Ins</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Follow-ups</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{report.diagnosis}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{report.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{report.totalVisits}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{report.walkIns}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{report.scheduled}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{report.followUps}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}