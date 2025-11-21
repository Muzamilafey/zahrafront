import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

const LabVisitsReport = () => {
  const { axiosInstance } = useContext(AuthContext);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/lab/reports/visits');
        setReport(response.data.report);
      } catch (err) {
        console.error('Failed to fetch lab visits report:', err);
        setError('Failed to load report data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [axiosInstance]);

  const totalTests = report.reduce((sum, item) => sum + item.totalTests, 0);
  const totalRevenue = report.reduce((sum, item) => sum + item.totalAmount, 0);

  if (loading) {
    return <div className="text-center p-8">Loading Lab Visits Report...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Lab Visits Report</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-500">Total Tests Conducted</h3>
          <p className="text-3xl font-bold text-gray-800">{totalTests}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-500">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-800">{totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h2 className="text-xl font-semibold p-4 border-b">Daily Breakdown</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number of Tests</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Revenue</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {report.length > 0 ? (
              report.map(item => (
                <tr key={item._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item._id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalTests}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center py-4 text-sm text-gray-500">No report data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabVisitsReport;