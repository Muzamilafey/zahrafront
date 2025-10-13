import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

export default function POS(){
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useUI();
  const [inventory, setInventory] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ (async ()=>{
    setLoading(true);
    try{ const res = await axiosInstance.get('/pharmacy/inventory'); setInventory(res.data.drugs || []); }catch(e){ console.error(e); showToast({ message: 'Failed to load inventory', type: 'error' }); }
    setLoading(false);
  })(); }, []);

  const doSearch = async (q) => {
    try{ const res = await axiosInstance.get(`/pharmacy/inventory?q=${encodeURIComponent(q || '')}`); setInventory(res.data.drugs || []); }catch(e){ showToast({ message: 'Search failed', type: 'error' }); }
  };

  // debounced search: when searchQ changes, wait 350ms before performing search
  useEffect(()=>{
    const t = setTimeout(()=>{ doSearch(searchQ); }, 350);
    return ()=> clearTimeout(t);
  }, [searchQ]);

  useEffect(()=>{ (async ()=>{
    try{ const res = await axiosInstance.get('/pharmacy/sales'); setRecentSales(res.data.sales || []); }catch(e){ /* ignore */ }
  })(); }, []);

  const addToCart = (drug, qty=1) => {
    setCart(c => {
      const copy = [...c];
      const existing = copy.find(x=>String(x.drugId)===String(drug._id));
      if (existing) existing.quantity += qty; else copy.push({ drugId: drug._id, name: drug.name, unitPrice: drug.price || 0, quantity: qty });
      return copy;
    });
  };

  const removeFromCart = (drugId) => setCart(c=> c.filter(x=> String(x.drugId) !== String(drugId)));

  const total = cart.reduce((s,i)=> s + (i.quantity * (i.unitPrice||0)), 0);

  const checkout = async () => {
    try{
      const items = cart.map(i => ({ drugId: i.drugId, quantity: i.quantity }));
      const res = await axiosInstance.post('/pharmacy/sales', { items, paymentMethod, customer });
      showToast({ message: 'Sale completed', type: 'success' });
      // open receipt
      const id = res.data.sale._id;
      try{
        // Prefer the HTML thermal receipt (authorized request)
        const r = await axiosInstance.get(`/pharmacy/sales/${id}/receipt-html?print=1`, { responseType: 'text' });
        const w = window.open('', '_blank');
        if (w) {
          w.document.open();
          w.document.write(r.data);
          w.document.close();
          try{ w.focus(); }catch(err){}
          // attempt to print after a short delay to allow images to load
          setTimeout(()=>{ try{ w.print(); }catch(err){} }, 350);
        }
      }catch(e){
        // fallback: fetch PDF blob and open
        try{
          const pdf = await axiosInstance.get(`/pharmacy/sales/${id}/receipt`, { responseType: 'blob' });
          const blob = new Blob([pdf.data], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          const w2 = window.open(blobUrl, '_blank');
          try{ if (w2) w2.focus(); }catch(err){}
        }catch(err){ console.error('Failed to open receipt', err); }
      }
      setCart([]);
      // refresh inventory
      const inv = await axiosInstance.get('/pharmacy/inventory'); setInventory(inv.data.drugs || []);
      // refresh recent sales
      const sres = await axiosInstance.get('/pharmacy/sales'); setRecentSales(sres.data.sales || []);
    }catch(e){ console.error(e); showToast({ message: e?.response?.data?.message || 'Sale failed', type: 'error' }); }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pharmacy POS</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded p-4 shadow">
          <h3 className="font-semibold mb-2">Inventory</h3>
          {loading ? <div>Loading...</div> : (
            <div className="space-y-2 max-h-96 overflow-auto">
              <div className="mb-3">
                <input className="input" placeholder="Search drug by name" value={searchQ} onChange={e=>setSearchQ(e.target.value)} />
                <div className="mt-2 flex gap-2">
                  <button className="btn-outline" onClick={()=> doSearch(searchQ)}>Search</button>
                  <button className="btn-outline" onClick={()=> { setSearchQ(''); doSearch(''); }}>Clear</button>
                </div>
              </div>
              {inventory.map(d => (
                <div key={d._id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-gray-500">Stock: {d.stockLevel || 0} — Price: {d.price != null ? d.price : 'N/A'}</div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input type="number" min="1" defaultValue={1} className="input w-20" id={`qty-${d._id}`} />
                    <button className="btn-outline" onClick={()=>{
                      const val = Number(document.getElementById(`qty-${d._id}`).value || 1);
                      addToCart(d, val);
                    }}>Add</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded p-4 shadow">
          <h3 className="font-semibold mb-2">Cart</h3>
          <div className="mb-2">
            <input className="input" placeholder="Customer name (optional)" value={customer.name} onChange={e=>setCustomer(c=> ({ ...c, name: e.target.value }))} />
            <input className="input mt-2" placeholder="Customer phone (optional)" value={customer.phone} onChange={e=>setCustomer(c=> ({ ...c, phone: e.target.value }))} />
            <select className="input mt-2" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mpesa">Mpesa</option>
              <option value="credit">On account / Credit</option>
            </select>
          </div>
          {cart.length === 0 ? <div>No items</div> : (
            <div>
              <ul className="space-y-2">
                {cart.map(i=> (
                  <li key={i.drugId} className="flex justify-between items-center">
                    <div>{i.name} x{i.quantity}</div>
                    <div className="flex gap-2">
                      <div>{(i.unitPrice * i.quantity).toFixed(2)}</div>
                      <button className="btn-outline" onClick={()=>removeFromCart(i.drugId)}>Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 font-bold">Total: {total.toFixed(2)}</div>
              <div className="mt-4">
                <button className="btn-modern w-full" onClick={checkout}>Checkout</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded p-4 shadow">
        <h3 className="font-semibold mb-2">Recent Sales</h3>
        {recentSales.length === 0 ? <div>No recent sales</div> : (
          <div className="space-y-2">
            {recentSales.map(s => (
              <div key={s._id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <div className="font-medium">#{s._id.substring(0,8)} — {s.total.toFixed(2)} {s.paid ? <span className="text-green-600">(PAID)</span> : <span className="text-yellow-600">(PENDING)</span>}</div>
                  <div className="text-xs text-gray-500">{(s.customer && s.customer.name) ? s.customer.name : ''} {s.customer?.phone ? ` ${s.customer.phone}` : ''}</div>
                </div>
                <div className="flex gap-2">
                  {!s.paid && <button className="btn-outline" onClick={async ()=>{
                    try{ await axiosInstance.put(`/pharmacy/sales/${s._id}/mark-paid`); showToast({ message: 'Marked paid', type: 'success' }); const r = await axiosInstance.get('/pharmacy/sales'); setRecentSales(r.data.sales || []); }catch(e){ showToast({ message: 'Failed', type: 'error' }); }
                  }}>Mark Paid</button>}
                  <button className="btn-outline" onClick={async ()=>{
                    try{
                      const r = await axiosInstance.get(`/pharmacy/sales/${s._id}/receipt-html?print=1`, { responseType: 'text' });
                      const w = window.open('', '_blank');
                      if (w) {
                        w.document.open(); w.document.write(r.data); w.document.close();
                        try{ w.focus(); }catch(err){}
                        setTimeout(()=>{ try{ w.print(); }catch(err){} }, 350);
                      }
                    }catch(e){
                      try{ const pdf = await axiosInstance.get(`/pharmacy/sales/${s._id}/receipt`, { responseType: 'blob' }); const blob = new Blob([pdf.data], { type: 'application/pdf' }); const blobUrl = URL.createObjectURL(blob); window.open(blobUrl, '_blank'); }catch(err){ showToast({ message: 'Failed to open receipt', type: 'error' }); }
                    }
                  }}>Print</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
