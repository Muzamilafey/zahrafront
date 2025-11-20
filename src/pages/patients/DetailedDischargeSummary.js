import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import useHospitalDetails from '../../hooks/useHospitalDetails';
import { FaFileInvoice, FaPrint, FaEdit, FaSave, FaTimes, FaFilePdf } from 'react-icons/fa';

// ==========================================
// 1. HELPER COMPONENTS (Internal)
// ==========================================

const DischargeHeader = ({ hospitalDetails }) => (
  <header className="text-center border-b-4 border-gray-800 pb-4 mb-6 print:border-black">
    {hospitalDetails.hospitalLogoUrl && (
      <img 
        src={hospitalDetails.hospitalLogoUrl} 
        alt="Logo" 
        className="h-20 mx-auto mb-2 object-contain" 
      />
    )}
    <h1 className="text-3xl font-bold uppercase tracking-wide text-gray-900 print:text-black">
      {hospitalDetails.hospitalName || 'Hospital Name'}
    </h1>
    <div className="text-sm text-gray-600 mt-1 print:text-black">
      <p>{hospitalDetails.hospitalAddress}</p>
      <p>{hospitalDetails.hospitalContact}</p>
    </div>
    <div className="mt-4 bg-gray-900 text-white py-1 px-6 inline-block rounded-full text-sm font-bold tracking-wider uppercase print:bg-transparent print:text-black print:border-2 print:border-black">
      Discharge Summary
    </div>
  </header>
);

const PatientInfoGrid = ({ data }) => {
  const { patient, admission } = data;
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';

  const fields = [
    { label: 'Patient Name', value: patient?.user?.name || `${patient?.firstName || ''} ${patient?.lastName || ''}` },
    { label: 'MRN', value: patient?.mrn },
    { label: 'Age / Gender', value: `${patient?.age || patient?.calculateAge?.() || 'N/A'} / ${patient?.gender || 'N/A'}` },
    { label: 'Consultant', value: admission?.admittingDoctor?.name },
    { label: 'Admission Date', value: formatDate(admission?.admittedAt) },
    { label: 'Discharge Date', value: formatDate(admission?.dischargedAt) },
  ];

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 grid grid-cols-2 gap-4 text-sm print:bg-transparent print:border-black">
      {fields.map((field, idx) => (
        <div key={idx} className="flex flex-col">
          <span className="text-xs font-bold text-gray-500 uppercase print:text-black">{field.label}</span>
          <span className="font-semibold text-gray-900 print:text-black">{field.value || 'N/A'}</span>
        </div>
      ))}
    </div>
  );
};

const Section = ({ title, children, isEditing, name, value, onChange, placeholder }) => {
  return (
    <section className="mb-6 break-inside-avoid">
      <h3 className="text-sm font-bold text-gray-800 border-b border-gray-300 mb-2 uppercase tracking-wide print:text-black print:border-black">
        {title}
      </h3>
      {isEditing ? (
        <textarea
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          rows={Math.max(3, (value || '').split('\n').length)}
          className="w-full p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50 text-sm"
        />
      ) : (
        <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap print:text-black">
          {children || <span className="text-gray-400 italic">N/A</span>}
        </div>
      )}
    </section>
  );
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

const DetailedDischargeSummary = () => {
  const { id } = useParams(); // Patient ID
  const navigate = useNavigate();
  const { axiosInstance, user } = useContext(AuthContext);
  const { hospitalDetails, loading: hospitalLoading } = useHospitalDetails();

  // State
  const [data, setData] = useState(null); // The discharge summary object
  const [prescriptions, setPrescriptions] = useState([]); // Extra medication history
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({}); // Stores the edits
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // ---------------------------
  // Data Fetching
  // ---------------------------
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dischargeRes, prescriptionsRes] = await Promise.all([
        axiosInstance.get(`/discharge/patient/${id}/latest`),
        axiosInstance.get(`/patients/${id}/prescriptions`)
      ]);
      setData(dischargeRes.data);
      setFormData(dischargeRes.data); // Initialize edit form
      setPrescriptions(prescriptionsRes.data.prescriptions || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch discharge data');
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, id]);

  useEffect(() => {
    if (id && axiosInstance) fetchData();
  }, [fetchData, id, axiosInstance]);

  // ---------------------------
  // Handlers
  // ---------------------------
  
  // Handle text changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Helper to convert Array -> String (for Editing) and String -> Array (for Saving)
  // We assume simple comma or newline separation for lists
  const handleArrayInputChange = (e) => {
    const { name, value } = e.target;
    // We store it as a string in formData temporarily
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare payload. We need to ensure arrays are actually arrays if the backend expects them.
      const processArray = (val) => {
        if (Array.isArray(val)) return val; // Already array (didn't touch it)
        if (!val) return [];
        return val.split(/[\n,]+/).map(s => s.trim()).filter(s => s); // Split by newline or comma
      };

      const payload = {
        ...formData,
        secondaryDiagnoses: processArray(formData.secondaryDiagnoses),
        dischargeMedications: typeof formData.dischargeMedications === 'string' 
            ? processArray(formData.dischargeMedications).map(item => ({ name: item, dose: '', frequency: '' })) // simplified for string edit
            : formData.dischargeMedications, // If complex object wasn't touched
        procedures: processArray(formData.procedures),
      };

      const response = await axiosInstance.put(`/discharge/update/${data._id}`, payload);
      setData(response.data.summary);
      setFormData(response.data.summary); // Reset form to new data
      setIsEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  const handleGeneratePdf = async () => {
    setPdfLoading(true);
    try {
      const res = await axiosInstance.get(`/discharge/generate-pdf/${data._id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Summary-${data.patient.mrn}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      alert('Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  // ---------------------------
  // Render Helpers
  // ---------------------------
  
  // Displays list as bullets (View Mode) or returns string (Edit Mode helper)
  const renderList = (arr) => {
    if (!arr || arr.length === 0) return null;
    // If array of objects (like medications with dose), try to format string
    if (typeof arr[0] === 'object') {
      return (
        <ul className="list-disc pl-5">
          {arr.map((item, i) => (
             <li key={i}>
               {item.name} {item.dose ? `- ${item.dose}` : ''} {item.frequency ? `(${item.frequency})` : ''}
               {item.date ? ` - ${new Date(item.date).toLocaleDateString()}` : ''}
             </li>
          ))}
        </ul>
      );
    }
    // Simple string array
    return (
      <ul className="list-disc pl-5">
        {arr.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    );
  };

  // Converts array to string for the Textarea initial value
  const getArrayString = (arr) => {
     if (!arr) return '';
     if (typeof arr === 'string') return arr; // Already editing
     if (arr.length > 0 && typeof arr[0] === 'object') {
        return arr.map(item => item.name || item.description).join(', ');
     }
     return arr.join(', ');
  };

  const canEdit = user?.role === 'admin' || user?.role === 'doctor';

  if (loading || hospitalLoading) return <div className="p-12 text-center font-bold text-gray-500 animate-pulse">Loading Patient Summary...</div>;
  if (error) return <div className="p-12 text-center text-red-600 font-bold border border-red-200 bg-red-50 m-4 rounded">{error}</div>;
  if (!data) return <div className="p-12 text-center">No discharge summary found.</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      
      {/* GLOBAL STYLES FOR PRINT */}
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 1cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .no-print, button { display: none !important; }
          .print-only { display: block !important; }
          /* Prevent breaking inside sections */
          .break-inside-avoid { page-break-inside: avoid; }
          .break-before { page-break-before: always; }
        }
      `}</style>

      {/* --- TOOLBAR (Hidden on print) --- */}
      <div className="max-w-4xl mx-auto mb-6 px-4 flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
        <h2 className="text-xl font-bold text-gray-700">Discharge Management</h2>
        <div className="flex gap-2 flex-wrap justify-center">
           <button onClick={() => navigate(`/patients/${id}/invoice`)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded shadow flex items-center font-medium">
             <FaFileInvoice className="mr-2" /> Invoice
           </button>
           <button onClick={handleGeneratePdf} disabled={pdfLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow flex items-center font-medium">
             {pdfLoading ? '...' : <><FaFilePdf className="mr-2" /> PDF</>}
           </button>
           <button onClick={handlePrint} className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded shadow flex items-center font-medium">
             <FaPrint className="mr-2" /> Print
           </button>
           
           {canEdit && (
             isEditing ? (
               <>
                 <button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow flex items-center font-medium">
                   {saving ? '...' : <><FaSave className="mr-2" /> Save Changes</>}
                 </button>
                 <button onClick={() => { setIsEditing(false); setFormData(data); }} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow flex items-center font-medium">
                   <FaTimes className="mr-2" /> Cancel
                 </button>
               </>
             ) : (
               <button onClick={() => setIsEditing(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow flex items-center font-medium">
                 <FaEdit className="mr-2" /> Edit Summary
               </button>
             )
           )}
        </div>
      </div>

      {/* --- DOCUMENT PAPER --- */}
      <div className="max-w-4xl mx-auto bg-white shadow-xl p-12 print:shadow-none print:p-0 print:w-full print:max-w-none">
        
        <DischargeHeader hospitalDetails={hospitalDetails} />
        <PatientInfoGrid data={data} />

        {/* --- CLINICAL SECTIONS --- */}
        <div className="space-y-1">
          
          <Section 
            title="Admission Diagnosis" 
            isEditing={isEditing} 
            name="primaryDiagnosis" 
            value={formData.primaryDiagnosis} 
            onChange={handleInputChange}
          >
            {data.primaryDiagnosis}
          </Section>

          <Section 
            title="Secondary Diagnoses" 
            isEditing={isEditing} 
            name="secondaryDiagnoses" 
            value={getArrayString(formData.secondaryDiagnoses)} 
            onChange={handleArrayInputChange}
            placeholder="Separate by comma"
          >
            {renderList(data.secondaryDiagnoses)}
          </Section>

          <Section 
            title="Treatment Summary" 
            isEditing={isEditing} 
            name="treatmentSummary" 
            value={formData.treatmentSummary} 
            onChange={handleInputChange}
          >
            {data.treatmentSummary}
          </Section>

          <Section 
            title="Discharge Medications" 
            isEditing={isEditing} 
            name="dischargeMedications" 
            value={getArrayString(formData.dischargeMedications)} 
            onChange={handleArrayInputChange}
            placeholder="e.g., Paracetamol 1g TDS, Amoxicillin 500mg BD"
          >
            {renderList(data.dischargeMedications)}
          </Section>

          <Section 
            title="Procedures Performed" 
            isEditing={isEditing} 
            name="procedures" 
            value={getArrayString(formData.procedures)} 
            onChange={handleArrayInputChange}
          >
            {renderList(data.procedures)}
          </Section>

          <Section 
            title="Follow Up Advice" 
            isEditing={isEditing} 
            name="followUpAdvice" 
            value={formData.followUpAdvice} 
            onChange={handleInputChange}
          >
            {data.followUpAdvice}
          </Section>

          <Section 
            title="Additional Notes" 
            isEditing={isEditing} 
            name="notes" 
            value={formData.notes} 
            onChange={handleInputChange}
          >
            {data.notes}
          </Section>
        </div>

        {/* --- SIGNATURE FOOTER --- */}
        <div className="mt-16 pt-8 border-t-2 border-black flex justify-between items-end break-inside-avoid">
          <div>
            <p className="font-bold text-sm uppercase text-gray-600 print:text-black">Prepared By:</p>
            <p className="text-lg font-semibold mt-2">{data.createdBy?.name || 'Doctor Signature'}</p>
            <p className="text-xs text-gray-500 print:text-black">Valid without seal if generated electronically.</p>
          </div>
          <div className="text-right text-xs text-gray-500 print:text-black">
             Generated on: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* --- APPENDIX (Prescription History) --- */}
      {prescriptions.length > 0 && (
        <div className="max-w-4xl mx-auto mt-8 bg-white shadow-lg p-8 print:break-before print:shadow-none print:p-0">
          <h3 className="text-lg font-bold border-b-2 border-black mb-4 uppercase">Appendix: Medication History</h3>
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-gray-100 print:bg-gray-200">
              <tr>
                <th className="p-2 border border-gray-300 print:border-black">Date</th>
                <th className="p-2 border border-gray-300 print:border-black">Drug</th>
                <th className="p-2 border border-gray-300 print:border-black">Qty</th>
                <th className="p-2 border border-gray-300 print:border-black">Instructions</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((pres, pIdx) => 
                Array.isArray(pres.drugs) && pres.drugs.map((drug, dIdx) => (
                  <tr key={`${pIdx}-${dIdx}`}>
                    <td className="p-2 border border-gray-300 print:border-black">{new Date(pres.createdAt).toLocaleDateString()}</td>
                    <td className="p-2 border border-gray-300 print:border-black">{drug.drug?.name}</td>
                    <td className="p-2 border border-gray-300 print:border-black">{drug.quantity}</td>
                    <td className="p-2 border border-gray-300 print:border-black">{drug.instructions}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default DetailedDischargeSummary;