import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function MortuaryDashboard() {
  const { axiosInstance } = useContext(AuthContext);
  const [stats, setStats] = useState({ admitted: 0, released: 0, recent: [] });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axiosInstance.get('/mortuary/dashboard');
        if (!mounted) return;
        setStats(res.data || {});
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, [axiosInstance]);

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Mortuary Dashboard</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white border rounded">Admitted: <span className="font-bold">{stats.admitted || 0}</span></div>
        <div className="p-4 bg-white border rounded">Released: <span className="font-bold">{stats.released || 0}</span></div>
      </div>

      <div className="bg-white border rounded p-4">
        <h3 className="font-medium mb-2">Recent Cases</h3>
        {Array.isArray(stats.recent) && stats.recent.length > 0 ? (
          <ul>
            {stats.recent.map(p => (
              <li key={p._id} className="py-2 border-b last:border-b-0">{p.name || (p.patient && p.patient.name) || 'Unknown'} — {p.mortuary?.causeOfDeath || ''}</li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500">No recent mortuary cases</div>
        )}
      </div>
    </div>
  );
}
