import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';

export default function DischargedPatientsList() {
  const { axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadDischargedPatients();
  }, []);

  const loadDischargedPatients = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/patients/discharged');
      let list = Array.isArray(res.data) ? res.data : (res.data.patients || []);

      const q = (query || '').toLowerCase().trim();
      if (q) {
        list = list.filter((p) => {
          const name = (p.user?.name || p.name || '').toLowerCase();
          const hospitalId = String(p.hospitalId || p.mrn || '').toLowerCase();
          const mrn = String(p.mrn || '').toLowerCase();
          const email = (p.user?.email || '').toLowerCase();
          return (
            name.includes(q) ||
            hospitalId.includes(q) ||
            mrn.includes(q) ||
            email.includes(q)
          );
        });
      }

      setPatients(list || []);
    } catch (e) {
      setToast({ message: e?.response?.data?.message || 'Failed to load discharged patients', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDischargeSummary = (patientId) => {
    navigate(`/patients/${patientId}/discharge-summary`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Discharged Patients</h2>

      <div className="mb-4 flex items-center gap-2">
        <input
          className="input w-96"
          placeholder="Search by name, hospital ID, or MRN..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') loadDischargedPatients(); }}
        />
        <button className="btn-brand" onClick={() => loadDischargedPatients()}>Search</button>
        <button className="btn-outline" onClick={() => { setQuery(''); loadDischargedPatients(); }}>Clear</button>
      </div>

      {loading ? (
        <div className="text-center">Loading discharged patients...</div>
      ) : patients.length === 0 ? (
        <div className="text-center text-gray-500">No discharged patients found</div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discharged At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map((patient) => (
                <tr key={patient._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{patient.hospitalId}</div>
                    <div className="text-sm text-gray-500">{patient.mrn}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{patient.user?.name || '-'}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{patient.gender || '-'}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{patient.age || '-'}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{patient.user?.phone || '-'}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{patient.admission?.dischargedAt ? new Date(patient.admission.dischargedAt).toLocaleString() : '-'}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => navigate(`/patients/${patient._id}`)} className="text-brand-600 hover:text-brand-900 mr-4">View Details</button>
                    <button onClick={() => handleViewDischargeSummary(patient._id)} className="text-green-600 hover:text-green-900">Discharge Summary</button>
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
