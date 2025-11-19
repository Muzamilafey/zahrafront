import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function DischargeSummaryList({ patientId }) {
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);

  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientId) {
      loadSummaries();
    }
  }, [patientId, axiosInstance]);

  const loadSummaries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/discharge/patient/${patientId}`);
      // normalize shapes: res.data may be { summaries: [...] } or an array
      const payload = res.data;
      const list = Array.isArray(payload) ? payload : (payload.summaries || []);
      setSummaries(list || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load discharge summaries');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading discharge summaries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
        <p className="font-semibold">Error loading summaries</p>
        <p className="text-sm">{error}</p>
        <p className="mt-2 text-xs text-gray-600">If this looks like a backend schema or server error, check the server logs or contact the backend maintainer.</p>
      </div>
    );
  }

  if (!summaries || summaries.length === 0) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 text-yellow-700">
        <p className="font-semibold">No discharge summaries</p>
        <p className="text-sm">No discharge summaries have been created for this patient yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">Discharge Summaries</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summaries.map((summary) => (
          <div
            key={summary._id}
            className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition p-4 cursor-pointer"
            onClick={() => navigate(`/discharge/${summary._id}`)}
          >
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-gray-800">{summary.dischargeNumber}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  summary.finalizationInfo?.locked
                    ? 'bg-green-100 text-green-800'
                    : summary.status === 'reviewed'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {summary.finalizationInfo?.locked ? 'Finalized' : summary.status}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Admission</p>
                <p className="text-gray-800 font-semibold">{summary.admissionInfo?.ward || 'N/A'}</p>
              </div>

              <div>
                <p className="text-gray-600">Admitted</p>
                <p className="text-gray-800 font-semibold">
                  {new Date(summary.admissionInfo?.admittedAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-gray-600">Discharged</p>
                <p className="text-gray-800 font-semibold">
                  {new Date(summary.admissionInfo?.dischargedAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-gray-600">Primary Diagnosis</p>
                <p className="text-gray-800 font-semibold truncate">{summary.diagnosis?.primary || 'N/A'}</p>
              </div>
            </div>

            <button
              className="w-full mt-4 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-semibold text-sm"
              onClick={() => navigate(`/discharge/${summary._id}`)}
            >
              View Summary
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
