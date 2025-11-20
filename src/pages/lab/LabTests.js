import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function LabTests() {
  const { axiosInstance } = useContext(AuthContext);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    normalValue: '',
    startValue: '',
    endValue: '',
    price: '',
    category: '',
  });

  const fetchTests = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/labs/catalog');
      setTests(response.data.tests || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tests:', error);
      setLoading(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/labs/catalog', newTest);
      setNewTest({
        name: '',
        description: '',
        normalValue: '',
        startValue: '',
        endValue: '',
        price: '',
        category: '',
      });
      // fetch from server response if available
      fetchTests();
    } catch (error) {
      console.error('Error creating test:', error);
    }
  };

  const handleDelete = async (testId) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      try {
  await axiosInstance.delete(`/labs/catalog/${testId}`);
        fetchTests();
      } catch (error) {
        console.error('Error deleting test:', error);
      }
    }
  };

  if (loading) {
    return <div className="p-4">Loading tests catalog...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Lab Tests Catalog</h1>

      {/* Add New Test Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Add New Test</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Test Name</label>
            <input
              type="text"
              value={newTest.name}
              onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              value={newTest.category}
              onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Normal Value</label>
            <input
              type="text"
              value={newTest.normalValue}
              onChange={(e) => setNewTest({ ...newTest, normalValue: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Value</label>
            <input
              type="text"
              value={newTest.startValue}
              onChange={(e) => setNewTest({ ...newTest, startValue: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Value</label>
            <input
              type="text"
              value={newTest.endValue}
              onChange={(e) => setNewTest({ ...newTest, endValue: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input
              type="number"
              value={newTest.price}
              onChange={(e) => setNewTest({ ...newTest, price: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={newTest.description}
              onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full bg-brand-600 text-white py-2 px-4 rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
            >
              Add Test
            </button>
          </div>
        </form>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Normal Range</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tests.map((test) => (
              <tr key={test._id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{test.name}</div>
                  <div className="text-sm text-gray-500">{test.description}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {test.category}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">Normal: {test.normalValue}</div>
                  <div className="text-sm text-gray-500">Range: {test.startValue} - {test.endValue}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  ${test.price}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDelete(test._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}