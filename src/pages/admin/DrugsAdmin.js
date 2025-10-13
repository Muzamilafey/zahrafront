import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

export default function DrugsAdmin(){
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useUI();
  const [drugs, setDrugs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    (async ()=>{
      try{
        const res = await axiosInstance.get('/pharmacy/inventory');
        setDrugs(res.data.drugs || []);
      }catch(e){ console.error(e); showToast({ message: 'Failed to load drugs', type: 'error' }); }
    })();
  }, []);

  const save = async (id, price, stock) => {
    setSaving(true);
    try{
      const res = await axiosInstance.put(`/pharmacy/drugs/${id}`, { price, stockLevel: stock });
      setDrugs(prev => prev.map(d => d._id === id ? res.data.drug : d));
      setEditing(null);
      showToast({ message: 'Saved', type: 'success' });
    }catch(e){ console.error(e); showToast({ message: e?.response?.data?.message || 'Failed to save', type: 'error' }); }
    finally{ setSaving(false); }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Drugs Inventory (Admin)</h1>
      <div className="bg-white p-4 rounded shadow">
        {drugs.length === 0 ? <div>No drugs yet</div> : (
          <table className="table-auto w-full text-sm">
            <thead><tr><th>Name</th><th>Batch</th><th>Expiry</th><th>Price</th><th>Stock</th><th/></tr></thead>
            <tbody>
              {drugs.map(d => (
                <tr key={d._id} className="border-t">
                  <td className="px-2 py-1">{d.name}</td>
                  <td className="px-2 py-1">{d.batchNumber}</td>
                  <td className="px-2 py-1">{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : '-'}</td>
                  <td className="px-2 py-1">{editing === d._id ? (
                    <input type="number" className="input" defaultValue={d.price || 0} id={`price-${d._id}`} />
                  ) : (d.price != null ? d.price : '-')}</td>
                  <td className="px-2 py-1">{editing === d._id ? (
                    <input type="number" className="input" defaultValue={d.stockLevel || 0} id={`stock-${d._id}`} />
                  ) : (d.stockLevel != null ? d.stockLevel : '-')}</td>
                  <td className="px-2 py-1">
                    {editing === d._id ? (
                      <div className="flex gap-2">
                        <button className="btn-outline" onClick={()=>setEditing(null)}>Cancel</button>
                        <button className="btn-modern" onClick={()=>{
                          const price = Number(document.getElementById(`price-${d._id}`).value || 0);
                          const stock = Number(document.getElementById(`stock-${d._id}`).value || 0);
                          save(d._id, price, stock);
                        }}>{saving ? 'Saving...' : 'Save'}</button>
                      </div>
                    ) : (
                      <button className="btn-modern" onClick={()=>setEditing(d._id)}>Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
