import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function Reports() {
  const { axiosInstance } = useContext(AuthContext);
  const [rows, setRows] = useState([]);
  const [period, setPeriod] = useState('day');
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    load();
  }, []);

  const load = async (p = period) => {
    setLoading(true);
    try{
      const res = await axiosInstance.get(`/billing/reports/revenue?period=${p}`);
      setRows(res.data.rows || []);
    }catch(e){ console.error(e); }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mt-0 mb-0">Revenue Reports</h1>
      <div className="mt-4 mb-4">
        <button className={`px-3 py-1 mr-2 ${period==='day'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={()=>{ setPeriod('day'); load('day'); }}>Daily</button>
        <button className={`px-3 py-1 ${period==='month'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={()=>{ setPeriod('month'); load('month'); }}>Monthly</button>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="bg-white rounded p-4 shadow">
          {rows.length === 0 ? <div className="text-sm text-gray-500">No data</div> : (
            <table className="table-auto w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">Date</th>
                  <th className="px-2 py-1 text-right">Billed</th>
                  <th className="px-2 py-1 text-right">Paid</th>
                  <th className="px-2 py-1 text-right">Refunds</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r=> (
                  <tr key={r.date} className="border-t">
                    <td className="px-2 py-1">{r.date}</td>
                    <td className="px-2 py-1 text-right">${(r.totalBilled||0).toLocaleString()}</td>
                    <td className="px-2 py-1 text-right">${(r.totalPaid||0).toLocaleString()}</td>
                    <td className="px-2 py-1 text-right">${(r.totalRefunds||0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
