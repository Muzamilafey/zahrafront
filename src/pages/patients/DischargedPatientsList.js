import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';
import { FaSearch, FaEllipsisV, FaUsers, FaUserCheck, FaBed, FaEye, FaFileMedical, FaFileInvoice } from 'react-icons/fa';
import './PatientList.css';

export default function DischargedPatientsList() {
  const { axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ total: 0, discharged: 0, admitted: 0 });

  const loadDischargedPatients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/patients/discharged');
      const list = Array.isArray(res.data) ? res.data : (res.data.patients || []);
      setPatients(list || []);
      setFilteredPatients(list || []);
      setStats({ total: list.length, discharged: list.length, admitted: 0 });
    } catch (e) {
      setToast({ message: e?.response?.data?.message || 'Failed to load discharged patients', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  useEffect(() => { loadDischargedPatients(); }, [loadDischargedPatients]);

  useEffect(() => {
    if (!query) { setFilteredPatients(patients); return; }
    const q = query.toLowerCase().trim();
    const filtered = patients.filter(p => {
      const name = (p.user?.name || `${p.firstName || ''} ${p.lastName || ''}`).toLowerCase();
      const id = String(p.hospitalId || p.mrn || '').toLowerCase();
      return name.includes(q) || id.includes(q);
    });
    setFilteredPatients(filtered);
  }, [query, patients]);

  const StatCard = ({ title, value }) => (
    <div className="stat-card">
      <div className="stat-info">
        <p className="stat-title">{title}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );

  const getPatientName = (p) => p.user?.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown';

  return (
    <div className="patient-list-page">
      <header className="page-header">
        <h1>Discharged Patients</h1>
        <div className="header-actions">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Search discharged patients..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard title="Total Discharged" value={stats.discharged} />
        <StatCard title="Total Records" value={stats.total} />
      </div>

      <div className="patient-list-container">
        <table className="patient-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>ID</th>
              <th>Discharged At</th>
              <th>Gender</th>
              <th>Age</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center">Loading...</td></tr>
            ) : (
              filteredPatients.map(p => (
                <tr key={p._id}>
                  <td className="patient-name-cell">
                    <div className="avatar-placeholder" />
                    {getPatientName(p)}
                  </td>
                  <td>{p.mrn || p.hospitalId || 'N/A'}</td>
                  <td>{p.admission?.dischargedAt ? new Date(p.admission.dischargedAt).toLocaleString() : '-'}</td>
                  <td>{p.gender || '-'}</td>
                  <td>{p.age || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-item" onClick={() => navigate(`/patients/${p._id}`)} title="View Details">
                        <div className="action-icon"><FaEye /></div>
                        <span className="action-label">View</span>
                      </button>

                      <button className="action-item" onClick={() => navigate(`/patients/${p._id}/discharge-summary`)} title="Discharge Summary">
                        <div className="action-icon"><FaFileMedical /></div>
                        <span className="action-label">Discharge</span>
                      </button>

                      <button className="action-item" onClick={() => navigate(`/patients/${p._id}/invoice`)} title="Invoice">
                        <div className="action-icon"><FaFileInvoice /></div>
                        <span className="action-label">Invoice</span>
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
