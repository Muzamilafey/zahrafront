import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Toast from '../components/ui/Toast';

const initialForm = {
  hospitalId: '', // patient number / auto increment
  nationalId: '',
  firstName: '',
  middleName: '',
  lastName: '',
  dob: '',
  age: '',
  gender: '',
  maritalStatus: '',
  nationality: '',
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

export default function RegisterPatient() {
  const { axiosInstance, user } = useContext(AuthContext);
  const [form, setForm] = useState(initialForm);
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createdPatient, setCreatedPatient] = useState(null);

  useEffect(() => { loadDoctors(); fetchNextPatientNumber(); }, []);

  const loadDoctors = async () => {
    try {
      const res = await axiosInstance.get('/doctors/list');
      setDoctors(res.data.doctors || []);
    } catch (e) { console.error(e); }
  };

  const fetchNextPatientNumber = async () => {
    try {
      // backend may provide a next patient number endpoint
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
    try {
      const payload = {
        // simple mapping - backend should accept these fields or adapt accordingly
        hospitalId: form.hospitalId,
        nationalId: form.nationalId,
        name: `${form.firstName} ${form.middleName} ${form.lastName}`.trim(),
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        dob: form.dob,
        age: form.age,
        gender: form.gender,
        maritalStatus: form.maritalStatus,
        nationality: form.nationality,
        ethnicity: form.ethnicity,

        phonePrimary: form.phonePrimary,
        phoneSecondary: form.phoneSecondary,
        email: form.email,
        address: form.address,
        county: form.county,
        subCounty: form.subCounty,
        ward: form.ward,
        postalAddress: form.postalAddress,

        nextOfKin: {
          name: form.nextOfKinName,
          relationship: form.nextOfKinRelationship,
          phone: form.nextOfKinPhone,
          altPhone: form.nextOfKinAltPhone,
          address: form.nextOfKinAddress,
        },

        clinical: {
          bloodGroup: form.bloodGroup,
          allergies: form.allergies,
          chronicConditions: form.chronicConditions,
          currentMedications: form.currentMedications,
          pastMedicalHistory: form.pastMedicalHistory,
          surgicalHistory: form.surgicalHistory,
        },

        billing: {
          paymentMode: form.paymentMode,
          insuranceProvider: form.insuranceProvider,
          insuranceCardNumber: form.insuranceCardNumber,
          nhifNumber: form.nhifNumber,
          employer: form.employer,
          corporateNumber: form.corporateNumber,
        },

        demographics: {
          occupation: form.occupation,
          religion: form.religion,
          educationLevel: form.educationLevel,
          disabilityStatus: form.disabilityStatus,
          guardianInfo: form.guardianInfo,
        },

        assignedDoctor: doctorId,
        createdBy: user?._id,
      };

      const res = await axiosInstance.post('/patients/create', payload);
      setCreatedPatient(res.data.patient || res.data);
      setToast({ message: 'Patient registered successfully', type: 'success' });
      setForm({ ...initialForm, hospitalId: form.hospitalId });
      setDoctorId('');
    } catch (e) {
      console.error(e);
      setToast({ message: e?.response?.data?.message || 'Failed to register patient', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Register New Patient</h2>
      <form className="bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
        <div className="col-span-2 flex gap-4">
          <input name="hospitalId" value={form.hospitalId} onChange={onChange} placeholder="Patient Number (auto)" className="input" />
          <input name="nationalId" value={form.nationalId} onChange={onChange} placeholder="National ID / Passport / Birth Cert No" className="input" />
        </div>

        <input name="firstName" value={form.firstName} onChange={onChange} placeholder="First Name" className="input" required />
        <input name="middleName" value={form.middleName} onChange={onChange} placeholder="Middle Name (optional)" className="input" />
        <input name="lastName" value={form.lastName} onChange={onChange} placeholder="Last Name" className="input" required />

        <div>
          <label className="text-sm text-gray-600">Date of Birth</label>
          <input name="dob" value={form.dob} onChange={onChange} className="input" type="date" required />
          <div className="text-sm text-gray-500">Age: {form.age || '—'}</div>
        </div>

        <select name="gender" value={form.gender} onChange={onChange} className="input" required>
          <option value="">-- select gender --</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <select name="maritalStatus" value={form.maritalStatus} onChange={onChange} className="input">
          <option value="">-- marital status --</option>
          <option value="single">Single</option>
          <option value="married">Married</option>
          <option value="divorced">Divorced</option>
          <option value="widowed">Widowed</option>
        </select>

        <input name="nationality" value={form.nationality} onChange={onChange} placeholder="Nationality" className="input" />
        <input name="ethnicity" value={form.ethnicity} onChange={onChange} placeholder="Ethnicity (optional)" className="input" />

        <input name="phonePrimary" value={form.phonePrimary} onChange={onChange} placeholder="Phone Number (Primary)" className="input" required />
        <input name="phoneSecondary" value={form.phoneSecondary} onChange={onChange} placeholder="Phone Number (Secondary)" className="input" />

        <input name="email" value={form.email} onChange={onChange} placeholder="Email (optional)" className="input" type="email" />
        <input name="postalAddress" value={form.postalAddress} onChange={onChange} placeholder="Postal Address (optional)" className="input" />

        <input name="address" value={form.address} onChange={onChange} placeholder="Home Address" className="input col-span-2" />
        <input name="county" value={form.county} onChange={onChange} placeholder="County" className="input" />
        <input name="subCounty" value={form.subCounty} onChange={onChange} placeholder="Sub-County" className="input" />
        <input name="ward" value={form.ward} onChange={onChange} placeholder="Ward" className="input" />

        <div className="col-span-2 border-t pt-4">
          <h4 className="font-medium">Next of Kin / Emergency Contact</h4>
          <input name="nextOfKinName" value={form.nextOfKinName} onChange={onChange} placeholder="Name" className="input" />
          <input name="nextOfKinRelationship" value={form.nextOfKinRelationship} onChange={onChange} placeholder="Relationship" className="input" />
          <input name="nextOfKinPhone" value={form.nextOfKinPhone} onChange={onChange} placeholder="Phone" className="input" />
          <input name="nextOfKinAltPhone" value={form.nextOfKinAltPhone} onChange={onChange} placeholder="Alternate Phone" className="input" />
          <input name="nextOfKinAddress" value={form.nextOfKinAddress} onChange={onChange} placeholder="Address" className="input" />
        </div>

        <div className="col-span-2 border-t pt-4">
          <h4 className="font-medium">Medical & Clinical Information</h4>
          <input name="bloodGroup" value={form.bloodGroup} onChange={onChange} placeholder="Blood Group" className="input" />
          <input name="allergies" value={form.allergies} onChange={onChange} placeholder="Allergies (comma separated)" className="input" />
          <input name="chronicConditions" value={form.chronicConditions} onChange={onChange} placeholder="Chronic Conditions" className="input" />
          <input name="currentMedications" value={form.currentMedications} onChange={onChange} placeholder="Current Medications" className="input" />
          <textarea name="pastMedicalHistory" value={form.pastMedicalHistory} onChange={onChange} placeholder="Past Medical History / Notes" className="input" />
          <input name="surgicalHistory" value={form.surgicalHistory} onChange={onChange} placeholder="Surgical History (optional)" className="input" />
        </div>

        <div className="col-span-2 border-t pt-4">
          <h4 className="font-medium">Insurance / Billing</h4>
          <select name="paymentMode" value={form.paymentMode} onChange={onChange} className="input">
            <option value="">-- payment mode --</option>
            <option value="cash">Cash</option>
            <option value="insurance">Insurance</option>
            <option value="corporate">Corporate</option>
            <option value="nhif">NHIF</option>
          </select>
          <input name="insuranceProvider" value={form.insuranceProvider} onChange={onChange} placeholder="Insurance Provider" className="input" />
          <input name="insuranceCardNumber" value={form.insuranceCardNumber} onChange={onChange} placeholder="Insurance Card Number" className="input" />
          <input name="nhifNumber" value={form.nhifNumber} onChange={onChange} placeholder="NHIF Number" className="input" />
          <input name="employer" value={form.employer} onChange={onChange} placeholder="Employer (Corporate)" className="input" />
          <input name="corporateNumber" value={form.corporateNumber} onChange={onChange} placeholder="Corporate Member Number" className="input" />
        </div>

        <div className="col-span-2 border-t pt-4">
          <h4 className="font-medium">Additional Demographic Info</h4>
          <input name="occupation" value={form.occupation} onChange={onChange} placeholder="Occupation" className="input" />
          <input name="religion" value={form.religion} onChange={onChange} placeholder="Religion" className="input" />
          <input name="educationLevel" value={form.educationLevel} onChange={onChange} placeholder="Education Level" className="input" />
          <input name="disabilityStatus" value={form.disabilityStatus} onChange={onChange} placeholder="Disability Status" className="input" />
          <input name="guardianInfo" value={form.guardianInfo} onChange={onChange} placeholder="Guardian Info (for minors)" className="input" />
        </div>

        <select value={doctorId} onChange={e => setDoctorId(e.target.value)} className="input col-span-2">
          <option value="">-- assign doctor (optional) --</option>
          {doctors.map(d => (
            <option key={d._id} value={d._id}>{d.user?.name} ({d.user?.email})</option>
          ))}
        </select>

        <div className="col-span-2 flex gap-2">
          <button className="btn-brand flex-1" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register Patient'}</button>
          <button type="button" className="btn-muted" onClick={() => setForm(initialForm)}>Reset</button>
        </div>
      </form>

      {createdPatient && (
        <div className="mt-4 p-4 bg-green-50 rounded shadow">
          <div className="font-semibold">Patient Registered:</div>
          <div>Name: {createdPatient.user?.name || createdPatient.name}</div>
          <div>Patient Number: {createdPatient.hospitalId}</div>
          <div>MRN: {createdPatient.mrn}</div>
        </div>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
