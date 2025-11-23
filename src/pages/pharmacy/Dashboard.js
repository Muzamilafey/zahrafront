import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

export default function PharmacyDashboard(){
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useUI();
  const [summary, setSummary] = useState({ totalDrugs: 0, pendingRequests: 0, todaySales: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let mounted = true;
    const load = async ()=>{
      setLoading(true);
      try{
        const [invRes, reqRes, salesRes] = await Promise.allSettled([
          axiosInstance.get('/pharmacy/inventory'),
          axiosInstance.get('/pharmacy/dispense/pending'),
          axiosInstance.get('/pharmacy/sales?limit=5')
        ]);

        const totalDrugs = invRes.status === 'fulfilled' ? (Array.isArray(invRes.value.data.drugs) ? invRes.value.data.drugs.length : (invRes.value.data.count || 0)) : 0;
        const pendingRequests = reqRes.status === 'fulfilled' ? (Array.isArray(reqRes.value.data.requests) ? reqRes.value.data.requests.length : (reqRes.value.data.count || 0)) : 0;
        const todaySales = (salesRes.status === 'fulfilled' && Array.isArray(salesRes.value.data.sales)) ? salesRes.value.data.sales.reduce((s,x)=> s + (x.total||0), 0) : 0;

        const recent = (salesRes.status === 'fulfilled' && Array.isArray(salesRes.value.data.sales)) ? salesRes.value.data.sales : [];

        if (!mounted) return;
        setSummary({ totalDrugs, pendingRequests, todaySales });
        setRecentSales(recent);
      }catch(e){
        console.error('Failed to load pharmacy dashboard summary', e);
        showToast && showToast({ message: 'Failed to load pharmacy summary', type: 'error' });
      }finally{
        if (mounted) setLoading(false);
      }
    };
    load();
    return ()=> { mounted = false; };
  }, [axiosInstance, showToast]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/pharmacy/pos" className="btn-brand">Open POS</Link>
          <Link to="/pharmacy/register-drugs" className="btn-outline">Register Drug</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Total Drugs</div>
            <div className="text-2xl font-semibold">{loading ? '—' : summary.totalDrugs}</div>
          </div>
          <div className="text-green-600 text-3xl font-bold">💊</div>
        </div>

        <div className="bg-white rounded shadow p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Pending Requests</div>
            <div className="text-2xl font-semibold">{loading ? '—' : summary.pendingRequests}</div>
          </div>
          <div className="text-yellow-600 text-3xl font-bold">📥</div>
        </div>

        <div className="bg-white rounded shadow p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Today Sales</div>
            <div className="text-2xl font-semibold">{loading ? '—' : summary.todaySales.toFixed ? summary.todaySales.toFixed(2) : summary.todaySales}</div>
          </div>
          <div className="text-blue-600 text-3xl font-bold">💵</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-3">Recent Sales</h3>
          {recentSales.length === 0 ? <div className="text-sm text-gray-500">No recent sales.</div> : (
            <ul className="space-y-3">
              {recentSales.map(s => (
                <li key={s._id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">#{s._id?.toString().slice(-8)} — {s.total?.toFixed ? s.total.toFixed(2) : s.total}</div>
                    <div className="text-xs text-gray-500">{new Date(s.createdAt || s.date || Date.now()).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/pharmacy/sales-report`} className="text-sm btn-outline">View</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-3">Quick Actions</h3>
          <div className="flex flex-col gap-2">
            <Link to="/pharmacy/inventory" className="btn-ghost text-left">Inventory</Link>
            <Link to="/pharmacy/dispense" className="btn-ghost text-left">Dispense Requests</Link>
            <Link to="/pharmacy/sales-report" className="btn-ghost text-left">Transactions</Link>
            <Link to="/pharmacy/register-drugs" className="btn-ghost text-left">Register Drug</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
