import React, { useEffect, useState } from 'react';

export default function PharmacySalesSummary({ axiosInstance }){
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ (async ()=>{
    setLoading(true);
    try{
      const res = await axiosInstance.get('/pharmacy/sales');
      setSales(res.data.sales || []);
    }catch(e){ console.error('Failed load sales', e); }
    setLoading(false);
  })(); }, []);

  const today = new Date();
  const todaySales = sales.filter(s => new Date(s.createdAt).toDateString() === today.toDateString());
  const month = today.getMonth();
  const monthSales = sales.filter(s => new Date(s.createdAt).getMonth() === month);
  const total = sales.reduce((s,i)=> s + (Number(i.total||0)), 0);
  const totalToday = todaySales.reduce((s,i)=> s + (Number(i.total||0)), 0);
  const outstanding = sales.reduce((s,i)=> s + (i.paid ? 0 : Number(i.total||0)), 0);

  return (
    <div className="bg-white rounded p-4 shadow">
      <h3 className="font-semibold mb-2">Pharmacy Sales Summary</h3>
      {loading ? <div>Loading...</div> : (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="p-2 bg-gray-50 rounded text-sm">Today: <div className="font-bold">{totalToday.toFixed(2)}</div></div>
            <div className="p-2 bg-gray-50 rounded text-sm">This Month: <div className="font-bold">{monthSales.reduce((s,i)=>s+Number(i.total||0),0).toFixed(2)}</div></div>
            <div className="p-2 bg-gray-50 rounded text-sm">Outstanding: <div className="font-bold text-red-600">{outstanding.toFixed(2)}</div></div>
          </div>

          <div className="text-sm text-gray-600 mb-2">Recent Sales</div>
          {(sales || [])
            .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0,3)
            .map(s => (
            <div key={s._id} className="flex items-center justify-between text-sm py-1 border-b">
              <div>{s.customer?.name ? s.customer.name : `Sale ${s._id.substring(0,6)}`}</div>
              <div className="text-gray-500">{new Date(s.createdAt).toLocaleString()}</div>
              <div className="font-medium">{Number(s.total||0).toFixed(2)} {s.paid ? <span className="text-green-600">(paid)</span> : <span className="text-yellow-600">(pending)</span>}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
