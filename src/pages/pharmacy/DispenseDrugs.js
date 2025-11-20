import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';
import { format } from 'date-fns';

export default function DispenseDrugs() {
  const { axiosInstance } = useContext(AuthContext);
  const [dispenseRequests, setDispenseRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchDispenseRequests();
  }, []);

  const fetchDispenseRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/dispense/requests');
      setDispenseRequests(response.data.data);
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to fetch dispense requests.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDispenseDrug = async (prescriptionId, drugId, quantityToDispense) => {
    if (!window.confirm(`Dispense ${quantityToDispense} unit(s) of this drug?`)) return;
    try {
      setLoading(true);
      await axiosInstance.put(`/dispense/prescription/${prescriptionId}/drug/${drugId}`, { quantityToDispense });
      setToast({ type: 'success', message: 'Drug dispensed successfully!' });
      fetchDispenseRequests(); // Refresh the list
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to dispense drug.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDispenseAll = async (prescriptionId) => {
    if (!window.confirm('Dispense all drugs for this prescription?')) return;
    try {
      setLoading(true);
      await axiosInstance.put(`/dispense/prescription/${prescriptionId}/all`);
      setToast({ type: 'success', message: 'All drugs dispensed successfully!' });
      fetchDispenseRequests(); // Refresh the list
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to dispense all drugs.' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && dispenseRequests.length === 0) return <div className="p-6">Loading dispense requests...</div>;
  if (dispenseRequests.length === 0 && !loading) return <div className="p-6 text-gray-600">No pending dispense requests.</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Dispense Drugs</h2>

      <div className="space-y-6">
        {dispenseRequests.map((prescription) => (
          <div key={prescription._id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-medium">Prescription #{prescription.prescriptionNumber}</h3>
                <p className="text-gray-600">Patient: {prescription.appointment?.patient?.user?.name || 'N/A'}</p>
                <p className="text-gray-600">Doctor: {prescription.appointment?.doctor?.user?.name || 'N/A'}</p>
                <p className="text-gray-600">Requested On: {format(new Date(prescription.createdAt), 'PPP p')}</p>
              </div>
              <button
                onClick={() => handleDispenseAll(prescription._id)}
                className="btn-brand"
                disabled={loading || prescription.status === 'dispensed'}
              >
                {loading ? 'Dispensing All...' : 'Dispense All'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prescription.drugs.map((drugEntry) => (
                    <tr key={drugEntry._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{drugEntry.drug?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drugEntry.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drugEntry.instructions || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drugEntry.drug?.stockLevel || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDispenseDrug(prescription._id, drugEntry.drug._id, drugEntry.quantity)}
                          className="text-green-600 hover:text-green-900"
                          disabled={loading || drugEntry.quantity === (drugEntry.dispensedQuantity || 0)}
                        >
                          Dispense ({drugEntry.quantity - (drugEntry.dispensedQuantity || 0)})
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}