import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function PatientDischargePage() {
  const { id: patientId } = useParams();
  const { axiosInstance, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPatient = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/patients/${patientId}`);
      const p = res.data.patient || res.data;
      setPatient(p);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load patient');
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, patientId]);

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  const goToDischargeSummary = () => navigate(`/patients/${patientId}/discharge-summary`);
  const goToBillingForPatient = () => navigate(`/billing?patientId=${encodeURIComponent(patientId)}`);

  const handleDischargeNow = async () => {
    if (!window.confirm('Discharge this patient now? This will finalize the admission and may generate an invoice.')) return;
    try {
      const res = await axiosInstance.post(`/patients/${patientId}/discharge`, { dischargeNotes: '' });
      // If an invoice was returned, open it
      const invoiceId = res?.data?.invoice?._id || res?.data?.invoiceId || res?.data?._id || res?.data?.id;
      if (invoiceId) {
        navigate(`/billing/${invoiceId}`);
        return;
      }
      // otherwise go to billing list for the patient
      navigate(`/billing?patientId=${encodeURIComponent(patientId)}`);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to discharge patient');
    }
  };

  if (loading) return <div className="p-6">Loading patient...</div>;
  if (error) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 p-4 text-red-700">{error}</div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Discharge — {patient.user?.name || `${patient.firstName} ${patient.lastName}`}</h1>
            <div className="text-sm text-gray-600 mt-1">MRN: {patient.mrn || patient.hospitalId || '-'}</div>
            <div className="text-sm text-gray-600">Ward / Bed: {patient.admission?.ward || '-'} / {patient.admission?.bed || '-'}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Status</div>
            <div className={`font-semibold ${patient.admission?.isAdmitted ? 'text-green-600' : 'text-gray-600'}`}>{patient.admission?.isAdmitted ? 'Admitted' : 'Discharged'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={goToDischargeSummary} className="col-span-1 md:col-span-1 px-4 py-3 bg-blue-600 text-white rounded">Discharge Summary</button>
        <button onClick={goToBillingForPatient} className="col-span-1 md:col-span-1 px-4 py-3 bg-indigo-600 text-white rounded">Invoice / Billing</button>
        {user && user.role === 'admin' && patient?.admission?.isAdmitted !== false && (
          <button onClick={handleDischargeNow} className="col-span-1 md:col-span-1 px-4 py-3 bg-red-600 text-white rounded">Discharge Now</button>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/patients/${patientId}`)} className="btn-outline">View Patient</button>
          <button onClick={() => navigate(`/patients/${patientId}/inpatient-history`)} className="btn-outline">Admission History</button>
        </div>
      </div>
    </div>
  );
}
