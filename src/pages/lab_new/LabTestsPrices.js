import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

const LabTestsPrices = () => {
  const { axiosInstance } = useContext(AuthContext);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/lab/prices');
        setPrices(response.data.prices);
      } catch (err) {
        console.error('Failed to fetch lab test prices:', err);
        setError('Failed to load price data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [axiosInstance]);

  if (loading) {
    return <div className="text-center p-8">Loading Lab Test Prices...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Lab Tests Prices</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.keys(prices).length > 0 ? (
              Object.entries(prices).map(([testName, price]) => (
                <tr key={testName}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{testName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{price}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="text-center py-4 text-sm text-gray-500">No price data found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabTestsPrices;