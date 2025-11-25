/**
 * Example Integration Page for Triage Module
 * 
 * This is a complete example showing how to use the Triage module
 * in a real patient page/dashboard.
 * 
 * Copy this pattern to implement in your application.
 */

import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { TriageForm, TriageHistory } from '../../modules/triage';
import { FaArrowLeft, FaFileAlt, FaPlus } from 'react-icons/fa';

const TriageModulePage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('history'); // 'form' or 'history'
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh history

  // Check if user has permission to create triage
  const canCreateTriage = ['nurse', 'doctor', 'admin', 'receptionist'].includes(user?.role);

  const handleTriageSuccess = () => {
    // Refresh history after successful triage creation
    setRefreshKey((prev) => prev + 1);
    setActiveTab('history');
    
    // Optional: Show toast notification
    // showToast('Triage assessment saved successfully!', 'success');
  };

  const handleBack = () => {
    navigate(`/patients/${patientId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Patient Triage Assessment</h1>
            <p className="text-gray-600">Patient ID: {patientId}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {canCreateTriage && (
          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'form'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <FaPlus />
            New Assessment
          </button>
        )}
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
            <FaFileAlt />
          History
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {/* New Triage Form Tab */}
        {activeTab === 'form' && canCreateTriage && (
          <div className="bg-white rounded-lg shadow p-6">
            <TriageForm
              patientId={patientId}
              onSuccess={handleTriageSuccess}
              onCancel={() => setActiveTab('history')}
            />
          </div>
        )}

        {/* Triage History Tab */}
        {activeTab === 'history' && (
          <div key={refreshKey} className="bg-white rounded-lg shadow p-6">
            <TriageHistory patientId={patientId} />
          </div>
        )}

        {/* Permission Denied Message */}
        {activeTab === 'form' && !canCreateTriage && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800 font-semibold">
              You do not have permission to create triage assessments.
            </p>
            <p className="text-yellow-700 text-sm mt-1">
              Contact an administrator if you believe this is an error.
            </p>
          </div>
        )}
      </div>

      {/* Additional Info Box (optional) */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Triage Categories</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>🔴 <strong>Red:</strong> Emergency (immediate)</li>
            <li>🟠 <strong>Orange:</strong> Urgent</li>
            <li>🟡 <strong>Yellow:</strong> Semi-urgent</li>
            <li>🟢 <strong>Green:</strong> Non-urgent</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">✅ What's Included</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>✓ Vital signs recording</li>
            <li>✓ Auto BMI calculation</li>
            <li>✓ Category suggestion</li>
            <li>✓ Full history tracking</li>
          </ul>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">🔒 Access Control</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>👨‍⚕️ Doctors can create & update</li>
            <li>👩‍⚕️ Nurses can create assessments</li>
            <li>👤 Patients can view their records</li>
            <li>🔑 Admin full control</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TriageModulePage;

/**
 * INTEGRATION GUIDE
 * 
 * 1. Add route to App.js:
 *    <Route path="/triage/:patientId" element={<TriageModulePage />} />
 * 
 * 2. Link from patient page:
 *    <Link to={`/triage/${patientId}`}>Triage Assessment</Link>
 * 
 * 3. Add to main menu/navigation:
 *    - Nurses: Triage Section
 *    - Doctors: Triage History
 *    - Patients: My Assessments
 * 
 * 4. Customize as needed:
 *    - Colors
 *    - Layout
 *    - Additional fields
 *    - Permissions
 */
