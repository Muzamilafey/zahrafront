import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { calculateBMI, getBMICategory, validateVitals, getRecommendedCategory, TRIAGE_CATEGORIES } from './utils';
import { FaCalculator, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const TriageForm = ({ patientId, onSuccess, onCancel }) => {
  const { axiosInstance, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    temperature: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    respiratoryRate: '',
    pulseRate: '',
    spo2: '',
    weight: '',
    height: '',
    painScore: 5,
    triageCategory: 'Yellow',
    reasonForVisit: '',
    notes: '',
  });

  const [bmi, setBmi] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [recommendedCategory, setRecommendedCategory] = useState('');

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numValue = ['painScore', 'temperature', 'bloodPressureSystolic', 'bloodPressureDiastolic', 'respiratoryRate', 'pulseRate', 'spo2', 'weight', 'height'].includes(name)
      ? value === ''
        ? ''
        : parseFloat(value)
      : value;

    const updatedFormData = { ...formData, [name]: numValue };
    setFormData(updatedFormData);

    // Auto-calculate BMI
    if (name === 'weight' || name === 'height') {
      const calculatedBmi = calculateBMI(updatedFormData.weight, updatedFormData.height);
      setBmi(calculatedBmi);
    }

    // Auto-suggest triage category
    if (['temperature', 'pulseRate', 'spo2', 'respiratoryRate', 'painScore'].includes(name)) {
      const suggested = getRecommendedCategory(updatedFormData);
      setRecommendedCategory(suggested);
    }

    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Client-side validation
    const validation = validateVitals(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    if (!formData.reasonForVisit.trim()) {
      setValidationErrors(['Reason for visit is required']);
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post('/triage', {
        patient: patientId,
        ...formData,
      });

      setSuccessMessage('Triage record saved successfully!');
      
      // Reset form
      setFormData({
        temperature: '',
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        respiratoryRate: '',
        pulseRate: '',
        spo2: '',
        weight: '',
        height: '',
        painScore: 5,
        triageCategory: 'Yellow',
        reasonForVisit: '',
        notes: '',
      });
      setBmi(null);
      setValidationErrors([]);

      // Callback on success
      if (onSuccess) {
        setTimeout(() => onSuccess(response.data.data), 1500);
      }
    } catch (err) {
      console.error('Error submitting triage form:', err);
      setError(err.response?.data?.message || 'Failed to save triage record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Patient Triage Assessment</h2>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <FaExclamationCircle className="text-red-600 text-xl mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <FaCheckCircle className="text-green-600 text-xl mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-800">Success</h3>
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Validation Errors:</h3>
          <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vital Signs Section */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Vital Signs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature (°C) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="temperature"
                value={formData.temperature}
                onChange={handleInputChange}
                placeholder="36.5"
                step="0.1"
                min="25"
                max="45"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Range: 25-45°C</p>
            </div>

            {/* Systolic BP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Systolic BP (mmHg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="bloodPressureSystolic"
                value={formData.bloodPressureSystolic}
                onChange={handleInputChange}
                placeholder="120"
                min="50"
                max="250"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Range: 50-250 mmHg</p>
            </div>

            {/* Diastolic BP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diastolic BP (mmHg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="bloodPressureDiastolic"
                value={formData.bloodPressureDiastolic}
                onChange={handleInputChange}
                placeholder="80"
                min="30"
                max="150"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Range: 30-150 mmHg</p>
            </div>

            {/* Respiratory Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Respiratory Rate (breaths/min) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="respiratoryRate"
                value={formData.respiratoryRate}
                onChange={handleInputChange}
                placeholder="16"
                min="8"
                max="60"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Range: 8-60 breaths/min</p>
            </div>

            {/* Pulse Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pulse Rate (beats/min) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="pulseRate"
                value={formData.pulseRate}
                onChange={handleInputChange}
                placeholder="72"
                min="30"
                max="200"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Range: 30-200 beats/min</p>
            </div>

            {/* SPO2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SPO2 (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="spo2"
                value={formData.spo2}
                onChange={handleInputChange}
                placeholder="98"
                step="0.1"
                min="70"
                max="100"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Range: 70-100%</p>
            </div>
          </div>
        </div>

        {/* Anthropometric Section */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Measurements</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="70"
                step="0.1"
                min="2"
                max="300"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Range: 2-300 kg</p>
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                placeholder="170"
                step="0.1"
                min="50"
                max="250"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Range: 50-250 cm</p>
            </div>

            {/* BMI Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BMI <FaCalculator className="inline ml-1 text-blue-600" />
              </label>
              <div className="bg-gray-100 px-3 py-2 rounded-lg h-10 flex items-center">
                {bmi ? (
                  <span className="font-semibold text-gray-800">
                    {bmi} <span className="text-xs text-gray-600">({getBMICategory(bmi)})</span>
                  </span>
                ) : (
                  <span className="text-gray-500">Enter weight & height</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Section */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pain Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pain Score (0-10) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  name="painScore"
                  value={formData.painScore}
                  onChange={handleInputChange}
                  min="0"
                  max="10"
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="font-bold text-lg text-blue-600 w-8">{formData.painScore}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">0: No pain, 10: Worst possible</p>
            </div>

            {/* Triage Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Triage Category <span className="text-red-500">*</span>
                {recommendedCategory && (
                  <span className="ml-2 text-xs text-blue-600">(Suggested: {recommendedCategory})</span>
                )}
              </label>
              <select
                name="triageCategory"
                value={formData.triageCategory}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(TRIAGE_CATEGORIES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {key} - {value.label} ({value.description})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="border-b pb-6">
          <div className="grid grid-cols-1 gap-4">
            {/* Reason for Visit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Visit <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reasonForVisit"
                value={formData.reasonForVisit}
                onChange={handleInputChange}
                placeholder="Chief complaint or reason for seeking medical care..."
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional observations or clinical notes..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-2 rounded-lg font-medium text-white transition ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Saving...' : 'Save Triage'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TriageForm;
