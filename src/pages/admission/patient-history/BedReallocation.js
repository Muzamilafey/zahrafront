import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import Toast from '../../../components/ui/Toast';

export default function BedReallocation() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [wards, setWards] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    wardId: '',
    roomId: '',
    bedId: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    loadPatientDetails();
    loadWards();
  }, [patientId]);

  useEffect(() => {
    if (form.wardId) {
      loadRooms(form.wardId);
    }
  }, [form.wardId]);

  useEffect(() => {
    if (form.roomId) {
      loadBeds(form.roomId);
    }
  }, [form.roomId]);

  const loadPatientDetails = async () => {
    try {
      const res = await axiosInstance.get(`/patients/${patientId}`);
      setPatient(res.data.patient);
    } catch (error) {
      setToast({ message: 'Failed to load patient details', type: 'error' });
    }
  };

  const loadWards = async () => {
    try {
      const res = await axiosInstance.get('/wards');
      setWards(res.data.wards || []);
    } catch (error) {
      setToast({ message: 'Failed to load wards', type: 'error' });
    }
  };

  const loadRooms = async (wardId) => {
    try {
      const res = await axiosInstance.get(`/wards/${wardId}/rooms`);
      setRooms(res.data.rooms || []);
      setForm(prev => ({ ...prev, roomId: '', bedId: '' }));
    } catch (error) {
      setToast({ message: 'Failed to load rooms', type: 'error' });
    }
  };

  const loadBeds = async (roomId) => {
    try {
      const res = await axiosInstance.get(`/rooms/${roomId}/beds`);
      setBeds(res.data.beds?.filter(bed => !bed.isOccupied) || []);
      setForm(prev => ({ ...prev, bedId: '' }));
    } catch (error) {
      setToast({ message: 'Failed to load beds', type: 'error' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.wardId || !form.roomId || !form.bedId || !form.reason) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post(`/patients/${patientId}/reallocate`, form);
      setToast({ message: 'Patient bed reallocated successfully', type: 'success' });
      navigate(`/admission/${patientId}/summary`);
    } catch (error) {
      setToast({
        message: error?.response?.data?.message || 'Failed to reallocate bed',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!patient) {
    return <div className="p-4">Loading patient details...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Bed Reallocation</h2>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium mb-2">Current Location</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <p><span className="font-medium">Patient:</span> {patient.user?.name}</p>
          <p><span className="font-medium">Hospital ID:</span> {patient.hospitalId}</p>
          <p><span className="font-medium">Current Ward:</span> {patient.admission?.ward?.name || 'N/A'}</p>
          <p><span className="font-medium">Current Room:</span> {patient.admission?.room?.name || 'N/A'}</p>
          <p><span className="font-medium">Current Bed:</span> {patient.admission?.bed?.name || 'N/A'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Ward</label>
              <select
                name="wardId"
                value={form.wardId}
                onChange={handleChange}
                className="input w-full"
                required
              >
                <option value="">Select Ward</option>
                {wards.map(ward => (
                  <option key={ward._id} value={ward._id}>{ward.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Room</label>
              <select
                name="roomId"
                value={form.roomId}
                onChange={handleChange}
                className="input w-full"
                required
                disabled={!form.wardId}
              >
                <option value="">Select Room</option>
                {rooms.map(room => (
                  <option key={room._id} value={room._id}>{room.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Bed</label>
              <select
                name="bedId"
                value={form.bedId}
                onChange={handleChange}
                className="input w-full"
                required
                disabled={!form.roomId}
              >
                <option value="">Select Bed</option>
                {beds.map(bed => (
                  <option key={bed._id} value={bed._id}>{bed.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Reallocation</label>
              <select
                name="reason"
                value={form.reason}
                onChange={handleChange}
                className="input w-full"
                required
              >
                <option value="">Select Reason</option>
                <option value="medical">Medical Requirement</option>
                <option value="patient_request">Patient Request</option>
                <option value="ward_management">Ward Management</option>
                <option value="isolation">Isolation Required</option>
                <option value="maintenance">Maintenance Issues</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows="3"
                className="input w-full"
                placeholder="Enter any additional notes about the reallocation..."
              ></textarea>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/admission/${patientId}/summary`)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-brand"
            disabled={loading}
          >
            {loading ? 'Reallocating...' : 'Reallocate Bed'}
          </button>
        </div>
      </form>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}