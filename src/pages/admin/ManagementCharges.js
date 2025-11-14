import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

export default function ManagementCharges() {
  const { user, axiosInstance } = useContext(AuthContext);
  const [charges, setCharges] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newChargeCategory, setNewChargeCategory] = useState('');
  const [newChargeName, setNewChargeName] = useState('');
  const [newChargeAmount, setNewChargeAmount] = useState('');

  // Define fee categories with their items
  const feeCategories = {
    'registration': {
      title: '1. Registration & File Opening Fees',
      items: [
        'Patient Registration Fee',
        'Outpatient File Opening Fee',
        'Emergency Registration Fee',
        'Re-activation of Old File'
      ]
    },
    'admission': {
      title: '2. Admission & Bed Administration Fees',
      items: [
        'Admission Fee',
        'Bed Reservation Fee',
        'Ward Administration Fee',
        'Nursing Station Charge',
        'Bed Management Fee',
        'Overnight Stay Administrative Charge'
      ]
    },
    'consultation': {
      title: '3. Consultation & Review Fees',
      items: [
        'Initial Consultation Fee',
        'Review Consultation Fee',
        'Specialist Consultation Fee',
        'Emergency Consultation Fee',
        'After-hours Consultation Fee'
      ]
    },
    'procedure': {
      title: '4. Procedure & Operation Administration',
      items: [
        'Theatre Administration Fee',
        'Anaesthesia Administration Fee',
        'Pre-operative Management Fee',
        'Post-operative Care Administration',
        'Surgical Consumables Management Fee'
      ]
    },
    'laboratory': {
      title: '5. Laboratory & Radiology Administration Fees',
      items: [
        'Lab Handling Fee',
        'Specimen Collection Fee',
        'Specimen Transport Fee',
        'Radiology Processing Fee',
        'Report Interpretation Admin Fee'
      ]
    },
    'pharmacy': {
      title: '6. Pharmacy Management Fees',
      items: [
        'Prescription Processing Fee',
        'Medication Dispensing Fee',
        'Drug Administration Fee (Injection Administration Charge)',
        'Pharmacy Handling Charge'
      ]
    },
    'imaging': {
      title: '7. Imaging & Diagnostic Admin Fees',
      items: [
        'Ultrasound Administration Fee',
        'X-ray Administration Fee',
        'CT/MRI Administration Fee',
        'ECG Processing Fee'
      ]
    },
    'nursing': {
      title: '8. Nursing & Ward Management Fees',
      items: [
        'Daily Nursing Management Fee',
        'Monitoring Fee',
        'Wound Care Management Fee',
        'Dressing Administration Fee'
      ]
    },
    'emergency': {
      title: '9. Emergency Services Admin Fees',
      items: [
        'Emergency Room Admin Fee',
        'Triage Fee',
        'Critical Care Management Fee',
        'Trauma Care Admin Fee'
      ]
    },
    'insurance': {
      title: '10. Insurance Processing & Documentation',
      items: [
        'Insurance Handling Fee',
        'Claim Processing Fee',
        'Pre-authorization Admin Fee',
        'Medical Report Fee',
        'Discharge Summary Report Fee',
        'Transfer Letter / Referral Letter Fee'
      ]
    },
    'discharge': {
      title: '11. Discharge & Billing Management',
      items: [
        'Discharge Administration Fee',
        'Final Bill Processing Fee',
        'Medical Forms Filling Fee',
        'Patient Clearance Admin Fee'
      ]
    },
    'miscellaneous': {
      title: '12. Miscellaneous Admin Fees',
      items: [
        'Consumables Handling Fee',
        'Linen Fee',
        'Maintenance / Facility Fee',
        'Infection Control Fee',
        'Waste Disposal Fee',
        'PPE Charge (COVID protocols, if applicable)',
        'Equipment Usage Fee'
      ]
    }
  };

  // Initialize charges on mount
  useEffect(() => {
    loadCharges();
  }, []);

  const loadCharges = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/charges');
      const chargesMap = {};
      if (res.data && Array.isArray(res.data)) {
        res.data.forEach(charge => {
          // Use chargeId as key for easy lookup
          chargesMap[charge._id] = charge;
        });
      }
      setCharges(chargesMap);
    } catch (error) {
      console.error('Error loading charges:', error);
      setToast({ type: 'error', message: 'Error loading charges from server' });
      // Initialize empty charges object
      setCharges({});
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCharge = async (chargeId) => {
    try {
      const charge = charges[chargeId];
      if (!charge.amount || isNaN(charge.amount) || charge.amount < 0) {
        setToast({ type: 'error', message: 'Please enter a valid amount' });
        return;
      }

      const payload = {
        name: charge.name,
        category: charge.category,
        amount: parseFloat(charge.amount),
        description: charge.description || ''
      };

      if (charge._id) {
        // Update existing
        await axiosInstance.put(`/api/charges/${charge._id}`, payload);
        setToast({ type: 'success', message: 'Charge updated successfully' });
      } else {
        // Create new
        const res = await axiosInstance.post('/api/charges', payload);
        setCharges(prev => ({
          ...prev,
          [chargeId]: res.data
        }));
        setToast({ type: 'success', message: 'Charge created successfully' });
      }
      setEditingId(null);
      loadCharges();
    } catch (error) {
      console.error('Error saving charge:', error);
      setToast({ type: 'error', message: error.response?.data?.message || 'Error saving charge' });
    }
  };

  const handleDeleteCharge = async (chargeId) => {
    if (!window.confirm('Are you sure you want to delete this charge?')) return;

    try {
      const charge = charges[chargeId];
      if (charge._id) {
        await axiosInstance.delete(`/api/charges/${charge._id}`);
        setToast({ type: 'success', message: 'Charge deleted successfully' });
        loadCharges();
      }
    } catch (error) {
      console.error('Error deleting charge:', error);
      setToast({ type: 'error', message: 'Error deleting charge' });
    }
  };

  const handleAmountChange = (chargeId, value) => {
    setCharges(prev => ({
      ...prev,
      [chargeId]: {
        ...prev[chargeId],
        amount: value
      }
    }));
  };

  const handleAddNewCharge = async () => {
    if (!newChargeCategory || !newChargeName || !newChargeAmount) {
      setToast({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    try {
      const payload = {
        name: newChargeName,
        category: newChargeCategory,
        amount: parseFloat(newChargeAmount)
      };

      await axiosInstance.post('/api/charges', payload);
      setToast({ type: 'success', message: 'New charge added successfully' });
      setNewChargeCategory('');
      setNewChargeName('');
      setNewChargeAmount('');
      loadCharges();
    } catch (error) {
      console.error('Error adding charge:', error);
      setToast({ type: 'error', message: 'Error adding charge' });
    }
  };

  // Initialize charges from feeCategories if not loaded from API
  const getChargeForItem = (categoryKey, itemName) => {
    // Look for a charge matching this item name
    const matchingCharge = Object.values(charges).find(c => 
      c.name === itemName && c.category === categoryKey
    );
    
    if (matchingCharge) {
      return matchingCharge;
    }
    
    // Return default charge object if not found
    return { 
      name: itemName, 
      category: categoryKey, 
      amount: 0,
      _id: null
    };
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6 text-center text-red-600">
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Management Charges</h1>
        <p className="text-gray-600 mb-6">Configure and manage all hospital service charges and fees.</p>

        {/* Add New Charge Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Charge</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={newChargeCategory}
              onChange={(e) => setNewChargeCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              {Object.entries(feeCategories).map(([key, cat]) => (
                <option key={key} value={key}>{cat.title}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Charge Name"
              value={newChargeName}
              onChange={(e) => setNewChargeName(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Amount"
              value={newChargeAmount}
              onChange={(e) => setNewChargeAmount(e.target.value)}
              min="0"
              step="0.01"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddNewCharge}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <FaPlus /> Add Charge
            </button>
          </div>
        </div>

        {/* Charges by Category */}
        <div className="space-y-8">
          {Object.entries(feeCategories).map(([categoryKey, category]) => (
            <div key={categoryKey} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <h2 className="text-lg font-semibold">{category.title}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-100">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Charge Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount (KES)</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.items.map((itemName, idx) => {
                      const charge = getChargeForItem(categoryKey, itemName);
                      const chargeId = charge._id || `temp-${categoryKey}-${idx}`;
                      const isEditing = editingId === chargeId;

                      return (
                        <tr key={chargeId} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{itemName}</td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                type="number"
                                value={charges[chargeId]?.amount || charge.amount || 0}
                                onChange={(e) => handleAmountChange(chargeId, e.target.value)}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <span className="text-sm font-medium text-gray-900">
                                {typeof charge.amount === 'number' ? charge.amount.toFixed(2) : '0.00'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveCharge(chargeId)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition"
                                  >
                                    <FaSave size={14} /> Save
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition"
                                  >
                                    <FaTimes size={14} /> Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEditingId(chargeId)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition"
                                  >
                                    <FaEdit size={14} /> Edit
                                  </button>
                                  {charge._id && (
                                    <button
                                      onClick={() => handleDeleteCharge(chargeId)}
                                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition"
                                    >
                                      <FaTrash size={14} /> Delete
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
