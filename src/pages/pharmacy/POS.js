import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../contexts/UIContext';

export default function POS(){
  const { axiosInstance, logout } = useContext(AuthContext);
  const { showToast } = useUI();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsBlocked, setFsBlocked] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [receiptModal, setReceiptModal] = useState({ open: false, html: '', blobUrl: '', isPdf: false, id: null });
  const receiptIframeRef = useRef(null);
  const [lastReceipt, setLastReceipt] = useState(null);
  const printedReceiptIdsRef = useRef(new Set());

  useEffect(()=>{ (async ()=>{
    setLoading(true);
    try{ const res = await axiosInstance.get('/pharmacy/inventory'); setInventory(res.data.drugs || []); }catch(e){ console.error(e); showToast({ message: 'Failed to load inventory', type: 'error' }); }
    setLoading(false);
  })(); }, [axiosInstance, showToast]);

  // Request fullscreen on mount. Note: some browsers require user gesture
  // for requestFullscreen so this may be blocked; we detect that and show
  // a close/enter control for the user.
  useEffect(() => {
    const el = containerRef.current || document.documentElement;
    const tryEnter = async () => {
      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
          setIsFullscreen(true);
          setOverlayActive(true);
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
          setIsFullscreen(true);
          setOverlayActive(true);
        }
      } catch (err) {
        // blocked by browser — show manual control
        setFsBlocked(true);
        console.warn('Fullscreen request blocked or failed', err);
      }
    };
    tryEnter();

    const onFsChange = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      const active = !!fsEl;
      setIsFullscreen(active);
      // keep overlay in sync with native fullscreen state
      setOverlayActive(active);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  const enterOverlayFullscreen = async () => {
    const el = containerRef.current || document.documentElement;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
        setIsFullscreen(true);
        setOverlayActive(true);
        setFsBlocked(false);
        return;
      }
      if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
        setIsFullscreen(true);
        setOverlayActive(true);
        setFsBlocked(false);
        return;
      }
    } catch (err) {
      console.warn('Native fullscreen failed, using overlay', err);
    }
    setOverlayActive(true); // fallback overlay (not true fullscreen)
    setFsBlocked(false);
  };

  const doSearch = useCallback(async (q) => {
    try{ const res = await axiosInstance.get(`/pharmacy/inventory?q=${encodeURIComponent(q || '')}`); setInventory(res.data.drugs || []); }catch(e){ showToast({ message: 'Search failed', type: 'error' }); }
  }, [axiosInstance, showToast]);

  // debounced search: when searchQ changes, wait 350ms before performing search
  useEffect(()=>{
    const t = setTimeout(()=>{ doSearch(searchQ); }, 350);
    return ()=> clearTimeout(t);
  }, [searchQ, doSearch]);

  useEffect(()=>{ (async ()=>{
    try{ const res = await axiosInstance.get('/pharmacy/sales'); setRecentSales(res.data.sales || []); }catch(e){ /* ignore */ }
  })(); }, [axiosInstance]);

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
        // show receipt in modal instead of opening a new window
        const id = Date.now();
        setReceiptModal({ open: true, html: r.data, blobUrl: '', isPdf: false, id });
        setLastReceipt({ html: r.data, blobUrl: '', isPdf: false, id });
      }catch(e){
        // fallback: fetch PDF blob and show in modal
        try{
          const pdf = await axiosInstance.get(`/pharmacy/sales/${id}/receipt`, { responseType: 'blob' });
          const blob = new Blob([pdf.data], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          const id = Date.now();
          setReceiptModal({ open: true, html: '', blobUrl, isPdf: true, id });
          setLastReceipt({ html: '', blobUrl, isPdf: true, id });
        }catch(err){ console.error('Failed to load receipt', err); }
      }
      setCart([]);
      // refresh inventory
      const inv = await axiosInstance.get('/pharmacy/inventory'); setInventory(inv.data.drugs || []);
      // refresh recent sales
      const sres = await axiosInstance.get('/pharmacy/sales'); setRecentSales(sres.data.sales || []);
    }catch(e){ console.error(e); showToast({ message: e?.response?.data?.message || 'Sale failed', type: 'error' }); }
  };

  const closeReceiptModal = () => {
    if (receiptModal.blobUrl) {
      try { URL.revokeObjectURL(receiptModal.blobUrl); } catch (e) {}
    }
    setReceiptModal({ open: false, html: '', blobUrl: '', isPdf: false, id: null });
  };

  const printReceipt = () => {
    try {
      // Use a hidden iframe to print the original receipt HTML or PDF so the
      // print output matches the server-provided receipt formatting.
      if (!receiptModal) return;
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);
      if (receiptModal.isPdf && receiptModal.blobUrl) {
        printFrame.src = receiptModal.blobUrl;
      } else if (receiptModal.html) {
        printFrame.srcdoc = receiptModal.html;
      }
      printFrame.onload = () => {
        try { printFrame.contentWindow.focus(); printFrame.contentWindow.print(); } catch (err) { console.warn('print failed', err); }
        setTimeout(() => { try { document.body.removeChild(printFrame); } catch(e) {} }, 500);
      };
    } catch (err) {
      console.warn('Failed to print receipt from modal', err);
    }
  };

  // Auto-print when modal opens (once per receipt id)
  useEffect(() => {
    if (!receiptModal.open || !receiptModal.id) return;
    if (printedReceiptIdsRef.current.has(receiptModal.id)) return;
    // mark printed and auto print
    printedReceiptIdsRef.current.add(receiptModal.id);
    // delay slightly to allow modal iframe/content to render
    setTimeout(() => {
      printReceipt();
    }, 500);
  }, [receiptModal]);

  // Simple HTML -> React converter with basic sanitization (no scripts, no event attrs)
  function parseHtmlToReact(html) {
    if (!html) return null;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const walk = (node, idx) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return null;
        const tag = node.tagName.toLowerCase();
        const allowed = ['div','p','span','strong','b','em','table','thead','tbody','tr','th','td','ul','ol','li','img','br','hr','h1','h2','h3','h4','h5','h6'];
        if (!allowed.includes(tag)) return node.textContent || null;
        const children = [];
        node.childNodes.forEach((n, i) => { const c = walk(n, i); if (c !== null && c !== undefined) children.push(c); });
        const props = {};
        if (tag === 'img') {
          const src = node.getAttribute('src');
          if (src && (src.startsWith('http') || src.startsWith('data:') || src.startsWith('/'))) props.src = src;
          const alt = node.getAttribute('alt'); if (alt) props.alt = alt;
          props.style = { maxWidth: '100%' };
        }
        return React.createElement(tag, { key: idx, ...props }, children.length === 0 ? null : children);
      };
      const bodyChildren = [];
      doc.body.childNodes.forEach((n, i) => { const c = walk(n, i); if (c !== null && c !== undefined) bodyChildren.push(c); });
      return bodyChildren;
    } catch (err) {
      console.warn('Failed to parse receipt HTML to React', err);
      return React.createElement('div', { dangerouslySetInnerHTML: { __html: html } });
    }
  }

  const handleExitFullscreen = async () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.warn('Failed to exit fullscreen', err);
    }
  };

  const handleLogout = () => {
    try { logout(); } catch (e) { console.warn('Logout error', e); }
    try { navigate('/login', { replace: true }); } catch (e) { window.location.replace('/login'); }
  };

  return (
    <div className={`p-6 ${overlayActive ? 'fixed inset-0 z-50 bg-white overflow-auto' : ''}`} ref={containerRef}>
      {/* Left-side vertical toolbar (touch friendly) */}
      <div className="fixed left-4 top-1/3 flex flex-col gap-3 z-50">
        {!isFullscreen && fsBlocked && (
          <button
            aria-label="Enter Full Screen"
            title="Enter Full Screen"
            onClick={enterOverlayFullscreen}
            className="px-5 py-3 bg-green-600 text-white rounded-full shadow-lg text-lg touch-manipulation"
          >
            ⤢
          </button>
        )}

        {(isFullscreen || overlayActive) && (
          <button
            aria-label="Close Full Screen"
            title="Close Full Screen"
            onClick={() => { handleExitFullscreen(); setOverlayActive(false); }}
            className="px-5 py-3 bg-gray-200 text-gray-800 rounded-full shadow-lg text-lg"
          >
            ✕
          </button>
        )}

        <button
          aria-label="Logout"
          title="Logout"
          onClick={handleLogout}
          className="px-5 py-3 bg-red-600 text-white rounded-full shadow-lg text-lg"
        >
          ⎋
        </button>
      </div>
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
                        {/* Last receipt thumbnail */}
                        {lastReceipt && (
                          <div className="mt-3 flex items-center gap-3">
                            <div className="w-40 h-24 border rounded overflow-hidden">
                              {!lastReceipt.isPdf && lastReceipt.html ? (
                                <div className="w-full h-full overflow-hidden text-xs p-1">
                                  {parseHtmlToReact(lastReceipt.html).slice ? parseHtmlToReact(lastReceipt.html).slice(0,1) : parseHtmlToReact(lastReceipt.html)}
                                </div>
                              ) : lastReceipt.blobUrl ? (
                                <iframe title="last-receipt-thumb" src={lastReceipt.blobUrl} className="w-full h-full border-0" />
                              ) : null}
                            </div>
                            <div>
                              <button className="btn-outline" onClick={() => setReceiptModal({ open: true, html: lastReceipt.html || '', blobUrl: lastReceipt.blobUrl || '', isPdf: !!lastReceipt.isPdf, id: lastReceipt.id })}>View Last Receipt</button>
                            </div>
                          </div>
                        )}
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
      {/* Receipt modal (shows HTML via srcDoc or PDF via blob URL) */}
      {receiptModal.open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center" onClick={closeReceiptModal}>
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="bg-white rounded shadow-lg z-70 max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">Receipt</div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 bg-gray-200 rounded" onClick={printReceipt}>Print</button>
                <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={closeReceiptModal}>Close</button>
              </div>
            </div>
            <div className="p-4 h-[70vh] overflow-auto">
              {!receiptModal.isPdf && (
                <div className="prose max-w-none">{parseHtmlToReact(receiptModal.html)}</div>
              )}
              {receiptModal.isPdf && (
                <iframe ref={receiptIframeRef} title="receipt-pdf" src={receiptModal.blobUrl} className="w-full h-full border" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
