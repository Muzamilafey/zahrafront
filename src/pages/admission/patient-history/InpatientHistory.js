import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import Toast from '../../../components/ui/Toast';

export default function InpatientHistory() {
  const { id: patientId } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadAdmissionHistory();
  }, [patientId]);

  const loadAdmissionHistory = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/patients/${patientId}/admission-history`);
      setAdmissions(res.data.admissions || []);
    } catch (error) {
      setToast({ 
        message: error?.response?.data?.message || 'Failed to load admission history', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading admission history...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Inpatient Admission History</h2>

      {admissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-4 text-gray-500">
          No previous admissions found
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discharge Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ward</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Length of Stay</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admissions.map((admission) => {
                const admissionDate = new Date(admission.admittedAt);
                const dischargeDate = admission.dischargedAt ? new Date(admission.dischargedAt) : null;
                const lengthOfStay = dischargeDate ? 
                  Math.ceil((dischargeDate - admissionDate) / (1000 * 60 * 60 * 24)) :
                  Math.ceil((new Date() - admissionDate) / (1000 * 60 * 60 * 24));

                return (
                  <tr key={admission._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {admissionDate.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {dischargeDate ? dischargeDate.toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {admission.ward?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {admission.doctor?.user?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {admission.admissionReason || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {lengthOfStay} day{lengthOfStay !== 1 ? 's' : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}