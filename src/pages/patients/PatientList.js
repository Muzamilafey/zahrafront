import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';
import { FaSearch, FaUserPlus, FaEllipsisV, FaUsers, FaUserCheck, FaBed, FaUser, FaFileMedical, FaEye, FaFileInvoice } from 'react-icons/fa';
import './PatientList.css';

export default function PatientListPage() {
  const { axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    admitted: 0,
    discharged: 0,
  });

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [query, patients]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/patients');
      const patientData = Array.isArray(res.data) ? res.data : (res.data.patients || []);
      setPatients(patientData);
      setFilteredPatients(patientData);
      calculateStats(patientData);
    } catch (e) {
      setToast({
        message: e?.response?.data?.message || 'Failed to load patients',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (patientData) => {
    const total = patientData.length;
    const admitted = patientData.filter(p => p.admission?.isAdmitted).length;
    const discharged = total - admitted;
    setStats({ total, admitted, discharged });
  };

  const filterPatients = () => {
    let filtered = patients;
    if (query) {
      const lowercasedQuery = query.toLowerCase();
      filtered = patients.filter(p => {
        const fullName = `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.trim().toLowerCase();
        const hospitalId = String(p.hospitalId || p.mrn || '').toLowerCase();
        return fullName.includes(lowercasedQuery) || hospitalId.includes(lowercasedQuery);
      });
    }
    setFilteredPatients(filtered);
  };

  const getPatientStatus = (patient) => {
    return patient.admission?.isAdmitted ? 'In-treatment' : 'Recovered';
  };

  const getStatusClassName = (status) => {
    switch (status) {
      case 'In-treatment':
        return 'status-in-treatment';
      case 'Recovered':
        return 'status-recovered';
      default:
        return 'status-default';
    }
  };
  
  const StatCard = ({ title, value, icon }) => (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <p className="stat-title">{title}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="patient-list-page">
      <header className="page-header">
        <h1>Patients</h1>
        <div className="header-actions">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="new-patient-btn" onClick={() => navigate('/patients/register')}>
            <FaUserPlus />
            New Patient
          </button>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard title="Total Patients" value={stats.total} icon={<FaUsers />} />
        <StatCard title="New Patients" value={stats.total} icon={<FaUserPlus />} />
        <StatCard title="Discharged" value={stats.discharged} icon={<FaUserCheck />} />
        <StatCard title="In-treatment" value={stats.admitted} icon={<FaBed />} />
      </div>

      <div className="patient-list-container">
        <table className="patient-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>ID</th>
              <th>Date</th>
              <th>Diagnosis</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center">Loading...</td></tr>
            ) : (
              filteredPatients.map(patient => (
                <tr key={patient._id}>
                  <td className="patient-name-cell">
                    <div className="avatar-placeholder"></div>
                    {`${patient.firstName} ${patient.lastName}`}
                  </td>
                  <td>{patient.mrn || 'N/A'}</td>
                  <td>{new Date(patient.createdAt).toLocaleDateString()}</td>
                  <td>{patient.diagnosis || 'N/A'}</td>
                  <td>
                    <span className={`status-tag ${getStatusClassName(getPatientStatus(patient))}`}>
                      {getPatientStatus(patient)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-item" onClick={() => navigate(`/patients/${patient._id}`)} title="View Details">
                        <div className="action-icon"><FaEye /></div>
                        <span className="action-label">View</span>
                      </button>

                      <button className="action-item" onClick={() => navigate(`/patients/${patient._id}/profile`)} title="Profile">
                        <div className="action-icon"><FaUser /></div>
                        <span className="action-label">Profile</span>
                      </button>

                      <button className="action-item" onClick={() => navigate(`/patients/${patient._id}/discharge-summary`)} title="Discharge Summary">
                        <div className="action-icon"><FaFileMedical /></div>
                        <span className="action-label">Discharge</span>
                      </button>

                      <button className="action-item" onClick={() => navigate(`/patients/${patient._id}/invoice`)} title="Invoice">
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