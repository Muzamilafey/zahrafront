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

  // ✅ Always re-load when filters or query change
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    loadPatients();
  }, [status, searchParams]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      let res;

      // ✅ Backend-side filtering by status
      if (status === 'admitted') {
        res = await axiosInstance.get('/patients/admitted');
      } else if (status === 'discharged') {
        res = await axiosInstance.get('/patients/discharged');
      } else {
        res = await axiosInstance.get('/patients');
      }

      let list = Array.isArray(res.data)
        ? res.data
        : (res.data.patients || []);

      // Client-side text filtering (query)
      const q = (searchParams.get('q') || '').toLowerCase().trim();
      const getFullName = (p) => {
        // prefer explicit patient name fields
        const assembled = `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.trim();
        if (assembled) return assembled;
        // try other possible name fields
        if (p.surname) return String(p.surname);
        if (p.name) return String(p.name);
        if (p.fullName) return String(p.fullName);
        // fallback to nested user name
        return p.user?.name || '';
      };

      if (q) {
        list = list.filter((p) => {
          const fullName = getFullName(p).toLowerCase();
          const hospitalId = String(p.hospitalId || p.mrn || '').toLowerCase();
          const mrn = String(p.mrn || '').toLowerCase();
          const email = (p.user?.email || '').toLowerCase();
          return (
            fullName.includes(q) ||
            hospitalId.includes(q) ||
            mrn.includes(q) ||
            email.includes(q)
          );
        });
      }

      // Note: discharged patients are now listed on a dedicated page. PatientList shows 'all' or 'admitted'.

      setPatients(list || []);
    } catch (e) {
      setToast({
        message: e?.response?.data?.message || 'Failed to load patients',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyStatus = (s) => {
    const params = Object.fromEntries([...searchParams]);
    if (s && s !== 'all') params.status = s;
    else delete params.status;
    setSearchParams(params);
  };

  const applySearch = (q) => {
    const params = Object.fromEntries([...searchParams]);
    if (q && q.trim().length > 0) params.q = q.trim();
    else delete params.q;
    setSearchParams(params);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  const fullNameOf = (p) => {
    const assembled = `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.trim();
    if (assembled) return assembled;
    if (p.surname) return String(p.surname);
    if (p.name) return String(p.name);
    if (p.fullName) return String(p.fullName);
    return p.user?.name || '-';
  };

  const getPatientStatus = (patient) => {
    if (patient.admission?.isAdmitted) return 'Admitted';
    return 'Discharged';
  };

  const handleViewDischargeSummary = (patientId) => {
    navigate(`/patients/${patientId}/discharge-summary`);
  };

  const handleDeletePatient = async (patientId) => {
    if (!window.confirm('Delete this patient? This action is permanent.')) return;
    try {
      await axiosInstance.delete(`/patients/${patientId}`);
      // remove from UI
      setPatients(prev => prev.filter(p => String(p._id) !== String(patientId)));
    } catch (e) {
      setToast({ message: e?.response?.data?.message || 'Failed to delete patient', type: 'error' });
    }
  };

  const pageTitle =
    status === 'admitted'
      ? 'Currently Admitted Patients'
      : status === 'discharged'
      ? 'Discharged Patients'
      : 'All Patients';

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">VIEW ALL PATIENTS</h1>
        <div className="text-sm text-gray-500">TOTAL NO OF PATIENTS: <span className="font-semibold">{patients.length}</span></div>
      </div>
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            className="input w-96"
            placeholder="Search by name, hospital ID, or MRN..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applySearch(query);
            }}
          />
          <button className="btn-brand" onClick={() => applySearch(query)}>
            Search
          </button>
          <button
            className="btn-outline"
            onClick={() => {
              setQuery('');
              applySearch('');
            }}
          >
            Clear
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input"
            value={status}
            onChange={(e) => applyStatus(e.target.value)}
          >
            <option value="all">All Patients</option>
            <option value="admitted">Admitted</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center">Loading patients...</div>
      ) : patients.length === 0 ? (
        <div className="text-center text-gray-500">No patients found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
          {patients.map((p) => (
            <div key={p._id} className="relative rounded-[28px] p-6 bg-gradient-to-br from-[#00b4b4] to-[#7be56d] text-black shadow-md">
              <div className="mb-4">
                <div className="text-base font-bold uppercase">FULL NAME:</div>
                <div className="text-lg font-semibold mb-2">{fullNameOf(p)}</div>

                <div className="text-sm font-bold uppercase">CONTACT:</div>
                <div className="text-sm mb-2">{p.user?.phone || '-'}</div>

                <div className="text-sm font-bold uppercase">ID NUMBER</div>
                <div className="text-sm">{p.idNumber || p.nationalId || '-'}</div>

                <div className="text-sm font-bold uppercase mt-3">MRN</div>
                <div className="text-sm font-semibold">{p.mrn || '-'}</div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => navigate(`/patients/${p._id}`)}
                  className="bg-blue-400 text-black text-sm py-2 px-4 rounded-full shadow-md hover:bg-blue-500"
                  style={{ boxShadow: '0 6px 0 rgba(0,0,0,0.12)'}}
                >
                  OPEN PROFILE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
