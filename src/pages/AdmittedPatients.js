import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Toast from '../components/ui/Toast';
import { FaSearch, FaEye, FaUser, FaFileMedical, FaUserPlus, FaBed } from 'react-icons/fa';
import './patients/PatientList.css';

export default function AdmittedPatients(){
  const { axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(()=>{ load(); }, []);
  const load = async () => {
    try{
      setLoading(true);
      const res = await axiosInstance.get('/patients/admitted');
      const list = res.data.patients || [];
      // sort by admittedAt descending (newest first)
      const sorted = (list || []).slice().sort((a,b) => {
        const da = a.currentAdmission?.admittedAt ? new Date(a.currentAdmission.admittedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const db = b.currentAdmission?.admittedAt ? new Date(b.currentAdmission.admittedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return db - da;
      });
      setPatients(sorted);
      setFiltered(sorted);
    }catch(e){
      console.error(e);
      setToast({ message: e?.response?.data?.message || 'Failed to load admitted patients', type: 'error' });
    }finally{ setLoading(false); }
  };

  useEffect(()=>{
    if(!search) { setFiltered(patients); return; }
    const q = search.toLowerCase();
    const f = patients.filter(p => {
      const name = (p.user?.name || `${p.firstName||''} ${p.lastName||''}`).toLowerCase();
      const id = String(p.hospitalId || p.mrn || '').toLowerCase();
      return name.includes(q) || id.includes(q);
    });
    setFiltered(f);
  }, [search, patients]);

  const StatCard = ({ title, value, icon }) => (
    <div className="stat-card">
      <div className="stat-icon text-blue-600">{icon}</div>
      <div className="stat-info">
        <p className="stat-title">{title}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );

  const getName = p => p.user?.name || `${p.firstName||''} ${p.lastName||''}`.trim() || 'Unknown';

  return (
    <div className="patient-list-page p-6">
      <header className="page-header">
        <h1>Admitted Patients</h1>
        <div className="header-actions">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Search admitted patients..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Link to="/patients/register" className="new-patient-btn bg-blue-600 text-white"> <FaUserPlus /> Register</Link>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard title="Admitted Now" value={patients.length} icon={<FaBed />} />
        <StatCard title="Total Records" value={patients.length} icon={<FaUser />} />
      </div>

      <div className="patient-list-container">
        <table className="patient-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Hos ID</th>
              <th>Admitted At</th>
              <th>Ward / Bed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center">Loading...</td></tr>
            ) : (
              filtered.map(p => (
                <tr key={p._id}>
                  <td className="patient-name-cell">
                    <div className="avatar-placeholder flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600">{getName(p).charAt(0) || 'U'}</div>
                    {getName(p)}
                  </td>
                  <td>{p.mrn || p.hospitalId || 'N/A'}</td>
                  <td>{p.currentAdmission?.admittedAt ? new Date(p.currentAdmission.admittedAt).toLocaleString() : '-'}</td>
                  <td>{p.currentAdmission?.ward?.name || p.currentAdmission?.ward || 'N/A'} / {p.currentAdmission?.bed || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-item bg-blue-600 text-white" onClick={() => navigate(`/patients/${p._id}`)} title="View Details">
                        <div className="action-icon"><FaEye /></div>
                        <span className="action-label">View</span>
                      </button>

                      <button className="action-item" onClick={() => navigate(`/admission/${p._id}/summary`)} title="Admission Summary">
                        <div className="action-icon"><FaFileMedical /></div>
                        <span className="action-label">Summary</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
