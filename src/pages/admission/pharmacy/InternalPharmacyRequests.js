import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../../../contexts/AuthContext';
import inpatientApi from '../../../../services/inpatientApi';

export default function InternalPharmacyRequests() {
  const { id: patientId } = useParams();
  const { axiosInstance } = useContext(AuthContext);

  const [patient, setPatient] = useState(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [quantityPrescribed, setQuantityPrescribed] = useState('');
  const [prescriptionTerm, setPrescriptionTerm] = useState('QID');
  const [duration, setDuration] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dischargeDrug, setDischargeDrug] = useState('no');
  const [added, setAdded] = useState([]);

  useEffect(() => {
    // load patient header info
    const load = async () => {
      try {
        const res = await axiosInstance.get(`/patients/${patientId}`);
        setPatient(res.data.patient || null);
      } catch (e) { /* ignore */ }
    };
    if (patientId) load();
  }, [patientId, axiosInstance]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const q = (search || '').trim();
      if (!q) return setResults([]);
      try {
        const r = await axiosInstance.get(`/pharmacy/inventory?q=${encodeURIComponent(q)}`);
        setResults(r.data.drugs || []);
      } catch (e) { setResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [search, axiosInstance]);

  const selectDrug = (d) => {
    setSelectedDrug(d);
    setSearch(d.name || '');
    setResults([]);
  };

  const addMedication = async () => {
    if (!selectedDrug || !quantityPrescribed) return alert('Select medicine and quantity');
    const qty = Number(quantityPrescribed);
    if (!qty || qty <= 0) return alert('Invalid quantity');

    const item = {
      id: selectedDrug._id,
      name: selectedDrug.name,
      batch: selectedDrug.batchNumber || '-',
      instructions: instructions || prescriptionTerm,
      duration: duration || '-',
      discharge: dischargeDrug === 'yes' ? 'Yes' : 'No',
      cost: Number(selectedDrug.price || 0),
      qty,
      lineTotal: (Number(selectedDrug.price || 0) * qty)
    };

    // Optimistically add to UI
    setAdded(prev => [...prev, { ...item, date: new Date().toISOString() }]);

    // send to backend to bill and deduct stock
    try {
      await axiosInstance.post('/inpatient/internal-pharmacy', { patientId, drugId: selectedDrug._id, qty });
    } catch (e) {
      console.error('Failed to create internal pharmacy request', e);
      alert(e.response?.data?.message || 'Failed to add medication to inpatient bill');
    }

    // reset fields
    setSelectedDrug(null);
    setSearch('');
    setQuantityPrescribed('');
    setPrescriptionTerm('QID');
    setDuration('');
    setInstructions('');
    setDischargeDrug('no');
  };

  const removeItem = (index) => {
    setAdded(prev => prev.filter((_, i) => i !== index));
  };

  const grandTotal = added.reduce((s, it) => s + (Number(it.lineTotal || 0)), 0).toFixed(2);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Pharmacy Requests</h2>

      <div className="bg-white p-6 rounded shadow">
        <div className="mb-6">
          <div className="font-medium">INPATIENT'S FILE NO : <span className="font-semibold">{patient?.hospitalId || '-'}</span></div>
          <div className="font-medium">PATIENT'S NAME : <span className="font-semibold">{patient?.user?.name || (patient && `${patient.firstName} ${patient.lastName}`) || '-'}</span></div>
          <div className="font-medium">PATIENT'S AGE : <span className="font-semibold">{patient?.age || '-'}</span></div>
          <div className="font-medium">PATIENT'S PAYMENT DETAILS : <span className="font-semibold">{patient?.paymentMode || '-'}</span></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search Medicine</label>
            <input className="input w-full" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search By Medicine Name" />
            {results.length > 0 && (
              <ul className="border mt-1 bg-white max-h-40 overflow-auto">
                {results.map(d => (
                  <li key={d._id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={()=>selectDrug(d)}>{d.name} — {d.batchNumber || ''}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity Available</label>
            <input className="input w-full" value={selectedDrug ? (selectedDrug.stockLevel || 0) : ''} disabled />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity Prescribed</label>
            <input className="input w-full" value={quantityPrescribed} onChange={e=>setQuantityPrescribed(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Prescription Term</label>
            <select className="input w-full" value={prescriptionTerm} onChange={e=>setPrescriptionTerm(e.target.value)}>
              <option>QID</option>
              <option>BID</option>
              <option>TDS</option>
              <option>OD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (Number of days)</label>
            <input className="input w-full" value={duration} onChange={e=>setDuration(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Instructions</label>
            <input className="input w-full" value={instructions} onChange={e=>setInstructions(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Discharge Drug?</label>
            <select className="input w-full" value={dischargeDrug} onChange={e=>setDischargeDrug(e.target.value)}>
              <option value="no">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <button className="btn-brand" onClick={addMedication}>Add Medication</button>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Added Medicines</h3>
          <div className="overflow-auto">
            <table className="min-w-full table-auto border-collapse border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">DATE</th>
                  <th className="border px-2 py-1">DESCRIPTION</th>
                  <th className="border px-2 py-1">INSTRUCTIONS</th>
                  <th className="border px-2 py-1">BATCH NO</th>
                  <th className="border px-2 py-1">DURATION (NUMBER OF DAYS)</th>
                  <th className="border px-2 py-1">DISCHARGE DRUG?</th>
                  <th className="border px-2 py-1">COST</th>
                  <th className="border px-2 py-1">QUANTITY</th>
                  <th className="border px-2 py-1">LINE TOTAL</th>
                  <th className="border px-2 py-1">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {added.map((it, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1 text-sm">{new Date(it.date).toLocaleString()}</td>
                    <td className="border px-2 py-1 text-sm">{it.name}</td>
                    <td className="border px-2 py-1 text-sm">{it.instructions}</td>
                    <td className="border px-2 py-1 text-sm">{it.batch}</td>
                    <td className="border px-2 py-1 text-sm">{it.duration}</td>
                    <td className="border px-2 py-1 text-sm">{it.discharge}</td>
                    <td className="border px-2 py-1 text-sm">{Number(it.cost || 0).toFixed(2)}</td>
                    <td className="border px-2 py-1 text-sm">{it.qty}</td>
                    <td className="border px-2 py-1 text-sm">{Number(it.lineTotal || 0).toFixed(2)}</td>
                    <td className="border px-2 py-1 text-sm"><button className="text-red-500" onClick={()=>removeItem(idx)}>Remove</button></td>
                  </tr>
                ))}
                {added.length === 0 && (
                  <tr><td className="p-4" colSpan={10}>No medicines added</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td className="border px-2 py-1 font-semibold" colSpan={8}>GRAND TOTAL</td>
                  <td className="border px-2 py-1 font-semibold">{grandTotal}</td>
                  <td className="border px-2 py-1"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
