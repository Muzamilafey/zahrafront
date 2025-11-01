import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/inpatient',
  withCredentials: true,
});

// Register, admit, assign room, and bill patient
export const registerAdmitAndBill = async (data) => {
  const res = await API.post('/register-admit-bill', data);
  return res.data;
};

// Record allergy for inpatient
export const recordAllergy = async ({ patientId, allergy }) => {
  const res = await API.post('/allergies', { patientId, allergy });
  return res.data;
};

// Record procedure for inpatient
export const recordProcedure = async ({ patientId, procedure }) => {
  const res = await API.post('/procedures', { patientId, procedure });
  return res.data;
};

// Record internal pharmacy request for inpatient
export const recordInternalPharmacyRequest = async ({ patientId, drugId, qty }) => {
  const res = await API.post('/internal-pharmacy', { patientId, drugId, qty });
  return res.data;
};

// Record radiology request for inpatient
export const recordRadiologyRequest = async ({ patientId, request }) => {
  const res = await API.post('/radiology', { patientId, request });
  return res.data;
};

// Record lab request for inpatient
export const recordLabRequest = async ({ patientId, doctorId, testType }) => {
  const res = await API.post('/lab', { patientId, doctorId, testType });
  return res.data;
};

export default {
  registerAdmitAndBill,
  recordAllergy,
  recordProcedure,
  recordInternalPharmacyRequest,
  recordRadiologyRequest,
  recordLabRequest,
};
