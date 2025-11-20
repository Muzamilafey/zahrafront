import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import { FaArrowLeft, FaEye, FaPrint } from 'react-icons/fa';

export default function MealBills() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const [patient, setPatient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load patient details
      const patientRes = await axiosInstance.get(`/patients/${patientId}`);
      setPatient(patientRes.data.patient);

      // Load invoices for this patient and filter for meal bills
      const invoiceRes = await axiosInstance.get(`/patients/${patientId}/meal-bills`);
      setInvoices(invoiceRes.data.invoices || []);
    } catch (err) {
      console.error('Failed to load meal bills:', err);
      setError(err?.response?.data?.message || 'Failed to load meal bills');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-brand-600 hover:text-brand-700"
        >
          <FaArrowLeft /> Back
        </button>
        <div className="text-gray-500">Loading meal bills...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-brand-600 hover:text-brand-700"
        >
          <FaArrowLeft /> Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          {error || 'Patient not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-brand-600 hover:text-brand-700"
        >
          <FaArrowLeft /> Back
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Meal Bills</h1>
        <p className="text-gray-600 mt-2">Patient: {patient.user?.name}</p>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No meal bills found for this patient
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Invoice #</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium">#{inv.invoiceNumber || inv._id.slice(-6)}</td>
                    <td className="px-6 py-3 text-sm">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-sm">{inv.description || inv.type || 'Meal Bill'}</td>
                    <td className="px-6 py-3 text-sm font-medium text-right">Ksh {(inv.amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                        inv.status === 'partially_paid' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {(inv.status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/billing/${inv._id}`}
                          className="text-brand-600 hover:text-brand-700 flex items-center gap-1"
                        >
                          <FaEye /> View
                        </Link>
                        <a
                          href={`/api/billing/${inv._id}/print`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-700 flex items-center gap-1"
                        >
                          <FaPrint /> Print
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
