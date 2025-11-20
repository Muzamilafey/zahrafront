import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import Toast from '../../../components/ui/Toast';

export default function Procedures() {
  const { id: patientId } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newProcedure, setNewProcedure] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadProcedures();
    // eslint-disable-next-line
  }, [patientId]);

  const loadProcedures = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/patients/${patientId}/procedures`);
      setProcedures(res.data.procedures || []);
    } catch (error) {
      console.error('Failed to load procedures:', error);
      setToast({ message: error?.response?.data?.message || 'Failed to load procedures', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleNewProcedureChange = (e) => {
    const { name, value } = e.target;
    setNewProcedure(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewProcedure = async (e) => {
    e.preventDefault();
    if (!newProcedure.name || !newProcedure.date) {
      setToast({ message: 'Procedure name and date are required fields.', type: 'error' });
      return;
    }
    try {
      await axiosInstance.post(`/patients/${patientId}/procedures`, newProcedure);
      setToast({ message: 'Procedure added successfully', type: 'success' });
      setShowForm(false);
      setNewProcedure({ name: '', date: new Date().toISOString().split('T')[0], notes: '' });
      loadProcedures();
    } catch (error) {
      console.error('Failed to add procedure:', error);
      setToast({ message: error?.response?.data?.message || 'Failed to add procedure', type: 'error' });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Procedures Performed</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-brand">
          {showForm ? 'Cancel' : 'Add New Procedure'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleAddNewProcedure} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Name</label>
                <input
                  type="text"
                  name="name"
                  value={newProcedure.name}
                  onChange={handleNewProcedureChange}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={newProcedure.date}
                  onChange={handleNewProcedureChange}
                  className="input w-full"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={newProcedure.notes}
                onChange={handleNewProcedureChange}
                rows="3"
                className="input w-full"
              ></textarea>
            </div>
            <div className="text-right">
              <button type="submit" className="btn-brand">Save Procedure</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : procedures.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-4 text-gray-500">No procedures found for this patient.</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedure</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {procedures.map((p) => (
                <tr key={p._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{p.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(p.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{p.doctor?.user?.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{p.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
