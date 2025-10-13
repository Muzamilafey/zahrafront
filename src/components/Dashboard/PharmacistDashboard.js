import React, { useEffect, useState, useContext } from 'react';
// Sidebar and Topbar are handled by the global Layout
import DataTable from '../ui/DataTable';
import POS from '../../pages/pharmacy/POS';
import { AuthContext } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';

export default function PharmacistDashboard() {
  const { axiosInstance, user, logout } = useContext(AuthContext);
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(()=>{
    const load = async ()=>{
      try {
        const inv = await axiosInstance.get('/pharmacy/inventory');
        setInventory(inv.data.drugs || []);
        const tx = await axiosInstance.get('/pharmacy/transactions');
        setTransactions((tx.data.transactions||[]).map(t=>({ date: new Date(t.createdAt||Date.now()).toLocaleDateString(), item: t._id, qty: '-', total: '-' })));
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  return (
    <>
  <div className="flex items-center justify-between mt-0 sm:mt-1 mb-0">
    <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>
    <ThemeToggle />
  </div>

          


          <div className="mb-6">
            <POS />
          </div>

          <div className="bg-white rounded p-4 shadow">
            <h3 className="font-semibold mb-2">Inventory</h3>
            <DataTable columns={[{header:'Name',accessor:'name'},{header:'Stock',accessor:'stockLevel'},{header:'Expiry',accessor:'expiryDate'},{header:'Supplier',accessor:'supplier'}]} data={inventory} />
          </div>

          <div className="mt-6 bg-white rounded p-4 shadow">
            <h3 className="font-semibold mb-2">Recent Transactions</h3>
            <DataTable columns={[{header:'Date',accessor:'date'},{header:'Item',accessor:'item'},{header:'Qty',accessor:'qty'},{header:'Total',accessor:'total'}]} data={transactions} />
          </div>
    </>
  );
}