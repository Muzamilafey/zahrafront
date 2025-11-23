import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

export default function SalesReport(){
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useUI();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let mounted = true;
    const load = async ()=>{
      setLoading(true);
      try{
        const res = await axiosInstance.get('/pharmacy/sales?limit=200');
        if (!mounted) return;
        setSales(res.data.sales || []);
      }catch(e){
        console.error('Failed to load sales', e);
        showToast && showToast({ message: 'Failed to load sales', type: 'error' });
      }finally{ if (mounted) setLoading(false); }
    };
    load();
    return ()=> { mounted = false; };
  }, [axiosInstance, showToast]);

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Pharmacy Transactions</h2>
      {loading ? <div>Loading...</div> : (
        <div className="overflow-auto">
          <table className="table-auto w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Sale #</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s._id} className="border-t">
                  <td className="px-3 py-2">{new Date(s.createdAt || s.date || Date.now()).toLocaleString()}</td>
                  <td className="px-3 py-2">#{s._id?.toString().slice(-8)}</td>
                  <td className="px-3 py-2">{s.customer?.name || s.customer?.phone || 'Walk-in'}</td>
                  <td className="px-3 py-2">{(s.total || 0).toFixed ? (s.total || 0).toFixed(2) : s.total}</td>
                  <td className="px-3 py-2">{s.paid ? <span className="text-green-600">Paid</span> : <span className="text-yellow-600">Pending</span>}</td>
                  <td className="px-3 py-2">
                    <a className="btn-outline mr-2" href={`/pharmacy/sales/${s._id}/receipt-html`} target="_blank" rel="noreferrer">Receipt</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
