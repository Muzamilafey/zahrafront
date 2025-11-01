import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function LabRequestsAll() {
  const { axiosInstance } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    (async ()=>{
      setLoading(true);
      try{
        const res = await axiosInstance.get('/labs/orders');
        setOrders(res.data.orders || []);
      }catch(e){ console.error(e); }
      setLoading(false);
    })();
  },[]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Lab Requests</h2>
      {loading ? <div>Loading...</div> : (
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left">
              <th>Date</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Test</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o=> (
              <tr key={o._id} className="border-t">
                <td>{new Date(o.createdAt).toLocaleString()}</td>
                <td>{o.patientName || (o.patient && (o.patient.name || o.patient.firstName)) || '-'}</td>
                <td>{o.doctor?.name || o.doctor?.firstName || '-'}</td>
                <td>{o.testType}</td>
                <td>{o.status}</td>
                <td><Link to={`/dashboard/lab/requests/${o._id}`} className="text-brand-600">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
