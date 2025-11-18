import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import Toast from '../../../components/ui/Toast';

export default function Allergies() {
  const { id: patientId } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadAllergies();
    // eslint-disable-next-line
  }, [patientId]);

  const loadAllergies = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/patients/${patientId}/allergies`);
      setAllergies(res.data.allergies || []);
    } catch (error) {
      setToast({ message: error?.response?.data?.message || 'Failed to load allergies', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Patient Allergies</h2>
      {loading ? (
        <div>Loading...</div>
      ) : allergies.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-4 text-gray-500">No allergies found for this patient.</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allergen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reaction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allergies.map((a) => (
                <tr key={a._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{a.allergen}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{a.reaction}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{a.severity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{a.notes}</td>
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
