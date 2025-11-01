import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';

export default function DischargeSummary(){
  const { id: patientId } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const [patient, setPatient] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  useEffect(()=>{ loadPatient(); }, [patientId]);

  const loadPatient = async ()=>{
    setLoading(true);
    try{
      const res = await axiosInstance.get(`/patients/${patientId}`);
      setPatient(res.data.patient);
      // pick admission invoice
      const inv = (res.data.invoices || res.data.invoices || []).find(i => i.type === 'admission') || null;
      setInvoice(inv);
    }catch(e){
      setToast({ message: e?.response?.data?.message || 'Failed to load patient', type: 'error' });
    }finally{ setLoading(false); }
  };

  const handleDischarge = async ()=>{
    try{
      setLoading(true);
      const res = await axiosInstance.post(`/patients/${patientId}/discharge`, { dischargeNotes: '' });
      setPatient(res.data.patient);
      setInvoice(res.data.invoice);
      setToast({ message: 'Patient discharged and invoice finalized', type: 'success' });
    }catch(e){
      setToast({ message: e?.response?.data?.message || 'Failed to discharge patient', type: 'error' });
    }finally{ setLoading(false); }
  };

  const handlePrint = ()=>{
    if (!invoice) return setToast({ message: 'No invoice available to print', type: 'error' });
    const url = `/api/billing/${invoice._id}/print`;
    window.open(url, '_blank');
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Discharge Summary / Invoice</h2>

      {!patient && <div className="bg-white rounded p-4">Patient not found.</div>}

      {patient && (
        <div className="bg-white rounded shadow p-4">
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <div><strong>Name:</strong> {patient.user?.name}</div>
              <div><strong>MRN:</strong> {patient.mrn}</div>
              <div><strong>Admitted At:</strong> {patient.admission?.admittedAt ? new Date(patient.admission.admittedAt).toLocaleString() : '-'}</div>
            </div>
            <div className="text-right">
              <div><strong>Ward:</strong> {patient.admission?.ward}</div>
              <div><strong>Bed:</strong> {patient.admission?.bed}</div>
              <div><strong>Discharged At:</strong> {patient.admission?.dischargedAt ? new Date(patient.admission.dischargedAt).toLocaleString() : '-'}</div>
            </div>
          </div>

          {invoice ? (
            <div>
              <h3 className="font-medium mb-2">Invoice: {invoice.invoiceNumber || invoice._id}</h3>
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left">Description</th>
                    <th className="border px-2 py-1 text-right">Qty</th>
                    <th className="border px-2 py-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems && invoice.lineItems.map(it => (
                    <tr key={it._id || it.description}>
                      <td className="border px-2 py-1">{it.description}</td>
                      <td className="border px-2 py-1 text-right">{it.qty || 1}</td>
                      <td className="border px-2 py-1 text-right">{(it.amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="border px-2 py-1 text-right font-bold">TOTAL</td>
                    <td className="border px-2 py-1"></td>
                    <td className="border px-2 py-1 text-right font-bold">{(invoice.amount || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex items-center gap-2">
                <button className="btn-brand" onClick={handlePrint}>Print Invoice (PDF)</button>
                {!patient.admission?.dischargedAt && (
                  <button className="btn-secondary" onClick={handleDischarge}>Discharge Patient</button>
                )}
                <button className="btn-outline" onClick={()=>navigate(-1)}>Close</button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 rounded">No admission invoice yet. You can discharge the patient to generate the invoice.</div>
          )}
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
