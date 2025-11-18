import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button } from 'components/ui/button'; // Assuming you have a Button component

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

  if (!summary) {
    return <div>No discharge summary found.</div>;
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
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-center">Discharge Summary</h1>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
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
            {investigations.map((item, index) => (
              <li key={index}>{item.name} - {item.results}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Procedures</h2>
          <ul>
            {procedures.map((item, index) => (
              <li key={index}>{item.name}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Medications on Discharge */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Medications on Discharge</h2>
        <ul>
          {medicationsOnDischarge.map((med, index) => (
            <li key={index}>
              {med.name} - {med.dosage} {med.frequency} for {med.duration}
            </li>
          ))}
        </ul>
      </div>

      {/* Charges */}
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