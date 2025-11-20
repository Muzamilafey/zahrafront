import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import Toast from '../../../components/ui/Toast';

export default function Allergies() {
  const { id: patientId } = useParams();
  const { axiosInstance } = useContext(AuthContext);
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newAllergy, setNewAllergy] = useState({
    allergen: '',
    reaction: '',
    severity: 'mild',
    notes: ''
  });

  useEffect(() => {
    loadAllergies();
    // eslint-disable-next-line
  }, [patientId]);

  const loadAllergies = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/patients/${patientId}/allergies`);
      setAllergies(res.data.allergies || []);
    } catch (error) {
      console.error('Failed to load allergies:', error);
      setToast({ message: error?.response?.data?.message || 'Failed to load allergies', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleNewAllergyChange = (e) => {
    const { name, value } = e.target;
    setNewAllergy(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewAllergy = async (e) => {
    e.preventDefault();
    if (!newAllergy.allergen || !newAllergy.reaction) {
      setToast({ message: 'Allergen and reaction are required fields.', type: 'error' });
      return;
    }
    try {
      await axiosInstance.post(`/patients/${patientId}/allergies`, newAllergy);
      setToast({ message: 'Allergy added successfully', type: 'success' });
      setShowForm(false);
      setNewAllergy({ allergen: '', reaction: '', severity: 'mild', notes: '' });
      loadAllergies();
    } catch (error) {
      console.error('Failed to add allergy:', error);
      setToast({ message: error?.response?.data?.message || 'Failed to add allergy', type: 'error' });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Patient Allergies</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-brand">
          {showForm ? 'Cancel' : 'Add New Allergy'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleAddNewAllergy} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergen</label>
                <input
                  type="text"
                  name="allergen"
                  value={newAllergy.allergen}
                  onChange={handleNewAllergyChange}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reaction</label>
                <input
                  type="text"
                  name="reaction"
                  value={newAllergy.reaction}
                  onChange={handleNewAllergyChange}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  name="severity"
                  value={newAllergy.severity}
                  onChange={handleNewAllergyChange}
                  className="input w-full"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={newAllergy.notes}
                onChange={handleNewAllergyChange}
                rows="3"
                className="input w-full"
              ></textarea>
            </div>
            <div className="text-right">
              <button type="submit" className="btn-brand">Save Allergy</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : allergies.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-4 text-gray-500">No allergies found for this patient.</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allergen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reaction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allergies.map((a) => (
                <tr key={a._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{a.allergen}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{a.reaction}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{a.severity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{a.notes}</td>
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
