import React, { useEffect, useState, useContext } from 'react';
import DataTable from '../ui/DataTable';
import POS from '../../pages/pharmacy/POS';
import { AuthContext } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import StatCard from '../ui/StatCard'; // Import the new StatCard component
import { FaMoneyBillWave, FaBox, FaExclamationTriangle, FaHourglassHalf } from 'react-icons/fa'; // Import icons

export default function PharmacistDashboard() {
  const { axiosInstance } = useContext(AuthContext);
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    lowStock: 0,
    pendingRequests: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch inventory and other data
        const inv = await axiosInstance.get('/pharmacy/inventory');
        const inventoryData = inv.data.drugs || [];
        setInventory(inventoryData);

        // TODO: Replace with actual API calls for stats
        setStats({
          totalSales: 125, // Dummy data
          totalProducts: inventoryData.length,
          lowStock: inventoryData.filter(d => d.stockLevel < 10).length,
          pendingRequests: 5, // Dummy data
        });
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [axiosInstance]);

  return (
    <>
      <div className="flex items-center justify-between mt-0 sm:mt-1 mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Pharmacy Dashboard</h1>
        <ThemeToggle />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Sales"
          value={`$${stats.totalSales.toFixed(2)}`}
          icon={<FaMoneyBillWave />}
          color="text-green-500"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={<FaBox />}
          color="text-blue-500"
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStock}
          icon={<FaExclamationTriangle />}
          color="text-yellow-500"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={<FaHourglassHalf />}
          color="text-red-500"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <POS />
          </div>
        </div>
      </div>
    </>
  );
}