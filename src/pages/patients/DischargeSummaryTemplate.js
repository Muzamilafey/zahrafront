import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const DischargeSummaryTemplate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const printRef = useRef();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.get(`/api/discharge/${id}`);
        setSummary(response.data);
      } catch (err) {
        setError('Failed to fetch discharge summary.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!summary || !summary.patientInfo || !summary.admissionInfo || !summary.diagnosis) {
    return <div>No discharge summary found or data is incomplete.</div>;
  }

  const {
    patientInfo,
    admissionInfo,
    diagnosis,
    hospitalStaySummary,
    investigations,
    procedures,
    medicationsOnDischarge,
    followUpPlan,
    instructionsToPatient,
    dischargeCondition,
    dischargingDoctorName,
    charges,
    totalCharges,
  } = summary;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg" ref={printRef}>
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5A1 1 0 017.707 4.293L4.414 7.586H18a1 1 0 110 2H4.414l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
        <h1 className="text-3xl font-bold text-center">Discharge Summary</h1>
        <button
          onClick={handlePrint}
          className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M6 9V2h12v7" />
            <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" rx="2" />
          </svg>
          Print
        </button>
      </div>

      {/* Patient and Admission Info */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Patient Information</h2>
          <p><strong>Name:</strong> {patientInfo.name}</p>
          <p><strong>MRN:</strong> {patientInfo.mrn}</p>
          <p><strong>Age:</strong> {patientInfo.age}</p>
          <p><strong>Gender:</strong> {patientInfo.gender}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Admission Details</h2>
          <p><strong>Admission Date:</strong> {new Date(admissionInfo.admittedAt).toLocaleDateString()}</p>
          <p><strong>Discharge Date:</strong> {new Date(admissionInfo.dischargedAt).toLocaleDateString()}</p>
          <p><strong>Ward:</strong> {admissionInfo.ward}</p>
          <p><strong>Bed:</strong> {admissionInfo.bed}</p>
        </div>
      </div>

      {/* Clinical Information */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Clinical Information</h2>
        <p><strong>Primary Diagnosis:</strong> {diagnosis.primary}</p>
        {diagnosis.secondary && diagnosis.secondary.length > 0 && (
          <p><strong>Secondary Diagnosis:</strong> {diagnosis.secondary.join(', ')}</p>
        )}
        <p className="mt-4"><strong>Hospital Stay Summary:</strong></p>
        <p>{hospitalStaySummary}</p>
      </div>

      {/* Investigations and Procedures */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Investigations</h2>
          <ul>
            {investigations && investigations.map((item, index) => (
              <li key={index}>{item.name} - {item.results}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Procedures</h2>
          <ul>
            {procedures && procedures.map((item, index) => (
              <li key={index}>{item.name}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Medications on Discharge */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Medications on Discharge</h2>
        <ul>
          {medicationsOnDischarge && medicationsOnDischarge.map((med, index) => (
            <li key={index}>
              {med.name} - {med.dosage} {med.frequency} for {med.duration}
            </li>
          ))}
        </ul>
      </div>

      {/* Charges */}
      {charges && totalCharges && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Charges</h2>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Item</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {charges.map((charge, index) => (
                <tr key={index}>
                  <td>{charge.name}</td>
                  <td className="text-right">{charge.quantity}</td>
                  <td className="text-right">{charge.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2" className="text-right font-bold">Total</td>
                <td className="text-right font-bold">{totalCharges.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Discharge and Follow-up */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Discharge and Follow-up</h2>
        <p><strong>Discharge Condition:</strong> {dischargeCondition}</p>
        <p><strong>Follow-up Plan:</strong> {followUpPlan}</p>
        <p><strong>Instructions to Patient:</strong> {instructionsToPatient}</p>
      </div>

      {/* Discharging Doctor */}
      <div className="mt-12 text-right">
        <p><strong>Discharging Doctor:</strong></p>
        <p>{dischargingDoctorName}</p>
      </div>
    </div>
  );
};

export default DischargeSummaryTemplate;