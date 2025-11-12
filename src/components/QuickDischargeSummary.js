import React, { useState, useContext } from 'react';
import { AuthContext } from 'contexts/AuthContext';

export default function QuickDischargeSummary({ patientId, admissionId, onDischargeSummaryCreated }) {
  const { axiosInstance, user } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [dischargeNotes, setDischargeNotes] = useState('');

  const handleCreateDischargeSummary = async () => {
    if (!patientId || !admissionId) {
      setMessage({
        type: 'error',
        text: 'Patient ID and Admission ID are required'
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await axiosInstance.post('/discharge/create', {
        patientId,
        admissionId,
        dischargingDoctorId: user?.id || user?._id,
        dischargeNotes
      });

      setMessage({
        type: 'success',
        text: `Discharge Summary created: ${response.data.data?.dischargeNumber}`
      });

      setDischargeNotes('');
      setShowForm(false);

      // Notify parent component
      if (onDischargeSummaryCreated) {
        onDischargeSummaryCreated(response.data.data);
      }

      // Auto-close message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Failed to create discharge summary'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Discharge Summary</h3>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'success'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          <p className="text-sm font-semibold">{message.text}</p>
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600 transition"
        >
          Create Discharge Summary
        </button>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Discharge Notes (Optional)
            </label>
            <textarea
              value={dischargeNotes}
              onChange={(e) => setDischargeNotes(e.target.value)}
              placeholder="Enter any additional discharge notes..."
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              rows="4"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreateDischargeSummary}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded font-semibold hover:bg-green-600 transition disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Summary'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setDischargeNotes('');
              }}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded font-semibold hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
