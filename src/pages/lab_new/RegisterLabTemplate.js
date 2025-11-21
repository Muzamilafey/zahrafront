import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const RegisterLabTemplate = () => {
  const { axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();

  const [labTests, setLabTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [description, setDescription] = useState('');
  const [normalValue, setNormalValue] = useState('');
  const [startValue, setStartValue] = useState('');
  const [endValue, setEndValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!axiosInstance) return;
    const loadTests = async () => {
      try {
        const res = await axiosInstance.get('/lab/catalog');
        const list = res.data.catalog || res.data.tests || res.data || [];
        setLabTests(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn('Failed to load lab tests for dropdown', err);
      }
    };
    loadTests();
  }, [axiosInstance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedTest) return setError('Please select a lab test');
    if (!description) return setError('Enter sub-test description');

    setIsSaving(true);
    try {
      // POST to sub-tests endpoint. Backend may vary; adjust as needed.
      await axiosInstance.post('/lab/subtests', {
        parentTestId: selectedTest,
        description,
        normalValue,
        startValue,
        endValue,
      });
      alert('Sub-test registered successfully');
      navigate('/lab/templates');
    } catch (err) {
      console.error('Failed to register sub-test', err);
      setError(err.response?.data?.message || 'Failed to register sub-test');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="border rounded p-6 bg-white">
        <h2 className="text-xl font-semibold mb-4">Register Lab Sub-Test Details</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-4">
            <label className="w-40 text-sm">Lab Test</label>
            <select value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)} className="flex-1 border p-2">
              <option value="">Select Lab Test</option>
              {labTests.map((t) => (
                <option key={t._id || t.id || t.name} value={t._id || t.id || t.name}>{t.name || t.test || t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="w-40 text-sm">Sub-Test Description</label>
            <input className="flex-1 border p-2" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="flex items-center gap-4">
            <label className="w-40 text-sm">Normal Values</label>
            <input className="flex-1 border p-2" value={normalValue} onChange={e => setNormalValue(e.target.value)} />
          </div>

          <div className="flex items-center gap-4">
            <label className="w-40 text-sm">Normal Values (Start Value)</label>
            <input className="flex-1 border p-2" value={startValue} onChange={e => setStartValue(e.target.value)} />
          </div>

          <div className="flex items-center gap-4">
            <label className="w-40 text-sm">Normal Values (End Value)</label>
            <input className="flex-1 border p-2" value={endValue} onChange={e => setEndValue(e.target.value)} />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="text-center">
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-gray-100 border rounded">
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterLabTemplate;