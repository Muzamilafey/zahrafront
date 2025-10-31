import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function PatientVisits(){
  const { axiosInstance } = useContext(AuthContext);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(()=>{ load(); }, []);
  const load = async () => {
    try{
      setLoading(true);
      const res = await axiosInstance.get('/visits');
      setVisits(res.data.visits || res.data || []);
    }catch(e){ console.error(e); }
    finally{ setLoading(false); }
  };

  const filtered = visits.filter(v =>
    v.patient?.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
    v.doctor?.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Patient Visits</h2>
        <Link to="/patients/visits/new" className="btn-brand">New Visit</Link>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search by patient, diagnosis or doctor" className="input w-full" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading visits...</div>
      ) : (
        <div className="bg-white rounded shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(v => (
                <tr key={v._id || v.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{v.patient?.user?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{v.doctor?.user?.name || v.doctorName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{v.diagnosis || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(v.createdAt || v.date).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{v.isWalkIn ? 'Walk-in' : 'Appointment'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-6 text-center text-gray-500">No visits found</div>}
        </div>
      )}
    </div>
  );
}
