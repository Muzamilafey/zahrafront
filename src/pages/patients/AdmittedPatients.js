import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';

export default function AdmittedPatients() {
  const { axiosInstance } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadAdmittedPatients();
  }, []);

  const loadAdmittedPatients = async () => {
    try {
      const res = await axiosInstance.get('/patients/admitted');
      setPatients(res.data.patients || []);
    } catch (e) {
      setToast({ message: e?.response?.data?.message || 'Failed to load admitted patients', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const calculateStayDuration = (admittedAt) => {
    const admitted = new Date(admittedAt);
    const now = new Date();
    const days = Math.floor((now - admitted) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Currently Admitted Patients</h2>
      
      {loading ? (
        <div className="text-center">Loading admitted patients...</div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ward & Bed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admitted Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Stayed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map((patient) => (
                <tr key={patient._id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{patient.user?.name}</div>
                    <div className="text-sm text-gray-500">ID: {patient.hospitalId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">Ward: {patient.admission?.ward || '-'}</div>
                    <div className="text-sm text-gray-500">Bed: {patient.admission?.bed || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {patient.assignedDoctor?.user?.name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(patient.admission?.admittedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {calculateStayDuration(patient.admission?.admittedAt)} days
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-brand-600 hover:text-brand-900 mr-2">View Details</button>
                    <button className="text-red-600 hover:text-red-900">Discharge</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {patients.length === 0 && !loading && (
            <div className="text-center py-4 text-gray-500">
              No patients currently admitted
            </div>
          )}
        </div>
      )}
      
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}