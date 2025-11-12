import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from 'contexts/AuthContext';
import Toast from '../../../components/ui/Toast';

export default function Procedures() {
  const { id: patientId } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadProcedures();
    // eslint-disable-next-line
  }, [patientId]);

  const loadProcedures = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/patients/${patientId}/procedures`);
      setProcedures(res.data.procedures || []);
    } catch (error) {
      setToast({ message: error?.response?.data?.message || 'Failed to load procedures', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Procedures Performed</h2>
      {loading ? (
        <div>Loading...</div>
      ) : procedures.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-4 text-gray-500">No procedures found for this patient.</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedure</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {procedures.map((p) => (
                <tr key={p._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{p.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(p.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{p.doctor?.user?.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{p.notes}</td>
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
