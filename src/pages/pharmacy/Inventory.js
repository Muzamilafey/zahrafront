import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

export default function Inventory(){
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useUI();
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let mounted = true;
    const load = async ()=>{
      setLoading(true);
      try{
        const res = await axiosInstance.get('/pharmacy/inventory');
        if (!mounted) return;
        setDrugs(res.data.drugs || []);
      }catch(e){
        console.error('Failed to load inventory', e);
        showToast && showToast({ message: 'Failed to load inventory', type: 'error' });
      }finally{ if (mounted) setLoading(false); }
    };
    load();
    return ()=> { mounted = false; };
  }, [axiosInstance, showToast]);

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Inventory</h2>
      {loading ? <div>Loading...</div> : (
        <div className="space-y-3">
          {drugs.length === 0 ? <div className="text-sm text-gray-500">No drugs found.</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {drugs.map(d => (
                <div key={d._id} className={`p-4 border rounded ${d.stockLevel !== undefined && d.stockLevel <= (d.reorderLevel || 5) ? 'border-red-200 bg-red-50' : 'bg-white'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-gray-500">{d.form || ''} {d.strength ? `• ${d.strength}` : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{d.stockLevel || 0}</div>
                      <div className="text-xs text-gray-500">In stock</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="btn-outline">Adjust</button>
                    <button className="btn-outline">Reorder</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
