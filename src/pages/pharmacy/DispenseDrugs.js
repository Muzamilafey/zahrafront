// zahrafront/src/pages/pharmacy/DispenseDrugs.js
import React, { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';

export default function DispenseDrugs() {
  const { axiosInstance, user } = useContext(AuthContext);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchPendingRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/pharmacy/dispense/pending');
      setPendingRequests(res.data.requests);
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
      setError(err.response?.data?.message || 'Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleDispense = async (requestId, requestType) => {
    if (!window.confirm('Are you sure you want to mark this request as dispensed?')) {
      return;
    }
    try {
      await axiosInstance.put(`/pharmacy/dispense/${requestId}`, { type: requestType });
      setToast({ message: 'Request marked as dispensed successfully!', type: 'success' });
      fetchPendingRequests(); // Refresh the list
    } catch (err) {
      console.error('Failed to dispense request:', err);
      setToast({ message: err.response?.data?.message || 'Failed to dispense request', type: 'error' });
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading pending requests...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Dispense Requested Drugs</h2>

      {pendingRequests.length === 0 ? (
        <p className="text-gray-600">No pending drug requests to dispense.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingRequests.map(request => (
            <div key={`${request.type}-${request._id}`} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-2 capitalize">{request.type} Request (No: {request.requestNumber})</h3>
              <p className="text-gray-700 mb-1"><strong>Patient:</strong> {request.patientName} (MRN: {request.mrn})</p>
              <p className="text-gray-700 mb-2"><strong>Requested At:</strong> {new Date(request.requestedAt).toLocaleString()}</p>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-800">Drugs:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {request.drugs.map((drug, idx) => (
                    <li key={idx}>
                      {drug.name} - Qty: {drug.quantity}
                      {drug.instructions && ` (${drug.instructions})`}
                    </li>
                  ))}
                </ul>
              </div>
              
              <button
                onClick={() => handleDispense(request._id, request.type)}
                className="btn-brand w-full py-2"
                disabled={!user || !['pharmacist', 'admin', 'nurse'].includes(user.role)}
              >
                Dispense
              </button>
            </div>
          ))}
        </div>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
