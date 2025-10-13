import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function Pharmacy() {
  const { axiosInstance } = useContext(AuthContext);
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/pharmacy/inventory');
        setDrugs(res.data.drugs || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load pharmacy');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Add drug form removed — creation of drugs is restricted to admin CLI/seeders/other flows

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Pharmacy Inventory</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1 md:col-span-2">
          {/* Add Drug form removed from UI */}
        </div>
        {drugs.length === 0 && <p>No drugs found.</p>}
        {drugs.map(d => (
          <div key={d._id} className="bg-white p-4 rounded shadow">
            <p className="font-semibold">{d.name}</p>
            <p>Batch: {d.batchNumber}</p>
            <p>Expiry: {new Date(d.expiryDate).toLocaleDateString()}</p>
            <p>Stock: {d.stockLevel}</p>
          </div>
        ))}
      </div>
    </div>
  );
}