import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

const LabDashboard = () => {
  const { axiosInstance } = useContext(AuthContext);
  const [from, setFrom] = useState(new Date().toISOString().slice(0,10));
  const [to, setTo] = useState(new Date().toISOString().slice(0,10));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/lab/orders');
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch lab orders', err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [axiosInstance]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-center text-2xl font-bold mb-6">Lab : Patient Visits</h1>

      <div className="border rounded p-4 mb-4 bg-white">
        <h2 className="text-lg font-semibold mb-3">Search By</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm">Patient Visits Period Between</label>
            <div className="flex gap-2">
              <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="border p-1" />
              <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="border p-1" />
            </div>
          </div>
          <div>
            <label className="block text-sm">Outpatient No.</label>
            <input className="border p-1 w-full" placeholder="Outpatient No" />
          </div>
          <div>
            <label className="block text-sm">Patient Name</label>
            <input className="border p-1 w-full" placeholder="Patient name" />
          </div>
        </div>
        <div className="mt-3">
          <button onClick={fetchOrders} className="px-3 py-1 bg-gray-200 rounded">Search / Refresh</button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white border rounded">
        <table className="min-w-full text-sm">
          <thead><tr className="bg-gray-100"><th className="px-2 py-1">CLINIC</th><th className="px-2 py-1">OUT-PATIENT FILE NO</th><th className="px-2 py-1">FULL NAME</th><th className="px-2 py-1">AGE</th><th className="px-2 py-1">INVESTIGATION CONDUCTED</th><th className="px-2 py-1">REQUEST REFERENCE</th><th className="px-2 py-1">PAY STATUS</th><th className="px-2 py-1">POSTED BY</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="p-4 text-center">Loading...</td></tr> : (
              orders.length === 0 ? <tr><td colSpan={8} className="p-4 text-center">No visits found</td></tr> : (
                orders.map(o => (
                  <tr key={o._id} className="border-t"><td className="px-2 py-1">{o.clinic || '-'}</td><td className="px-2 py-1">{o.patient?.fileNo || '-'}</td><td className="px-2 py-1">{o.patient?.user?.name || '-'}</td><td className="px-2 py-1">{o.patient?.age || '-'}</td><td className="px-2 py-1">{o.testType}</td><td className="px-2 py-1">{o._id}</td><td className="px-2 py-1">{o.status}</td><td className="px-2 py-1">{o.doctor?.user?.name || '-'}</td></tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabDashboard;