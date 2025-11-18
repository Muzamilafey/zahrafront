import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import Toast from '../../../components/ui/Toast';

export default function OutpatientHistory() {
  const { id: patientId } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadOutpatientHistory();
  }, [patientId]);

  const loadOutpatientHistory = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/patients/${patientId}/outpatient-history`);
      setVisits(res.data.visits || []);
    } catch (error) {
      setToast({ message: error?.response?.data?.message || 'Failed to load outpatient history', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading outpatient history...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Outpatient Visit History</h2>

      {visits.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-4 text-gray-500">
          No outpatient visits found
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visits.map((visit) => (
                <tr key={visit._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(visit.visitDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{visit.visitType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {visit.doctor?.user?.name || 'Not Assigned'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {visit.diagnosis?.code && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded mr-2">
                        {visit.diagnosis.code}
                      </span>
                    )}
                    {visit.diagnosis?.description || 'No diagnosis recorded'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      visit.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : visit.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {visit.status}
                    </span>
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