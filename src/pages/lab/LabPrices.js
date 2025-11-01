import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function LabPrices(){
  const { axiosInstance } = useContext(AuthContext);
  const [prices, setPrices] = useState({});
  const [editing, setEditing] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ load(); },[]);
  async function load(){
    setLoading(true);
    try{
      const res = await axiosInstance.get('/labs/prices');
      setPrices(res.data.prices || {});
    }catch(e){ console.error(e); }
    setLoading(false);
  }

  async function save(testType){
    const value = Number(editing[testType]);
    try{
      const res = await axiosInstance.post('/labs/prices', { testType, price: value });
      setPrices(res.data.prices || {});
      setEditing(prev=>{ const c = {...prev}; delete c[testType]; return c; });
    }catch(e){ console.error(e); }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Lab Tests Prices</h2>
      {loading ? <div>Loading...</div> : (
        <div className="space-y-4">
          {Object.keys(prices).length === 0 && <div className="text-sm text-gray-500">No prices configured yet.</div>}
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left"><th>Test</th><th>Price</th><th></th></tr>
            </thead>
            <tbody>
              {Object.entries(prices).map(([k,v])=> (
                <tr key={k} className="border-t">
                  <td>{k}</td>
                  <td>
                    <input type="number" value={editing[k] ?? v} onChange={e=>setEditing(prev=>({...prev,[k]:e.target.value}))} className="p-1 border rounded w-32" />
                  </td>
                  <td>
                    <button onClick={()=>save(k)} className="px-3 py-1 bg-brand-600 text-white rounded">Save</button>
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
