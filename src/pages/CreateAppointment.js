import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function CreateAppointment() {
  const { axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [patientId, setPatientId] = useState(searchParams.get('patientId') || '');
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await axiosInstance.get('/doctors/list');
        setDoctors(res.data.doctors || []);
      } catch (e) {
        console.error(e);
        setError('Failed to load doctors.');
      }
    };
    loadDoctors();
  }, [axiosInstance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const scheduledAt = `${date}T${time}`;
      await axiosInstance.post('/appointments', {
        patientId,
        doctorId,
        scheduledAt,
        reason,
      });
      alert('Appointment created successfully!');
      navigate('/appointments');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create appointment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6">Create Appointment</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
        {error && <div className="p-3 bg-red-50 text-red-700 rounded">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="input"
            placeholder="Patient ID"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="input" required>
            <option value="">-- Select Doctor --</option>
            {doctors.map(d => (
              <option key={d._id} value={d._id}>{d.user?.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Appointment</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input"
            rows="3"
            placeholder="e.g., Follow-up, Consultation"
          ></textarea>
        </div>
        <div className="text-right">
          <button type="submit" className="btn-brand" disabled={loading}>
            {loading ? 'Creating...' : 'Create Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}
