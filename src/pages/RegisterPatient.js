import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Toast from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';

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
  currentMedications: '',
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
};

const options = {
  religion: ['Christian', 'Muslim', 'Hindu', 'Buddhist', 'Sikh', 'Jewish', 'Other', 'Prefer not to say'],
  nationality: ['Kenyan', 'Ugandan', 'Tanzanian', 'Nigerian', 'American', 'British', 'Indian', 'Chinese', 'Other'],
  nextOfKinRelationship: ['Parent', 'Spouse', 'Sibling', 'Child', 'Grandparent', 'Guardian', 'Other'],
  bloodGroup: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  allergies: ['None', 'Pollen', 'Dust Mites', 'Peanuts', 'Shellfish', 'Other'],
  occupation: ['Healthcare', 'Technology', 'Education', 'Business', 'Student', 'Unemployed', 'Other'],
  educationLevel: ['Primary', 'Secondary', 'Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Other'],
  disabilityStatus: ['None', 'Physical', 'Sensory', 'Intellectual', 'Mental', 'Other'],
};

const FormSection = ({ title, children }) => (
  <div className="col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      {children}
    </div>
  </div>
);

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

  useEffect(() => { loadDoctors(); fetchNextPatientNumber(); }, []);
  useEffect(()=>{
    try{
      const draft = localStorage.getItem('patientFormDraft');
      if(draft){
        const parsed = JSON.parse(draft);
        setForm(f => ({ ...f, ...parsed }));
      }
    }catch(e){}
  }, []);
  useEffect(()=>{
    try{ localStorage.setItem('patientFormDraft', JSON.stringify(form)); }catch(e){}
  }, [form]);

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

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    setErrors({});

    const phoneRegex = /^[0-9+()\-\s]{7,20}$/;
    if(!form.phonePrimary || !phoneRegex.test(form.phonePrimary)){
      setErrors({ phonePrimary: 'Enter a valid primary phone number' });
      setLoading(false);
      return;
    }
    if(form.age && Number(form.age) < 18){
      if(!form.guardianInfo && !form.nextOfKinName){
        setErrors({ guardianInfo: 'Guardian or next of kin required for minors' });
        setLoading(false);
        return;
      }
    }
    try {
      const payload = {
        ...form,
        nextOfKin: {
          name: form.nextOfKinName,
          relationship: form.nextOfKinRelationship,
          phone: form.nextOfKinPhone,
          altPhone: form.nextOfKinAltPhone,
          address: form.nextOfKinAddress
        },
        allergies: form.allergies ? form.allergies.split(',').map(a => a.trim()) : [],
        assignedDoctor: doctorId || undefined,
        createdBy: user?._id
      };

      const res = await axiosInstance.post('/patients/register', payload);
      const createdPatient = res.data.patient || res.data;
      setCreatedPatient(createdPatient);
      setToast({ message: 'Patient registered successfully, redirecting...', type: 'success' });
      setForm({ ...initialForm, hospitalId: form.hospitalId });
      setDoctorId('');
      try{ localStorage.removeItem('patientFormDraft'); }catch(e){}
      setTimeout(() => {
        navigate(`/patients/${createdPatient._id}`);
      }, 1500);
    } catch (e) {
      console.error(e);
      const srv = e?.response?.data || {};
      if(srv.errors) setErrors(srv.errors);
      setToast({ message: srv.message || 'Failed to register patient', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (name, placeholder, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{placeholder}</label>
      <input name={name} value={form[name]} onChange={onChange} placeholder={placeholder} type={type} className="input" required={required} />
    </div>
  );

  const renderSelect = (name, placeholder, opts, required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{placeholder}</label>
      <select name={name} value={form[name]} onChange={onChange} className="input" required={required}>
        <option value="">-- select {placeholder.toLowerCase()} --</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
  
  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Register New Patient</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {Object.keys(errors).length > 0 && (
            <div className="col-span-2 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
              <p className="font-bold mb-2">Please correct the following errors:</p>
              <ul className="list-disc pl-5 space-y-1">
                {Object.entries(errors).map(([k,v])=> <li key={k} className="text-sm">{v}</li>)}
              </ul>
            </div>
          )}

          <FormSection title="Patient Identification">
            {renderInput("hospitalId", "Patient Number (auto)", "text")}
            {renderInput("nationalId", "National ID / Passport No.", "text")}
          </FormSection>

          <FormSection title="Personal Information">
            {renderInput("firstName", "First Name", "text", true)}
            {renderInput("middleName", "Middle Name", "text")}
            {renderInput("lastName", "Last Name", "text", true)}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input name="dob" value={form.dob} onChange={onChange} className="input" type="date" required />
              <div className="text-sm text-gray-500 mt-1">Age: {form.age || '—'}</div>
            </div>
            {renderSelect("gender", "Gender", ["Male", "Female", "Other"], true)}
            {renderSelect("maritalStatus", "Marital Status", ["Single", "Married", "Divorced", "Widowed"])}
            {renderSelect("nationality", "Nationality", options.nationality)}
            {renderInput("ethnicity", "Ethnicity (optional)", "text")}
          </FormSection>

          <FormSection title="Contact Information">
            {renderInput("phonePrimary", "Primary Phone Number", "tel", true)}
            {renderInput("phoneSecondary", "Secondary Phone Number", "tel")}
            {renderInput("email", "Email Address (optional)", "email")}
            {renderInput("postalAddress", "Postal Address (optional)", "text")}
            <div className="md:col-span-2">{renderInput("address", "Home Address", "text")}</div>
            {renderInput("county", "County", "text")}
            {renderInput("subCounty", "Sub-County", "text")}
            {renderInput("ward", "Ward", "text")}
          </FormSection>

          <FormSection title="Next of Kin / Emergency Contact">
            {renderInput("nextOfKinName", "Name", "text")}
            {renderSelect("nextOfKinRelationship", "Relationship", options.nextOfKinRelationship)}
            {renderInput("nextOfKinPhone", "Phone Number", "tel")}
            {renderInput("nextOfKinAltPhone", "Alternate Phone", "tel")}
            <div className="md:col-span-2">{renderInput("nextOfKinAddress", "Address", "text")}</div>
          </FormSection>

          <FormSection title="Medical & Clinical Information">
            {renderSelect("bloodGroup", "Blood Group", options.bloodGroup)}
            {renderSelect("allergies", "Allergies", options.allergies)}
            {renderInput("chronicConditions", "Chronic Conditions", "text")}
            {renderInput("currentMedications", "Current Medications", "text")}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Past Medical History / Notes</label>
              <textarea name="pastMedicalHistory" value={form.pastMedicalHistory} onChange={onChange} placeholder="Past Medical History / Notes" className="input" />
            </div>
            {renderInput("surgicalHistory", "Surgical History (optional)", "text")}
          </FormSection>

          <FormSection title="Insurance & Billing">
            {renderSelect("paymentMode", "Payment Mode", ["Cash", "Insurance", "Corporate", "NHIF"])}
            {renderInput("insuranceProvider", "Insurance Provider", "text")}
            {renderInput("insuranceCardNumber", "Insurance Card Number", "text")}
            {renderInput("nhifNumber", "NHIF Number", "text")}
            {renderInput("employer", "Employer (Corporate)", "text")}
            {renderInput("corporateNumber", "Corporate Member Number", "text")}
          </FormSection>

          <FormSection title="Additional Demographic Info">
            {renderSelect("occupation", "Occupation", options.occupation)}
            {renderSelect("religion", "Religion", options.religion)}
            {renderSelect("educationLevel", "Education Level", options.educationLevel)}
            {renderSelect("disabilityStatus", "Disability Status", options.disabilityStatus)}
            {renderInput("guardianInfo", "Guardian Info (for minors)", "text")}
          </FormSection>

          <div className="col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            {renderSelect("doctorId", "Assign Doctor (optional)", doctors.map(d => ({ value: d._id, label: `${d.user?.name} (${d.user?.email})` })).map(item => <option key={item.value} value={item.value}>{item.label}</option>))}
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button type="button" className="btn-muted" onClick={() => setForm(initialForm)}>Reset</button>
            <button className="btn-brand" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register Patient'}</button>
          </div>
        </form>

        {createdPatient && (
          <div className="mt-8 p-4 bg-green-50 rounded-lg shadow">
            <div className="font-semibold text-lg text-green-800">Patient Registered Successfully!</div>
            <div>Name: {createdPatient.user?.name || createdPatient.name}</div>
            <div>Patient Number: {createdPatient.hospitalId}</div>
            <div>MRN: {createdPatient.mrn}</div>
          </div>
        )}
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  );
}
