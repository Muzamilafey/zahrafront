import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function Refunds() {
  const { axiosInstance } = useContext(AuthContext);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ load(); }, []);

  const load = async () => {
    setLoading(true);
    try{
      const res = await axiosInstance.get('/billing/refunds');
      setRefunds(res.data.refunds || []);
    }catch(e){ console.error(e); }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mt-0 mb-0">Refunds</h1>
      <div className="mt-4">
        {loading ? <div>Loading...</div> : (
          <div className="bg-white rounded p-4 shadow">
            {refunds.length === 0 ? <div className="text-sm text-gray-500">No refunds</div> : (
              <table className="table-auto w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left">Date</th>
                    <th className="px-2 py-1 text-left">Invoice</th>
                    <th className="px-2 py-1 text-right">Amount</th>
                    <th className="px-2 py-1">Processed By</th>
                    <th className="px-2 py-1">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map(r=> (
                    <tr key={r._id} className="border-t">
                      <td className="px-2 py-1">{new Date(r.createdAt).toLocaleString()}</td>
                      <td className="px-2 py-1">#{r.invoice?.invoiceNumber || r.invoice}</td>
                      <td className="px-2 py-1 text-right">${(r.amount||0).toLocaleString()}</td>
                      <td className="px-2 py-1">{r.processedBy? r.processedBy.name : '-'}</td>
                      <td className="px-2 py-1">{r.reason || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
