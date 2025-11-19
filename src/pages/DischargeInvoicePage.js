import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import DischargeWithInvoice from '../components/DischargeWithInvoice';
import Spinner from '../components/Spinner';

const DischargeInvoicePage = () => {
  const { id } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Discharge Summary
        const summaryResponse = await axiosInstance.get(`/discharge/${id}`);
        const summaryData = summaryResponse.data;
        setSummary(summaryData);

        if (summaryData && summaryData.patient && summaryData.admission) {
          const patientId = summaryData.patient._id;
          const admissionId = summaryData.admission;

          // 2. Fetch Invoices for the patient
          const invoiceResponse = await axiosInstance.get(`/billing?patientId=${patientId}`);
          const invoices = invoiceResponse.data.invoices || (Array.isArray(invoiceResponse.data) ? invoiceResponse.data : []);
          
          // 3. Find the correct invoice
          const relatedInvoice = invoices.find(inv => inv.admissionId === admissionId);
          setInvoice(relatedInvoice);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, axiosInstance]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!summary) {
    return <div className="p-6">Discharge summary not found.</div>;
  }

  return (
    <div className="p-4">
      <DischargeWithInvoice patient={summary.patient} summary={summary} invoice={invoice} />
    </div>
  );
};

export default DischargeInvoicePage;
