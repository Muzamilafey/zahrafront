import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-center text-2xl font-bold mb-4">Lab Queue</h1>
      <div className="bg-white border rounded overflow-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="bg-gray-100"><th className="px-2 py-1">#</th><th className="px-2 py-1">Patient</th><th className="px-2 py-1">Test</th><th className="px-2 py-1">Priority</th><th className="px-2 py-1">Status</th></tr></thead>
          <tbody>
            {orders.length === 0 ? <tr><td colSpan={5} className="p-4 text-center">No queued orders</td></tr> : orders.map((o,i)=>(<tr key={o._id} className="border-t"><td className="px-2 py-1">{i+1}</td><td className="px-2 py-1">{o.patient?.user?.name}</td><td className="px-2 py-1">{o.testType}</td><td className="px-2 py-1">{o.priority}</td><td className="px-2 py-1">{o.status}</td></tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabQueue;