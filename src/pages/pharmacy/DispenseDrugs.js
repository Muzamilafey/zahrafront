// zahrafront/src/pages/pharmacy/DispenseDrugs.js
import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';

export default function DispenseDrugs() {
  const { axiosInstance, user } = useContext(AuthContext);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const knownIdsRef = useRef(new Set());
  const [highlightIds, setHighlightIds] = useState(new Set());
  const [modalRequest, setModalRequest] = useState(null);

  const fetchPendingRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/pharmacy/dispense/pending');
      setPendingRequests(res.data.requests);
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
      setError(err.response?.data?.message || 'Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  // Listen for real-time pharmacy internal requests (SSE dispatched as window event in AuthContext)
  useEffect(() => {
    const handler = (e) => {
      // refresh list when a new internal request arrives
      try {
        const detail = e?.detail || {};
        // If event provides an id, optimistically highlight it
        if (detail && detail.internalRequest && detail.internalRequest._id) {
          setHighlightIds(h => new Set([...h, detail.internalRequest._id]));
          setTimeout(() => setHighlightIds(h => {
            const copy = new Set(h); copy.delete(detail.internalRequest._id); return copy;
          }), 6000);
        }
        fetchPendingRequests();
      } catch (err) { /* ignore */ }
    };
    window.addEventListener('pharmacy:new-internal-request', handler);
    return () => window.removeEventListener('pharmacy:new-internal-request', handler);
  }, [fetchPendingRequests]);

  const handleDispense = async (requestId, requestType) => {
    if (!window.confirm('Are you sure you want to mark this request as dispensed?')) {
      return;
    }
    try {
      await axiosInstance.put(`/pharmacy/dispense/${requestId}`, { type: requestType });
      setToast({ message: 'Request marked as dispensed successfully!', type: 'success' });
      fetchPendingRequests(); // Refresh the list
    } catch (err) {
      console.error('Failed to dispense request:', err);
      setToast({ message: err.response?.data?.message || 'Failed to dispense request', type: 'error' });
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(pendingRequests.map(r => r._id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDispense = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to mark ${selectedIds.size} request(s) as dispensed?`)) return;
    setBulkLoading(true);
    const selected = pendingRequests.filter(r => selectedIds.has(r._id));
    const results = { success: 0, failed: 0 };
    for (const req of selected) {
      try {
        await axiosInstance.put(`/pharmacy/dispense/${req._id}`, { type: req.type });
        results.success += 1;
      } catch (err) {
        console.error('Bulk dispense failed for', req._id, err);
        results.failed += 1;
      }
    }
    setBulkLoading(false);
    setToast({ message: `Bulk dispense completed: ${results.success} success, ${results.failed} failed.`, type: results.failed === 0 ? 'success' : 'error' });
    clearSelection();
    fetchPendingRequests();
  };

  if (loading) {
    return <div className="p-8 text-center">Loading pending requests...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Dispense Requested Drugs</h2>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" onChange={(e) => e.target.checked ? selectAll() : clearSelection()} checked={selectedIds.size === pendingRequests.length && pendingRequests.length>0} />
            <span className="text-sm">Select All</span>
          </label>
          <button className="btn-outline text-sm" onClick={() => { clearSelection(); }} disabled={selectedIds.size===0}>Clear</button>
          <button className="btn-brand text-sm" onClick={handleBulkDispense} disabled={bulkLoading || selectedIds.size===0}>{bulkLoading ? 'Processing...' : `Dispense (${selectedIds.size})`}</button>
        </div>
        <div className="text-sm text-gray-500">Total pending: {pendingRequests.length}</div>
      </div>

      {pendingRequests.length === 0 ? (
        <p className="text-gray-600">No pending drug requests to dispense.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {pendingRequests.map(request => {
            const isSelected = selectedIds.has(request._id);
            const isNew = highlightIds.has(request._id) || (knownIdsRef.current && !knownIdsRef.current.has(request._id) && pendingRequests.length>0);
            return (
              <div key={`${request.type}-${request._id}`} className={`bg-white p-4 rounded-lg shadow-sm border ${isNew ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-200'}`}>
                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(request._id)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold capitalize">{request.type} Request <span className="text-sm text-gray-500">(No: {request.requestNumber})</span></h3>
                      <div className="flex items-center gap-2">
                        <button className="btn-ghost text-sm" onClick={() => setModalRequest(request)}>Quick View</button>
                        <button className="btn-outline text-sm" onClick={() => handleDispense(request._id, request.type)} disabled={!user || !['pharmacist', 'admin', 'nurse'].includes(user.role)}>Dispense</button>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-1"><strong>Patient:</strong> {request.patientName} {request.mrn ? `(MRN: ${request.mrn})` : ''}</p>
                    <p className="text-gray-600 text-sm mb-3"><strong>Requested At:</strong> {new Date(request.requestedAt).toLocaleString()} {request.requestedBy ? ` • By ${request.requestedBy}` : ''}</p>

                    <div className="bg-gray-50 p-3 rounded">
                      <h4 className="font-medium text-gray-800 mb-1">Drugs</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {request.drugs.map((drug, idx) => (
                          <li key={idx}>
                            <span className="font-medium">{drug.name}</span> — Qty: {drug.quantity} {drug.instructions ? <span className="text-xs text-gray-500">({drug.instructions})</span> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
      {/* Quick view modal */}
      {modalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setModalRequest(null)}>
          <div className="absolute inset-0 bg-black opacity-30" />
          <div className="bg-white p-6 rounded shadow-lg z-10 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Request Quick View</h3>
              <button className="btn-ghost" onClick={() => setModalRequest(null)}>Close</button>
            </div>
            <div className="mb-3">
              <p className="text-sm"><strong>Type:</strong> {modalRequest.type}</p>
              <p className="text-sm"><strong>Request No:</strong> {modalRequest.requestNumber}</p>
              <p className="text-sm"><strong>Patient:</strong> {modalRequest.patientName} {modalRequest.mrn ? `(MRN: ${modalRequest.mrn})` : ''}</p>
              {modalRequest.requestedBy && <p className="text-sm"><strong>Requested By:</strong> {modalRequest.requestedBy}</p>}
              <p className="text-sm"><strong>Requested At:</strong> {new Date(modalRequest.requestedAt).toLocaleString()}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Drugs</h4>
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-gray-50"><th className="p-2 text-left">Name</th><th className="p-2 text-left">Qty</th><th className="p-2">Instructions</th></tr>
                </thead>
                <tbody>
                  {modalRequest.drugs.map((d, i) => (
                    <tr key={i} className="border-t"><td className="p-2">{d.name}</td><td className="p-2">{d.quantity}</td><td className="p-2">{d.instructions || '-'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setModalRequest(null)}>Close</button>
              <button className="btn-brand" onClick={() => { handleDispense(modalRequest._id, modalRequest.type); setModalRequest(null); }}>Dispense</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
