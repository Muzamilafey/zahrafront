import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const LabQueue = () => {
  const { axiosInstance } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await axiosInstance.get('/lab/orders');
        setOrders(res.data.orders || []);
      }catch(err){console.error(err);}    };
    load();
  },[axiosInstance]);

  const updateStatus = async (orderId, newStatus) => {
    try{
      await axiosInstance.put(`/lab/${orderId}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    }catch(err){ console.error(err); alert('Failed to update status'); }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-center text-2xl font-bold mb-4">Lab Queue</h1>
      <div className="bg-white border rounded overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1">#</th>
              <th className="px-2 py-1">Patient</th>
              <th className="px-2 py-1">Test</th>
              <th className="px-2 py-1">Priority</th>
              <th className="px-2 py-1">Status</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center">No queued orders</td></tr>
            ) : orders.map((o,i)=> (
              <tr key={o._id} className="border-t">
                <td className="px-2 py-1">{i+1}</td>
                <td className="px-2 py-1">{o.patient?.user?.name || o.patientName}</td>
                <td className="px-2 py-1">{o.testType}</td>
                <td className="px-2 py-1">{o.priority}</td>
                <td className="px-2 py-1">{o.status}</td>
                <td className="px-2 py-1">
                  <div className="flex gap-2">
                    <button onClick={()=>updateStatus(o._id, 'collected')} className="px-2 py-1 bg-yellow-300 rounded">Collect Sample</button>
                    <button onClick={()=>updateStatus(o._id, 'ready_for_collection')} className="px-2 py-1 bg-indigo-200 rounded">Ready For Collection</button>
                    <button onClick={()=>updateStatus(o._id, 'referred')} className="px-2 py-1 bg-gray-200 rounded">Referral</button>
                    <Link to={`/labtests/${o._id}`} className="px-2 py-1 bg-blue-600 text-white rounded">View Tests</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabQueue;