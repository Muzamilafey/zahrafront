import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';

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

  useEffect(() => { fetchOrders(); }, []);

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
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function LabDashboard() {
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const [stats, setStats] = useState({
    pendingTests: 0,
    completedToday: 0,
    totalRequests: 0,
    urgentTests: 0
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // backend exposes /api/labs/orders -> { orders }
  const resp = await axiosInstance.get('/labs/orders');
        const orders = resp.data.orders || [];
        const pendingTests = orders.filter(o => o.status === 'pending').length;
        const totalRequests = orders.length;
        const urgentTests = orders.filter(o => o.priority === 'urgent').length || 0;
        // completed today: check updatedAt within today
        const today = new Date();
        today.setHours(0,0,0,0);
        const completedToday = orders.filter(o => o.status === 'completed' && o.updatedAt && new Date(o.updatedAt) >= today).length;
        setStats({ pendingTests, completedToday, totalRequests, urgentTests });
      } catch (error) {
        console.error('Error fetching lab stats:', error);
      }
    };

    fetchDashboardStats();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboardStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [axiosInstance]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Laboratory Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stats Cards */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500">Pending Tests</h3>
          <p className="text-3xl font-bold text-brand-600">{stats.pendingTests}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500">Completed Today</h3>
          <p className="text-3xl font-bold text-green-600">{stats.completedToday}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500">Total Requests</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalRequests}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500">Urgent Tests</h3>
          <p className="text-3xl font-bold text-red-600">{stats.urgentTests}</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4">Lab Pages</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button onClick={() => navigate('/dashboard/lab/queue')} className="bg-white rounded-lg shadow p-4 hover:shadow-lg hover:bg-gray-50 transition text-left">
          <h3 className="font-semibold text-brand-600 mb-1">Lab Queue</h3>
          <p className="text-sm text-gray-600">View and manage lab test queue</p>
        </button>
        <button onClick={() => navigate('/dashboard/lab/requests')} className="bg-white rounded-lg shadow p-4 hover:shadow-lg hover:bg-gray-50 transition text-left">
          <h3 className="font-semibold text-brand-600 mb-1">Lab Requests</h3>
          <p className="text-sm text-gray-600">View all lab requests</p>
        </button>
        <button onClick={() => navigate('/dashboard/lab/tests')} className="bg-white rounded-lg shadow p-4 hover:shadow-lg hover:bg-gray-50 transition text-left">
          <h3 className="font-semibold text-brand-600 mb-1">Lab Tests Catalog</h3>
          <p className="text-sm text-gray-600">Browse lab tests catalog</p>
        </button>
        <button onClick={() => navigate('/dashboard/lab/prices')} className="bg-white rounded-lg shadow p-4 hover:shadow-lg hover:bg-gray-50 transition text-left">
          <h3 className="font-semibold text-brand-600 mb-1">Lab Tests Prices</h3>
          <p className="text-sm text-gray-600">Manage lab test pricing</p>
        </button>
        <button onClick={() => navigate('/dashboard/lab/patient-report')} className="bg-white rounded-lg shadow p-4 hover:shadow-lg hover:bg-gray-50 transition text-left">
          <h3 className="font-semibold text-brand-600 mb-1">Lab Visits Report</h3>
          <p className="text-sm text-gray-600">View lab visits and reports</p>
        </button>
        <button onClick={() => navigate('/dashboard/lab/templates')} className="bg-white rounded-lg shadow p-4 hover:shadow-lg hover:bg-gray-50 transition text-left">
          <h3 className="font-semibold text-brand-600 mb-1">Lab Templates</h3>
          <p className="text-sm text-gray-600">Manage lab test templates</p>
        </button>
      </div>
    </div>
  );
}