import React, { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Toast from '../components/ui/Toast';
import debounce from '../utils/debounce'; // Import the debounce utility

export default function AdmitPatient() {
  const { axiosInstance } = useContext(AuthContext);
  const [wards, setWards] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ patientId: '', wardId: '', roomId: '', bedId: '', doctorId: '' });
  const [toast, setToast] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    loadWards();
    loadDoctors();
  }, []);

  // Debounced search function
  const searchPatients = useCallback(
    debounce(async (query) => {
      if (query.length >= 1) { // Only search if query is at least 1 character
        try {
          const res = await axiosInstance.get(`/patients/search?query=${query}`);
          setSearchResults(res.data.patients || []);
          setShowSearchResults(true);
        } catch (e) {
          console.error('Patient search error:', e);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300), // 300ms debounce delay
    [axiosInstance]
  );

  useEffect(() => {
    if (searchQuery) {
      searchPatients(searchQuery);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery, searchPatients]);


  const loadWards = async () => {
    try {
      const res = await axiosInstance.get('/wards');
      setWards(res.data.wards || []);
    } catch (e) { console.error(e); }
  };
  const loadDoctors = async () => {
    try {
      const res = await axiosInstance.get('/doctors/list');
      setDoctors(res.data.doctors || []);
    } catch (e) { console.error(e); }
  };
  const loadRooms = async (wardId) => {
    try {
      const res = await axiosInstance.get(`/wards/${wardId}/rooms`);
      setRooms(res.data.rooms || []);
    } catch (e) { console.error(e); }
  };
  const loadBeds = async (wardId, roomId) => {
    try {
      const res = await axiosInstance.get(`/wards/${wardId}/rooms/${roomId}/beds`);
      setBeds((res.data.beds || []).filter(b => b.status === 'available'));
    } catch (e) { console.error(e); }
  };

  // Handlers
  const handleWardChange = e => {
    const wardId = e.target.value;
    setForm(f => ({ ...f, wardId, roomId: '', bedId: '' }));
    setRooms([]); setBeds([]);
    if (wardId) loadRooms(wardId);
  };
  const handleRoomChange = e => {
    const roomId = e.target.value;
    setForm(f => ({ ...f, roomId, bedId: '' }));
    setBeds([]);
    if (form.wardId && roomId) loadBeds(form.wardId, roomId);
  };
  const handleBedChange = e => {
    setForm(f => ({ ...f, bedId: e.target.value }));
  };
  const handleDoctorChange = e => {
    setForm(f => ({ ...f, doctorId: e.target.value }));
  };

  const handleSearchInputChange = e => {
    setSearchQuery(e.target.value);
    setForm(f => ({ ...f, patientId: '' })); // Clear patientId when search query changes
    setSelectedPatientDetails(null);
  };

  const handlePatientSelect = (patient) => {
    setForm(f => ({ ...f, patientId: patient._id }));
    setSearchQuery(patient.user?.name || patient.firstName + ' ' + patient.lastName);
    setSelectedPatientDetails(patient);
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.patientId || !form.wardId || !form.roomId || !form.bedId || !form.doctorId) {
      setToast({ message: 'All fields are required', type: 'error' });
      return;
    }
    try {
      // Assign bed (admit patient)
      await axiosInstance.put(`/wards/beds/${form.bedId}/assign`, { patientId: form.patientId });
      // Assign doctor if needed
      await axiosInstance.put(`/patients/${form.patientId}/assign`, { doctorId: form.doctorId });
      setToast({ message: 'Patient admitted successfully', type: 'success' });
      setForm({ patientId: '', wardId: '', roomId: '', bedId: '', doctorId: '' });
      setSearchQuery('');
      setSelectedPatientDetails(null);
    } catch (e) {
      setToast({ message: e?.response?.data?.message || 'Failed to admit patient', type: 'error' });
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Admit Patient</h2>
      <form className="bg-white p-4 rounded shadow flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="relative">
          <label className="block mb-1">Search Patient</label>
          <input
            type="text"
            className="input w-full"
            placeholder="Search by name, phone, or ID"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onFocus={() => setShowSearchResults(searchQuery.length > 2 && searchResults.length > 0)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 100)} // Hide results after a short delay
            required
          />
          {showSearchResults && searchResults.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 rounded shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map(patient => (
                <li
                  key={patient._id}
                  className="p-2 cursor-pointer hover:bg-gray-100"
                  onMouseDown={() => handlePatientSelect(patient)} // Use onMouseDown to prevent onBlur from firing first
                >
                  {patient.user?.name || `${patient.firstName} ${patient.lastName}`} ({patient.user?.phone || patient.nationalId || patient.mrn})
                </li>
              ))}
            </ul>
          )}
          {selectedPatientDetails && (
            <p className="mt-2 text-sm text-gray-600">Selected Patient: {selectedPatientDetails.user?.name} (ID: {selectedPatientDetails.nationalId || selectedPatientDetails.mrn})</p>
          )}
        </div>
        <div>
          <label className="block mb-1">Ward</label>
          <select className="input w-full" value={form.wardId} onChange={handleWardChange} required>
            <option value="">-- select ward --</option>
            {wards.map(w => (
              <option key={w._id} value={w._id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Room</label>
          <select className="input w-full" value={form.roomId} onChange={handleRoomChange} required disabled={!form.wardId}>
            <option value="">-- select room --</option>
            {rooms.map(r => (
              <option key={r._id} value={r._id}>{r.number || r._id}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Bed</label>
          <select className="input w-full" value={form.bedId} onChange={handleBedChange} required disabled={!form.roomId}>
            <option value="">-- select bed --</option>
            {beds.map(b => (
              <option key={b._id} value={b._id}>{b.number}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Doctor</label>
          <select className="input w-full" value={form.doctorId} onChange={handleDoctorChange} required>
            <option value="">-- select doctor --</option>
            {doctors.map(d => (
              <option key={d._id} value={d._id}>{d.user?.name} ({d.user?.email})</option>
            ))}
          </select>
        </div>
        <button className="btn-brand w-full" type="submit" disabled={!form.patientId}>Admit Patient</button>
      </form>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

