import React, { useState } from 'react';
import PatientSearch from '../../components/patientSearch';
import DischargeSummary from '../../components/DischargeSummary';
import Invoice from '../../components/Invoice';
import PrintButton from '../../components/PrintButton';
import Spinner from '../../components/Spinner';
import axios from 'axios';

const NewDischargeSummary = () => {
  const [patient, setPatient] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (patientId) => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setPatient(null);

    try {
      // Search for the patient by ID
      const patientResponse = await axios.get(`/api/patients/${patientId}`);
      let foundPatient = patientResponse.data;

      // API may return an array or an object
      if (Array.isArray(foundPatient)) foundPatient = foundPatient[0];

      if (!foundPatient || !foundPatient._id) {
        setError('Patient not found.');
        return;
      }

      setPatient(foundPatient);

      // First, find the latest discharge summary for the patient
      const dischargeResponse = await axios.get(`/api/discharge/patient/${foundPatient._id}`);
      const dischargeData = dischargeResponse.data;

      // dischargeData shape may vary: array, { summaries: [...] }, or { summary: { ... } }
      let latestSummary = null;
      if (Array.isArray(dischargeData) && dischargeData.length > 0) {
        latestSummary = dischargeData[0];
      } else if (dischargeData && Array.isArray(dischargeData.summaries) && dischargeData.summaries.length > 0) {
        latestSummary = dischargeData.summaries[0];
      } else if (dischargeData && dischargeData.summary) {
        latestSummary = dischargeData.summary;
      }

      if (!latestSummary || !latestSummary._id) {
        setError('No discharge summary found for this patient.');
        return;
      }

      // Then, fetch the full details of that summary
      const summaryResponse = await axios.get(`/api/discharge/${latestSummary._id}`);
      setSummary(summaryResponse.data);
    } catch (err) {
      setError('Failed to fetch data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Discharge Summary</h1>
      <PatientSearch onSearch={handleSearch} isLoading={loading} />

      {loading && <Spinner />}
      {error && <div className="text-red-500">{error}</div>}

      {summary && (
        <div className="mt-8">
          <div className="flex justify-end mb-4">
            <PrintButton onClick={handlePrint} />
          </div>
          <div id="print-area">
            <DischargeSummary summary={summary} />
            <Invoice summary={summary} />
          </div>
        </div>
      )}
    </div>
  );
};

export default NewDischargeSummary;
