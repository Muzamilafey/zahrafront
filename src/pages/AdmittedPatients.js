import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function AdmittedPatients(){
  const { axiosInstance } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(()=>{ load(); }, []);
  const load = async () => {
    try{
      setLoading(true);
      // backend may support /patients/admitted or /patients?status=admitted - try the specific endpoint
      const res = await axiosInstance.get('/patients/admitted');
      setPatients(res.data.patients || []);
    }catch(e){
      console.error(e);
    }finally{ setLoading(false); }
  };

  const filtered = patients.filter(p =>
    p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.hospitalId?.toLowerCase().includes(search.toLowerCase()) ||
    p.mrn?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Admitted Patients</h2>
        <Link to="/patients/register" className="btn-brand">Register Patient</Link>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search" className="input w-full" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MRN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ward/Bed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admitted At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(p => (
                <tr key={p._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{p.user?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{p.hospitalId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{p.mrn}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{p.currentAdmission?.ward?.name || p.currentAdmission?.ward || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(p.currentAdmission?.admittedAt || p.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-6 text-center text-gray-500">No admitted patients</div>}
        </div>
      )}
    </div>
  );
}
