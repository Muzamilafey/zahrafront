import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';

export default function PatientList() {
  const { axiosInstance, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  const status = searchParams.get('status') || 'all';

  useEffect(() => {
    // keep local query in sync with URL param
    setQuery(searchParams.get('q') || '');
    loadPatients();
  }, [searchParams]);

  const loadPatients = async () => {
    try {
      let res;
      if (status === 'admitted') {
        res = await axiosInstance.get('/patients/admitted');
      } else {
        // For both 'discharged' and 'all' we use the generic patients endpoint
        res = await axiosInstance.get('/patients');
      }

      // Normalize response to an array of patients. Backend may return { patients: [...] } or [...]
      let list = Array.isArray(res.data) ? res.data : (res.data.patients || []);

      // If filtering for discharged, apply a client-side filter to normalize backend differences
      if (status === 'discharged') {
        list = list.filter(p => {
          const hasHistory = Array.isArray(p.admissionHistory) && p.admissionHistory.length > 0;
          const currentlyAdmitted = p.admission && p.admission.isAdmitted;
          const dischargedAt = p.admission && p.admission.dischargedAt;
          return hasHistory || (!currentlyAdmitted && !!dischargedAt) || (!currentlyAdmitted && hasHistory);
        });
      }

      // Apply text query filtering
      const q = (searchParams.get('q') || '').toLowerCase().trim();
      if (q) {
        list = list.filter(p => {
          const name = (p.user?.name || p.name || '').toLowerCase();
          const hosp = String(p.hospitalId || p.hospitalId || p.mrn || '').toLowerCase();
          const mrn = String(p.mrn || '').toLowerCase();
          const email = (p.user?.email || '').toLowerCase();
          return name.includes(q) || hosp.includes(q) || mrn.includes(q) || email.includes(q);
        });
      }

      setPatients(list || []);
    } catch (e) {
      setToast({ message: e?.response?.data?.message || 'Failed to load patients', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const applyStatus = (s) => {
    const params = Object.fromEntries([...searchParams]);
    if (s && s !== 'all') params.status = s; else delete params.status;
    setSearchParams(params);
  };

  const applySearch = (q) => {
    const params = Object.fromEntries([...searchParams]);
    if (q && q.trim().length > 0) params.q = q.trim(); else delete params.q;
    setSearchParams(params);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const getPatientStatus = (patient) => {
    if (patient.admission?.isAdmitted) {
      return 'Admitted';
    }
    return 'Discharged';
  };

  const handleViewDischargeSummary = (patientId) => {
    navigate(`/patients/${patientId}/discharge-summary`);
  };

  const pageTitle = 
    status === 'admitted' ? 'Currently Admitted Patients' :
    status === 'discharged' ? 'Discharged Patients' :
    'All Patients';

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">{pageTitle}</h2>
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            className="input w-96"
            placeholder="Search by name, hospital ID, or MRN..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applySearch(query); }}
          />
          <button className="btn-brand" onClick={() => applySearch(query)}>Search</button>
          <button className="btn-outline" onClick={() => { setQuery(''); applySearch(''); }}>Clear</button>
        </div>
        <div className="flex items-center gap-2">
          <select className="input" value={status} onChange={(e) => applyStatus(e.target.value)}>
            <option value="all">All Patients</option>
            <option value="admitted">Admitted</option>
            <option value="discharged">Discharged</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center">Loading patients...</div>
      ) : patients.length === 0 ? (
        <div className="text-center text-gray-500">No patients found</div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.user?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.gender}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {patient.dob ? Math.floor((new Date() - new Date(patient.dob)) / 31557600000) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.user?.phone}</div>
                    <div className="text-sm text-gray-500">{patient.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${patient.admission?.isAdmitted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {getPatientStatus(patient)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => navigate(`/patients/${patient._id}`)}
                      className="text-brand-600 hover:text-brand-900 mr-4"
                    >
                      View Details
                    </button>
                    {!patient.admission?.isAdmitted && (patient.admissionHistory?.length > 0 || patient.admission?.dischargedAt) && (
                      <button 
                        onClick={() => handleViewDischargeSummary(patient._id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Discharge Summary
                      </button>
                    )}
                    {patient.admission?.isAdmitted && user && user.role === 'admin' && (
                      <button
                        onClick={() => navigate(`/discharge/${patient._id}`)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Discharge
                      </button>
                    )}
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