import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Toast from '../components/ui/Toast';

const CreateAppointment = () => {
  const { axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [patient, setPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointmentDetails, setAppointmentDetails] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    status: 'scheduled',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const patientId = params.get('patientId');
    if (patientId) {
      setAppointmentDetails(prev => ({ ...prev, patientId }));
      axiosInstance.get(`/patients/${patientId}`)
        .then(res => setPatient(res.data))
        .catch(err => {
          console.error('Failed to fetch patient details', err);
          setToast({ message: 'Failed to load patient data.', type: 'error' });
        });
    }

    axiosInstance.get('/doctors/list')
      .then(res => setDoctors(res.data.doctors || []))
      .catch(err => {
        console.error('Failed to fetch doctors', err);
        setToast({ message: 'Failed to load doctors list.', type: 'error' });
      });
  }, [location.search, axiosInstance]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAppointmentDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      // Ensure appointmentDate and appointmentTime are combined correctly
      const payload = {
        ...appointmentDetails,
        appointmentDate: appointmentDetails.appointmentDate,
        appointmentTime: appointmentDetails.appointmentTime,
      };
      await axiosInstance.post('/appointments', payload);
      setToast({ message: 'Appointment created successfully!', type: 'success' });
      setTimeout(() => navigate('/dashboard/appointments'), 2000);
    } catch (error) {
      console.error('Failed to create appointment', error);
      const errorMsg = error.response?.data?.message || 'An unexpected error occurred.';
      setToast({ message: `Failed to create appointment: ${errorMsg}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Create New Appointment</h2>
        {!patient && (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Patient Not Found</h3>
            <p className="text-gray-500">Unable to load patient details. Please check the patient selection or try again.</p>
          </div>
        )}
        {patient && (
          <>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Patient Details</h3>
              <p className="mt-2"><strong>Name:</strong> {patient.user.name}</p>
              <p><strong>MRN:</strong> {patient.mrn}</p>
            </div>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                  <select
                    name="doctorId"
                    value={appointmentDetails.doctorId}
                    onChange={handleInputChange}
                    className="input"
                    required
                  >
                    <option value="">-- Select a Doctor --</option>
                    {doctors.map(doc => (
                      <option key={doc._id} value={doc._id}>{doc.user.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    name="appointmentDate"
                    value={appointmentDetails.appointmentDate}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Time</label>
                  <input
                    type="time"
                    name="appointmentTime"
                    value={appointmentDetails.appointmentTime}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Appointment</label>
                  <textarea
                    name="reason"
                    value={appointmentDetails.reason}
                    onChange={handleInputChange}
                    className="input"
                    rows="4"
                    placeholder="Enter a brief reason for the visit"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  className="btn-brand"
                  disabled={loading || !appointmentDetails.patientId}
                >
                  {loading ? 'Creating...' : 'Create Appointment'}
                </button>
              </div>
            </form>
          </>
        )}
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  );
};

export default CreateAppointment;
