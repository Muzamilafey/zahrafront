import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PatientSearch from '../../components/patientSearch';
import DischargeSummary from '../../components/DischargeSummary';
import Invoice from '../../components/Invoice';
import PrintButton from '../../components/PrintButton';
import Spinner from '../../components/Spinner';
import axios from 'axios';
import DischargeSummaryList from '../../components/DischargeSummaryList';

const NewDischargeSummary = () => {
  const [patient, setPatient] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoLoaded, setAutoLoaded] = useState(false);
  const { id: routePatientId } = useParams();

  const handleSearch = async (patientId) => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setPatient(null);

    try {
      // Try fetching discharge summaries directly by the provided id first
      // (handles cases where user enters an admission/patient _id)
      let dischargeResponse = null;
      try {
        dischargeResponse = await axios.get(`/api/discharge/patient/${patientId}`);
      } catch (e) {
        // ignore and fall back to patient lookup below
        dischargeResponse = null;
      }

      let latestSummary = null;
      if (dischargeResponse && dischargeResponse.data) {
        const dischargeData = dischargeResponse.data;
        if (Array.isArray(dischargeData) && dischargeData.length > 0) latestSummary = dischargeData[0];
        else if (dischargeData && Array.isArray(dischargeData.summaries) && dischargeData.summaries.length > 0) latestSummary = dischargeData.summaries[0];
        else if (dischargeData && dischargeData.summary) latestSummary = dischargeData.summary;
      }

      if (latestSummary && latestSummary._id) {
        // found a summary directly — fetch details and show it
        const summaryResponse = await axios.get(`/api/discharge/${latestSummary._id}`);
        setSummary(summaryResponse.data);
        // attempt to set patient if available in the returned summary
        if (summaryResponse.data && summaryResponse.data.patient) setPatient(summaryResponse.data.patient);
        return;
      }

      // If no summary found directly, attempt to resolve the provided id as a patient identifier
      const patientResponse = await axios.get(`/api/patients/${patientId}`);
      let foundPatient = patientResponse.data;
      if (Array.isArray(foundPatient)) foundPatient = foundPatient[0];
      if (!foundPatient || !foundPatient._id) {
        // Don't show a "patient not found" block — instead, surface a summary-missing message
        setError('No discharge summary found for the provided identifier.');
        return;
      }

      setPatient(foundPatient);

      // Now query discharges using the resolved patient _id
      const dischargeByPatient = await axios.get(`/api/discharge/patient/${foundPatient._id}`);
      const ddata = dischargeByPatient.data;
      if (Array.isArray(ddata) && ddata.length > 0) latestSummary = ddata[0];
      else if (ddata && Array.isArray(ddata.summaries) && ddata.summaries.length > 0) latestSummary = ddata.summaries[0];
      else if (ddata && ddata.summary) latestSummary = ddata.summary;

      if (!latestSummary || !latestSummary._id) {
        setError('No discharge summary found for this patient.');
        return;
      }

      const summaryResponse = await axios.get(`/api/discharge/${latestSummary._id}`);
      setSummary(summaryResponse.data);
    } catch (err) {
      setError('Failed to fetch data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If the page was opened with a patient id in the route, auto-load that patient's summary
    if (routePatientId && !autoLoaded) {
      setAutoLoaded(true);
      handleSearch(routePatientId);
    }
  }, [routePatientId, autoLoaded]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Discharge Summary</h1>

      {/* If we have a routePatientId or resolved patient, show the summaries list directly */}
      {(routePatientId || patient) ? (
        <div>
          <div className="mb-4">
            <PatientSearch onSearch={handleSearch} isLoading={loading} />
          </div>

          {loading && <Spinner />}
          {error && <div className="text-red-500">{error}</div>}

          {/* Show list of summaries for the patient */}
          <DischargeSummaryList patientId={patient?._id || routePatientId} />

          {/* If a single summary is loaded, show the detailed view below the list */}
          {summary && (
            <div className="mt-8">
              <div className="flex justify-end mb-4">
                <PrintButton onClick={handlePrint} />
              </div>
              <div id="print-area">
                <DischargeSummary summary={summary} patient={patient} />
                <Invoice summary={summary} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
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
      )}
    </div>
  );
};

export default NewDischargeSummary;
