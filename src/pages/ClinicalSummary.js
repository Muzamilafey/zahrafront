import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { format } from 'date-fns';

export default function ClinicalSummary() {
  const { axiosInstance } = useContext(AuthContext);
  const params = useParams();
  const admissionId = params.admissionId || params.id; // support routes using either param name
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patient, setPatient] = useState(null);
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/admissions/${admissionId}`);
        const data = response.data;
        setPatient(data.patient);
        setClinicalSummary(data.clinicalSummary || '');
        setLoading(false);
      } catch (err) {
        console.error('Error fetching admission data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (!admissionId) {
      // avoid leaving the page stuck in loading state when route param is missing
      setLoading(false);
      setError('Admission id missing in route');
      return;
    }

    fetchData();
  }, [admissionId, axiosInstance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await axiosInstance.patch(`/admissions/${admissionId}`, { clinicalSummary });
      navigate(`/discharge/${admissionId}`);
    } catch (err) {
      console.error('Error saving clinical summary:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!patient) return <div className="p-4">No patient data found</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-6">Clinical Summary</h1>
        
        {/* Patient Information */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{patient.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hospital ID</p>
              <p className="font-medium">{patient.hospitalId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Age</p>
              <p className="font-medium">{patient.age} years</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gender</p>
              <p className="font-medium">{patient.gender}</p>
            </div>
          </div>
        </div>

        {/* Clinical Summary Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Enter Clinical Summary</h2>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Clinical Summary
            </label>
            <textarea
              value={clinicalSummary}
              onChange={(e) => setClinicalSummary(e.target.value)}
              rows={10}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
              placeholder="Enter detailed clinical summary..."
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(`/discharge/${admissionId}`)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Clinical Summary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}