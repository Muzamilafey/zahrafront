import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const DetailedDischargeSummary = () => {
  const { id } = useParams(); // This is patientId
  const { axiosInstance } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/discharge/patient/${id}/latest`);
        setSummary(response.data);
        setError('');
      } catch (err) {
        console.error('Failed to fetch discharge summary:', err);
        setError('Failed to load discharge summary. No summary may be available for this patient, or there was a server error.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSummary();
    }
  }, [id, axiosInstance]);

  if (loading) {
    return <div className="text-center p-8">Loading discharge summary...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  if (!summary) {
    return <div className="text-center p-8">No discharge summary found for this patient.</div>;
  }

  const renderField = (label, value) => (
    <div className="mb-4">
      <h4 className="text-lg font-semibold text-gray-700">{label}</h4>
      <p className="text-gray-800 whitespace-pre-wrap">{value || 'N/A'}</p>
    </div>
  );

  const renderList = (label, items) => (
    <div className="mb-4">
      <h4 className="text-lg font-semibold text-gray-700">{label}</h4>
      {items && items.length > 0 ? (
        <ul className="list-disc list-inside pl-4 text-gray-800">
          {items.map((item, index) => (
            <li key={index}>{typeof item === 'object' ? `${item.name} - ${item.dose} ${item.frequency}` : item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-800">N/A</p>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 border-b pb-4">Detailed Discharge Summary</h2>

        {/* Patient and Admission Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-100 p-4 rounded-lg">
          <div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Patient Information</h3>
            {renderField('Name', summary.patientInfo?.name)}
            {renderField('MRN', summary.patientInfo?.mrn)}
            {renderField('Age/Sex', `${summary.patientInfo?.age || 'N/A'} / ${summary.patientInfo?.gender || 'N/A'}`)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Admission Details</h3>
            {renderField('Admission Date', summary.admissionInfo?.admittedAt ? new Date(summary.admissionInfo.admittedAt).toLocaleDateString() : 'N/A')}
            {renderField('Discharge Date', summary.admissionInfo?.dischargedAt ? new Date(summary.admissionInfo.dischargedAt).toLocaleDateString() : 'N/A')}
            {renderField('Ward', summary.admissionInfo?.ward)}
          </div>
        </div>

        {/* Clinical Information */}
        <div className="space-y-6">
          {renderField('Admission Diagnosis', summary.primaryDiagnosis)}
          {renderList('Secondary Diagnoses', summary.secondaryDiagnoses)}
          {renderField('Treatment Summary', summary.treatmentSummary || summary.hospitalStaySummary)}
          {renderList('Procedures Performed', summary.procedures?.map(p => p.name))}
          {renderList('Discharge Medications', summary.dischargeMedications)}
          {renderField('Follow Up Advice', summary.followUpAdvice)}
          {renderField('Additional Notes', summary.notes)}
        </div>

        {/* Discharging Doctor */}
        <div className="mt-8 pt-6 border-t text-center">
          <h3 className="text-lg font-semibold text-gray-700">Discharged By</h3>
          <p className="text-gray-800 mt-2">{summary.dischargingDoctorName || 'N/A'}</p>
          {summary.finalizationInfo?.finalizedAt && (
            <p className="text-sm text-gray-500">Finalized on {new Date(summary.finalizationInfo.finalizedAt).toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailedDischargeSummary;