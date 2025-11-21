import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const EditDischargeSummary = () => {
  const { summaryId } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  
  const [summary, setSummary] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/discharge/${summaryId}`);
        setSummary(response.data);
        // Initialize form data with fetched summary data
        setFormData({
          primaryDiagnosis: response.data.primaryDiagnosis || '',
          secondaryDiagnoses: response.data.secondaryDiagnoses?.join(', ') || '',
          treatmentSummary: response.data.treatmentSummary || '',
          followUpAdvice: response.data.followUpAdvice || '',
          notes: response.data.notes || '',
        });
      } catch (err) {
        console.error('Failed to fetch discharge summary for editing:', err);
        setError('Failed to load summary data. It may not exist or you may not have permission.');
      } finally {
        setLoading(false);
      }
    };

    if (summaryId) {
      fetchSummary();
    }
  }, [summaryId, axiosInstance]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatePayload = {
        ...formData,
        secondaryDiagnoses: formData.secondaryDiagnoses.split(',').map(s => s.trim()).filter(Boolean),
      };
      await axiosInstance.put(`/discharge/update/${summaryId}`, updatePayload);
      alert('Summary updated successfully!');
      navigate(`/patients/${summary.patient._id}/detailed-discharge-summary`);
    } catch (err) {
      console.error('Failed to update summary:', err);
      alert('Failed to update summary. Please try again.');
      setError(err.response?.data?.message || 'An error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="text-center p-8">Loading summary for editing...</div>;
  if (error && !summary) return <div className="text-center p-8 text-red-500">{error}</div>;

  const renderTextarea = (label, name, rows = 4) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        id={name}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        rows={rows}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      />
    </div>
  );

  return (
    <div className="container mx-auto p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Discharge Summary</h2>
        <p className="mb-4 text-sm text-gray-600">Patient: <strong>{summary?.patientInfo.name}</strong> (MRN: {summary?.patientInfo.mrn})</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderTextarea('Admission Diagnosis', 'primaryDiagnosis', 2)}
          {renderTextarea('Secondary Diagnoses (comma-separated)', 'secondaryDiagnoses', 2)}
          {renderTextarea('Treatment Summary', 'treatmentSummary', 6)}
          {renderTextarea('Follow Up Advice', 'followUpAdvice', 3)}
          {renderTextarea('Additional Notes', 'notes', 3)}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-modern-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-modern-primary"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDischargeSummary;
