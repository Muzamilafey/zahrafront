import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Toast from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaHeartbeat, FaFileInvoiceDollar, FaPlus, FaTrash } from 'react-icons/fa';

const initialForm = {
  hospitalId: '',
  nationalId: '',
  firstName: '',
  middleName: '',
  lastName: '',
  dob: '',
  age: '',
  gender: '',
  maritalStatus: '',
  nationality: 'Kenyan',
  ethnicity: '',

  phonePrimary: '',
  phoneSecondary: '',
  email: '',
  address: '',
  county: '',
  subCounty: '',
  ward: '',
  postalAddress: '',

  nextOfKinName: '',
  nextOfKinRelationship: '',
  nextOfKinPhone: '',
  nextOfKinAltPhone: '',
  nextOfKinAddress: '',

  bloodGroup: '',
  allergies: '',
  chronicConditions: '',
  pastMedicalHistory: '',
  surgicalHistory: '',

  paymentMode: '',
  insuranceProvider: '',
  insuranceCardNumber: '',
  nhifNumber: '',
  employer: '',
  corporateNumber: '',

  occupation: '',
  religion: '',
  educationLevel: '',
  disabilityStatus: '',
  guardianInfo: '',
  
  smokingStatus: 'Never',
  alcoholStatus: 'Never',
};

const options = {
  religion: ['Christian', 'Muslim', 'Hindu', 'Buddhist', 'Sikh', 'Jewish', 'Other', 'Prefer not to say'],
  nationality: ['Kenyan', 'Ugandan', 'Tanzanian', 'Nigerian', 'American', 'British', 'Indian', 'Chinese', 'Other'],
  nextOfKinRelationship: ['Parent', 'Spouse', 'Sibling', 'Child', 'Grandparent', 'Guardian', 'Other'],
  bloodGroup: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  occupation: ['Healthcare', 'Technology', 'Education', 'Business', 'Student', 'Unemployed', 'Other'],
  educationLevel: ['Primary', 'Secondary', 'Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Other'],
  disabilityStatus: ['None', 'Physical', 'Sensory', 'Intellectual', 'Mental', 'Other'],
  lifestyle: ['Never', 'Occasionally', 'Regularly', 'Daily'],
};

const TabButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 outline-none focus:outline-none ${
      active
        ? 'border-brand-500 text-brand-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    {children}
  </button>
);

const Section = ({ children }) => <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">{children}</div>;
const SectionTitle = ({ children }) => <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">{children}</h3>;

export default function RegisterPatient() {
  const { axiosInstance, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createdPatient, setCreatedPatient] = useState(null);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('patientInfo');
  
  const [medications, setMedications] = useState([{ name: '', dosage: '', frequency: '' }]);
  const [hasAllergies, setHasAllergies] = useState(false);
  const [hasChronicConditions, setHasChronicConditions] = useState(false);
  const [showPostRegistrationModal, setShowPostRegistrationModal] = useState(false);

  const loadDoctors = async () => {
    try {
      const res = await axiosInstance.get('/doctors/list');
      setDoctors(res.data.doctors || []);
    } catch (e) { console.error(e); }
  };

  const fetchNextPatientNumber = async () => {
    try {
      const res = await axiosInstance.get('/patients/next-number').catch(() => null);
      if (res && (res.data.next || res.data.hospitalId)) {
        setForm(f => ({ ...f, hospitalId: res.data.next || res.data.hospitalId }));
      }
    } catch (e) { console.warn('Could not fetch next patient number'); }
  };

  useEffect(() => { 
    loadDoctors(); 
    fetchNextPatientNumber(); 
  }, []);

  const calculateAge = dob => {
    if (!dob) return '';
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const onChange = e => {
    const { name, value } = e.target;
    setForm(f => {
      const next = { ...f, [name]: value };
      if (name === 'dob') next.age = calculateAge(value);
      return next;
    });
  };

  const handleMedicationChange = (index, e) => {
    const newMeds = [...medications];
    newMeds[index][e.target.name] = e.target.value;
    setMedications(newMeds);
  };

  const addMedication = () => setMedications([...medications, { name: '', dosage: '', frequency: '' }]);
  const removeMedication = (index) => setMedications(medications.filter((_, i) => i !== index));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    setErrors({});

    try {
      const payload = {
        ...form,
        currentMedications: medications.filter(m => m.name).map(m => `${m.name} (${m.dosage} ${m.frequency})`).join(', '),
        allergies: hasAllergies ? form.allergies : 'None',
        chronicConditions: hasChronicConditions ? form.chronicConditions : 'None',
        assignedDoctor: doctorId || undefined,
        createdBy: user?._id
      };
      delete payload.medications;

      // Debug: log payload before sending to help diagnose 400 errors
      console.debug('[RegisterPatient] payload:', payload);

      const res = await axiosInstance.post('/patients/register', payload);
      const createdPatient = res.data.patient || res.data;
      setCreatedPatient(createdPatient);
      setToast({ message: 'Patient registered successfully!', type: 'success' });
      setForm({ ...initialForm, hospitalId: form.hospitalId });
      setDoctorId('');
      setShowPostRegistrationModal(true);
    } catch (e) {
      console.error('[RegisterPatient] registration error', e);

      // Enhanced error logging
      if (e.response) {
        console.error('Server Response:', e.response.data);
      }

      const srv = e?.response?.data || {};
      // show any validation errors returned by server
      if (srv.errors && typeof srv.errors === 'object') {
        setErrors(srv.errors);
        console.warn('[RegisterPatient] server validation errors:', srv.errors);
      }

      // If server returned a message or details, include them in toast
      const serverMsg = srv.message || (srv.error && (srv.error.message || srv.error)) || null;
      if (serverMsg) {
        setToast({ message: `Failed to register patient: ${serverMsg}`, type: 'error' });
      } else {
        setToast({ message: 'Failed to register patient (see console/network for details)', type: 'error' });
      }
      // also expose full server response for debugging
      if (e?.response) console.debug('[RegisterPatient] server response:', e.response);
    } finally {
      setLoading(false);
    }
  };

  const maxDob = new Date(); // allow DOB up to today

  const renderInput = (name, label, type = 'text', required = false, pattern) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input name={name} value={form[name]} onChange={onChange} placeholder={label} type={type} className="input" required={required} pattern={pattern} />
    </div>
  );

  const renderSelect = (name, label, opts, required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select name={name} value={form[name]} onChange={onChange} className="input" required={required}>
        <option value="">-- Select {label.toLowerCase()} --</option>
        {opts.map((o) => {
          if (typeof o === 'string') return <option key={o} value={o}>{o}</option>;
          // object shape { value, label }
          return <option key={o.value} value={o.value}>{o.label}</option>;
        })}
      </select>
    </div>
  );
  
  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">New Patient Registration</h2>
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <TabButton active={activeTab === 'patientInfo'} onClick={() => setActiveTab('patientInfo')}><FaUser className="mr-2"/>Patient Information</TabButton>
            <TabButton active={activeTab === 'medicalHistory'} onClick={() => setActiveTab('medicalHistory')}><FaHeartbeat className="mr-2"/>Medical History</TabButton>
            <TabButton active={activeTab === 'billing'} onClick={() => setActiveTab('billing')}><FaFileInvoiceDollar className="mr-2"/>Billing & Demographics</TabButton>
          </nav>
        </div>
        
        <form className="space-y-8" onSubmit={handleSubmit}>
          {activeTab === 'patientInfo' && (
            <Section>
              <SectionTitle>Personal & Contact Details</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderInput("firstName", "First Name", "text", true)}
                {renderInput("middleName", "Middle Name")}
                {renderInput("lastName", "Last Name", "text", true)}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input name="dob" value={form.dob} onChange={onChange} className="input" type="date" required max={maxDob.toISOString().split("T")[0]}/>
                  <div className="text-sm text-gray-500 mt-1">Age: {form.age || '—'}</div>
                </div>
                {renderSelect("gender", "Gender", [
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' }
                ], true)}
                {renderSelect("maritalStatus", "Marital Status", [
                  { value: 'single', label: 'Single' },
                  { value: 'married', label: 'Married' },
                  { value: 'divorced', label: 'Divorced' },
                  { value: 'widowed', label: 'Widowed' }
                ])}
                {renderInput("nationalId", "National ID / Passport No.")}
                {renderInput("phonePrimary", "Primary Phone (07...)", "tel", true, "[0-9]{10}")}
                {renderInput("phoneSecondary", "Secondary Phone", "tel", false, "[0-9]{10}")}
                {renderInput("email", "Email Address", "email")}
                <div className="lg:col-span-3">{renderInput("address", "Home Address")}</div>
              </div>
              <SectionTitle>Next of Kin</SectionTitle>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderInput("nextOfKinName", "Name")}
                {renderSelect("nextOfKinRelationship", "Relationship", options.nextOfKinRelationship)}
                {renderInput("nextOfKinPhone", "Phone Number", "tel", false, "[0-9]{10}")}
              </div>
            </Section>
          )}

          {activeTab === 'medicalHistory' && (
             <Section>
              <SectionTitle>Medical & Clinical Information</SectionTitle>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSelect("bloodGroup", "Blood Group", options.bloodGroup)}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Do you have any allergies?</label>
                  <select className="input" onChange={(e) => setHasAllergies(e.target.value === 'Yes')}>
                    <option>No</option><option>Yes</option>
                  </select>
                  {hasAllergies && <textarea name="allergies" value={form.allergies} onChange={onChange} placeholder="Please list all allergies" className="input mt-2" />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Do you have chronic conditions?</label>
                  <select className="input" onChange={(e) => setHasChronicConditions(e.target.value === 'Yes')}>
                    <option>No</option><option>Yes</option>
                  </select>
                  {hasChronicConditions && <textarea name="chronicConditions" value={form.chronicConditions} onChange={onChange} placeholder="Please list all chronic conditions" className="input mt-2" />}
                </div>

                <div className="md:col-span-2">
                  <h4 className="text-md font-semibold text-gray-700 mt-4 mb-2">Current Medications</h4>
                  {medications.map((med, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input name="name" value={med.name} onChange={(e) => handleMedicationChange(index, e)} placeholder="Medication Name" className="input flex-1" />
                      <input name="dosage" value={med.dosage} onChange={(e) => handleMedicationChange(index, e)} placeholder="Dosage" className="input w-32" />
                      <input name="frequency" value={med.frequency} onChange={(e) => handleMedicationChange(index, e)} placeholder="Frequency" className="input w-32" />
                      <button type="button" onClick={() => removeMedication(index)} className="p-2 text-red-500 hover:text-red-700"><FaTrash /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addMedication} className="btn-secondary text-sm mt-2"><FaPlus className="inline-block mr-1" /> Add Medication</button>
                </div>
              </div>

              <SectionTitle>Lifestyle</SectionTitle>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {renderSelect("smokingStatus", "Smoking Status", options.lifestyle)}
                 {renderSelect("alcoholStatus", "Alcohol Consumption", options.lifestyle)}
              </div>
            </Section>
          )}

          {activeTab === 'billing' && (
            <Section>
              <SectionTitle>Billing & Demographics</SectionTitle>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {renderSelect("paymentMode", "Payment Mode", [
                   { value: 'cash', label: 'Cash' },
                   { value: 'insurance', label: 'Insurance' },
                   { value: 'corporate', label: 'Corporate' },
                   { value: 'nhif', label: 'NHIF' }
                 ])}
                {renderInput("insuranceProvider", "Insurance Provider")}
                {renderInput("insuranceCardNumber", "Insurance Card Number")}
                {renderInput("nhifNumber", "NHIF Number")}
                
                {renderSelect("occupation", "Occupation", options.occupation)}
                {renderSelect("religion", "Religion", options.religion)}
                {renderSelect("educationLevel", "Education Level", options.educationLevel)}
                {renderSelect("disabilityStatus", "Disability Status", options.disabilityStatus)}
              </div>
            </Section>
          )}

          <div className="flex justify-end gap-4 pt-6">
            <button type="button" className="btn-muted" onClick={() => setForm(initialForm)}>Reset Form</button>
            <button className="btn-brand" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register Patient'}</button>
          </div>
        </form>
        
        {showPostRegistrationModal && createdPatient && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="font-semibold text-xl text-green-800">Patient Registered Successfully!</h3>
              <div className="mt-4">
                <p><strong>Name:</strong> {createdPatient.user?.name || createdPatient.name}</p>
                <p><strong>MRN:</strong> {createdPatient.mrn}</p>
              </div>
              <p className="mt-4">What would you like to do next?</p>
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-4">
                <button
                  className="btn-secondary"
                  onClick={() => navigate(`/appointments/new?patientId=${createdPatient._id}`)}
                >
                  Create Appointment
                </button>
                <button
                  className="btn-brand"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to admit this patient now?')) {
                      navigate(`/dashboard/doctor/admitpatient?patientId=${createdPatient._id}`);
                    }
                  }}
                >
                  Admit Patient
                </button>
                <button className="btn-muted" onClick={() => setShowPostRegistrationModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  );
}
