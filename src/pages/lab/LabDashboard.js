import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function LabDashboard() {
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
        const response = await axiosInstance.get('/api/lab/dashboard/stats');
        setStats(response.data);
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
    </div>
  );
}