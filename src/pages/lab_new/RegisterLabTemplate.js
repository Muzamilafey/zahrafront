import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const RegisterLabTemplate = () => {
  const { axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [tests, setTests] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !tests) {
      setError('Both name and tests are required.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const testsArray = tests.split(',').map(t => t.trim()).filter(Boolean);
      await axiosInstance.post('/lab/templates', { name, tests: testsArray });
      alert('Lab template registered successfully!');
      navigate('/lab/templates');
    } catch (err) {
      console.error('Failed to register lab template:', err);
      setError(err.response?.data?.message || 'Failed to save template. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Register New Lab Template</h1>
      <div className="max-w-lg mx-auto bg-white p-8 shadow-md rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Template Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="tests" className="block text-sm font-medium text-gray-700">
              Included Tests (comma-separated)
            </label>
            <textarea
              id="tests"
              value={tests}
              onChange={(e) => setTests(e.target.value)}
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., Complete Blood Count, Urinalysis, Lipid Profile"
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="text-right">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              {isSaving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterLabTemplate;