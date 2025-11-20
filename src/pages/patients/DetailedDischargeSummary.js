import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { FaFileInvoice, FaPrint } from 'react-icons/fa';
import useHospitalDetails from '../../hooks/useHospitalDetails';

const DetailedDischargeSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const { hospitalDetails, loading: hospitalDetailsLoading } = useHospitalDetails();

  const [dischargeSummaryData, setDischargeSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatePDFLoading, setGeneratePDFLoading] = useState(false);
  const [generatePDFError, setGeneratePDFError] = useState(null);

  useEffect(() => {
    if (!id || !axiosInstance) return;
    const fetchData = async () => {
      try {
        // The backend should provide a comprehensive summary endpoint.
        // This might include patient details, admission info, diagnosis,
        // clinical summary, investigations, and medications.
        const response = await axiosInstance.get(`/discharge/patient/${id}/latest`); // Fetch latest discharge summary for a patient
        setDischargeSummaryData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load patient comprehensive data:', err);
        setError('Failed to fetch patient data.');
        setLoading(false);
      }
    };
    fetchData();
  }, [id, axiosInstance]);

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePdf = async () => {
    try {
      setGeneratePDFLoading(true);
      setGeneratePDFError(null);
      const res = await axiosInstance.get(`/discharge/generate-pdf/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `discharge-summary-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      console.error('Failed to generate discharge summary PDF:', e);
      setGeneratePDFError('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratePDFLoading(false);
    }
  };

  if (loading || hospitalDetailsLoading) return <div className="text-center p-8">Loading Discharge Summary...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!dischargeSummaryData) return <div className="text-center p-8">No discharge summary found.</div>;

  // Destructure the discharge summary data
  const { 
    patient, 
    admission, 
    primaryDiagnosis, 
    secondaryDiagnoses, 
    treatmentSummary, 
    dischargeMedications, 
    procedures, 
    followUpAdvice, 
    notes,
    createdBy 
  } = dischargeSummaryData;

  const patientName = patient?.user?.name || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim();
  const patientAge = patient?.calculateAge ? patient.calculateAge() : 'N/A'; // Assuming calculateAge is available on patient object
  const patientGender = patient?.gender || 'N/A';
  const mrn = patient?.mrn || 'N/A';

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { FaFileInvoice, FaPrint, FaEdit, FaSave, FaTimes } from 'react-icons/fa'; // Added edit/save/cancel icons
import useHospitalDetails from '../../hooks/useHospitalDetails';

const DetailedDischargeSummary = () => {
  const { id } = useParams(); // This `id` is the patientId
  const navigate = useNavigate();
  const { axiosInstance, user } = useContext(AuthContext); // Get user for role-based editing
  const { hospitalDetails, loading: hospitalDetailsLoading } = useHospitalDetails();

  const [dischargeSummaryData, setDischargeSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatePDFLoading, setGeneratePDFLoading] = useState(false);
  const [generatePDFError, setGeneratePDFError] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (!id || !axiosInstance) return;
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(`/discharge/patient/${id}/latest`); // Fetch latest discharge summary for a patient
        setDischargeSummaryData(response.data);
        setEditedSummary(response.data); // Initialize edited data
        setLoading(false);
      } catch (err) {
        console.error('Failed to load discharge summary data:', err);
        setError(err.response?.data?.message || 'Failed to fetch discharge summary. You may not have permission.');
        setLoading(false);
      }
    };
    fetchData();
  }, [id, axiosInstance]);

  // Update editedSummary if dischargeSummaryData changes (e.g., after a save)
  useEffect(() => {
    if (dischargeSummaryData) {
      setEditedSummary(dischargeSummaryData);
    }
  }, [dischargeSummaryData]);

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePdf = async () => {
    try {
      setGeneratePDFLoading(true);
      setGeneratePDFError(null);
      // Backend expects dischargeSummary ID, but we have patient ID.
      // Need to use the _id of the fetched dischargeSummaryData.
      if (!dischargeSummaryData?._id) {
          throw new Error("Discharge Summary ID not available for PDF generation.");
      }
      const res = await axiosInstance.get(`/discharge/generate-pdf/${dischargeSummaryData._id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `discharge-summary-${dischargeSummaryData._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      console.error('Failed to generate discharge summary PDF:', e);
      setGeneratePDFError('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratePDFLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(prev => !prev);
    // If cancelling, revert changes
    if (isEditing) {
      setEditedSummary(dischargeSummaryData);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedSummary(prev => {
      // Handle array types by converting string to array
      if (name === 'secondaryDiagnoses' || name === 'dischargeMedications' || name === 'procedures') {
        // Simple split by comma for now. More robust parsing might be needed.
        // For dischargeMedications and procedures, if they are objects, this simple split won't work perfectly,
        // but it allows basic text editing. For full editing, a more complex component would be needed.
        return { ...prev, [name]: value.split(',').map(item => item.trim()).filter(item => item) };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      // The backend expects an ID of the discharge summary itself, not the patient ID.
      if (!dischargeSummaryData?._id) {
        throw new Error("Cannot save: Discharge Summary ID not available.");
      }
      // Prepare data for backend: only send fields that are editable
      const payload = {
        primaryDiagnosis: editedSummary.primaryDiagnosis,
        secondaryDiagnoses: editedSummary.secondaryDiagnoses, // Array of strings
        treatmentSummary: editedSummary.treatmentSummary,
        dischargeMedications: editedSummary.dischargeMedications, // Array of strings (simplified for editing)
        procedures: editedSummary.procedures, // Array of strings (simplified for editing)
        followUpAdvice: editedSummary.followUpAdvice,
        notes: editedSummary.notes,
        // Add other allowed editable fields as needed from dischargeSummaryData
      };
      
      const response = await axiosInstance.put(`/discharge/update/${dischargeSummaryData._id}`, payload);
      setDischargeSummaryData(response.data.summary); // Update main display data
      setEditedSummary(response.data.summary); // Update edited data as well
      setIsEditing(false);
      // Optional: show a success toast
    } catch (err) {
      console.error('Failed to save discharge summary:', err);
      setError(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaveLoading(false);
    }
  };


  if (loading || hospitalDetailsLoading) return <div className="text-center p-8">Loading Discharge Summary...</div>;
  if (error) return <div className="text-center p-8 text-red-600">{error}</div>; // Display error at the top
  if (!dischargeSummaryData) return <div className="text-center p-8">No discharge summary found for this patient.</div>;


  // Destructure from editedSummary for editing, from dischargeSummaryData for display
  const displayData = isEditing ? editedSummary : dischargeSummaryData;

  const { 
    patient, 
    admission, 
    primaryDiagnosis, 
    secondaryDiagnoses, 
    treatmentSummary, 
    dischargeMedications, 
    procedures, 
    followUpAdvice, 
    notes,
    createdBy 
  } = displayData;

  const patientName = patient?.user?.name || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim();
  const patientAge = patient?.calculateAge ? patient.calculateAge() : 'N/A';
  const patientGender = patient?.gender || 'N/A';
  const mrn = patient?.mrn || 'N/A';

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Determine if the current user can edit (e.g., admin or doctor)
  const canEdit = user?.role === 'admin' || user?.role === 'doctor';


  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="container mx-auto p-4 max-w-4xl bg-white shadow-lg" id="printable-area">
        
        {/* Hospital Information and Action Buttons */}
        <div className="flex justify-between items-start mb-8 no-print">
          <div className="text-left">
            {hospitalDetails.hospitalLogoUrl && (
              <img src={hospitalDetails.hospitalLogoUrl} alt="Hospital Logo" className="h-16 mb-2 object-contain" />
            )}
            <h1 className="text-2xl font-bold text-black">{hospitalDetails.hospitalName || 'Zahra Maternity Hospital'}</h1>
            <p className="text-md">{hospitalDetails.hospitalAddress || 'P.O. Box 20723, Nairobi'}</p>
            <p className="text-md">{hospitalDetails.hospitalContact || ''}</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <button 
              onClick={() => navigate(`/patients/${id}/invoice`)}
              className="bg-green-600 text-white font-bold py-2 px-4 rounded-md shadow-md hover:bg-green-700 transition duration-300 flex items-center"
            >
              <FaFileInvoice className="mr-2" />
              View Invoice
            </button>
            <button 
              onClick={handlePrint}
              className="bg-gray-700 text-white font-bold py-2 px-4 rounded-md shadow-md hover:bg-gray-800 transition duration-300 flex items-center"
            >
              <FaPrint className="mr-2" />
              Print
            </button>
            <button 
              onClick={handleGeneratePdf}
              disabled={generatePDFLoading}
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md shadow-md hover:bg-blue-700 transition duration-300 flex items-center disabled:opacity-50"
            >
              {generatePDFLoading ? 'Generating...' : '📄 Generate PDF'}
            </button>
            {canEdit && (
                isEditing ? (
                    <div className="flex gap-2">
                        <button 
                            onClick={handleSave}
                            disabled={saveLoading}
                            className="bg-green-500 text-white font-bold py-2 px-4 rounded-md shadow-md hover:bg-green-600 transition duration-300 flex items-center disabled:opacity-50"
                        >
                            {saveLoading ? 'Saving...' : <><FaSave className="mr-2" /> Save</>}
                        </button>
                        <button 
                            onClick={handleEditToggle}
                            className="bg-gray-500 text-white font-bold py-2 px-4 rounded-md shadow-md hover:bg-gray-600 transition duration-300 flex items-center"
                        >
                            <FaTimes className="mr-2" /> Cancel
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={handleEditToggle}
                        className="bg-purple-600 text-white font-bold py-2 px-4 rounded-md shadow-md hover:bg-purple-700 transition duration-300 flex items-center"
                    >
                        <FaEdit className="mr-2" /> Edit
                    </button>
                )
            )}
          </div>
        </div>

        {/* Header for the printable summary */}
        <header className="text-center mb-8 p-4 border-b-4 border-black print-only">
          {hospitalDetails.hospitalLogoUrl && (
            <img src={hospitalDetails.hospitalLogoUrl} alt="Hospital Logo" className="h-20 mx-auto mb-4 object-contain" />
          )}
          <h1 className="text-3xl font-bold text-black">{hospitalDetails.hospitalName || 'Zahra Maternity Hospital'}</h1>
          <p className="text-lg">{hospitalDetails.hospitalAddress || 'P.O. Box 20723, Nairobi'}</p>
          <p className="text-lg">{hospitalDetails.hospitalContact || ''}</p>
          <h2 className="text-2xl font-semibold mt-4 bg-black text-white py-1">DISCHARGE SUMMARY</h2>
        </header>

        {/* Patient and Admission Details */}
        <section className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6 border-t-2 border-b-2 border-black py-4">
          <div><strong>PATIENT NAME:</strong> {patientName}</div>
          <div><strong>ADMISSION DATE:</strong> {formatDate(admission?.admittedAt)}</div>
          <div><strong>AGE/SEX:</strong> {patientAge} / {patientGender}</div>
          <div><strong>DISCHARGE DATE:</strong> {formatDate(admission?.dischargedAt)}</div>
          <div><strong>MRN NO.:</strong> {mrn}</div>
          <div><strong>CONSULTANT:</strong> {admission?.admittingDoctor?.name || 'N/A'}</div>
        </section>

        {/* Clinical Details */}
        <section className="mb-6">
          <h3 className="font-bold border-b border-black mb-2">ADMISSION DIAGNOSIS</h3>
          {isEditing ? (
            <input
              type="text"
              name="primaryDiagnosis"
              value={editedSummary.primaryDiagnosis || ''}
              onChange={handleInputChange}
              className="input w-full"
            />
          ) : (
            <p>{primaryDiagnosis || 'N/A'}</p>
          )}
        </section>

        <section className="mb-6">
          <h3 className="font-bold border-b border-black mb-2">SECONDARY DIAGNOSES</h3>
          {isEditing ? (
            <textarea
              name="secondaryDiagnoses"
              value={(Array.isArray(secondaryDiagnoses) ? secondaryDiagnoses.join(', ') : secondaryDiagnoses) || ''}
              onChange={handleInputChange}
              className="textarea w-full"
              rows="3"
            />
          ) : (
            secondaryDiagnoses && secondaryDiagnoses.length > 0 ? (
              <ul className="list-disc list-inside">
                {secondaryDiagnoses.map((diag, index) => (
                  <li key={index}>{diag}</li>
                ))}
              </ul>
            ) : <p>No secondary diagnoses found.</p>
          )}
        </section>

        <section className="mb-6">
          <h3 className="font-bold border-b border-black mb-2">TREATMENT SUMMARY</h3>
          {isEditing ? (
            <textarea
              name="treatmentSummary"
              value={editedSummary.treatmentSummary || ''}
              onChange={handleInputChange}
              className="textarea w-full"
              rows="5"
            />
          ) : (
            <p className="whitespace-pre-wrap">{treatmentSummary || 'No summary available.'}</p>
          )}
        </section>

        <section className="mb-6">
          <h3 className="font-bold border-b border-black mb-2">DISCHARGE MEDICATIONS</h3>
          {isEditing ? (
            <textarea
              name="dischargeMedications"
              value={(Array.isArray(dischargeMedications) ? dischargeMedications.map(med => `${med.name} - ${med.dose} ${med.frequency}`).join(', ') : dischargeMedications) || ''}
              onChange={handleInputChange}
              className="textarea w-full"
              rows="3"
            />
          ) : (
            dischargeMedications && dischargeMedications.length > 0 ? (
              <ul className="list-disc list-inside">
                {dischargeMedications.map((med, index) => (
                  <li key={index}>{med.name} - {med.dose} {med.frequency}</li>
                ))}
              </ul>
            ) : <p>No discharge medications found.</p>
          )}
        </section>

        <section className="mb-6">
          <h3 className="font-bold border-b border-black mb-2">PROCEDURES PERFORMED</h3>
          {isEditing ? (
            <textarea
              name="procedures"
              value={(Array.isArray(procedures) ? procedures.map(proc => `${proc.name} (${formatDate(proc.date)}) - ${proc.notes}`).join(', ') : procedures) || ''}
              onChange={handleInputChange}
              className="textarea w-full"
              rows="3"
            />
          ) : (
            procedures && procedures.length > 0 ? (
              <ul className="list-disc list-inside">
                {procedures.map((proc, index) => (
                  <li key={index}>{proc.name} ({formatDate(proc.date)}) - {proc.notes}</li>
                ))}
              </ul>
            ) : <p>No procedures found.</p>
          )}
        </section>

        <section className="mb-6">
          <h3 className="font-bold border-b border-black mb-2">FOLLOW-UP ADVICE</h3>
          {isEditing ? (
            <textarea
              name="followUpAdvice"
              value={editedSummary.followUpAdvice || ''}
              onChange={handleInputChange}
              className="textarea w-full"
              rows="3"
            />
          ) : (
            <p>{followUpAdvice || 'N/A'}</p>
          )}
        </section>

        <section className="mb-6">
          <h3 className="font-bold border-b border-black mb-2">ADDITIONAL NOTES</h3>
          {isEditing ? (
            <textarea
              name="notes"
              value={editedSummary.notes || ''}
              onChange={handleInputChange}
              className="textarea w-full"
              rows="3"
            />
          ) : (
            <p>{notes || 'N/A'}</p>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-4 border-t-2 border-black text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Prepared By:</strong> {createdBy?.name || 'N/A'}</p>
            </div>
          </div>
          <p className="text-center mt-4 text-xs">This is a computer-generated summary and is not valid for any court of law.</p>
        </footer>
      </div>
      <style jsx global>{`
        @media print {
          .no-print { display: none; }
          .print-only { display: block !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #printable-area { box-shadow: none; margin: 0; max-width: 100%; border-radius: 0; }
        }
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default DetailedDischargeSummary;

