
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function AdmitPatient(){
  const { axiosInstance } = useContext(AuthContext);
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [beds, setBeds] = useState([]);
  const [selectedBed, setSelectedBed] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // New admission details
  const [admissionType, setAdmissionType] = useState('');
  const [expectedStay, setExpectedStay] = useState('');
  const [admissionReason, setAdmissionReason] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [insuranceDetails, setInsuranceDetails] = useState('');

  useEffect(()=>{
    const t = setTimeout(()=>{
      const q = patientQuery && patientQuery.trim().toLowerCase();
      if (!q) { setPatientResults([]); return; }
      axiosInstance.get(`/patients/search?query=${encodeURIComponent(q)}`).then(r=>{
        setPatientResults(r.data.patients || []);
      }).catch(()=>{});
    }, 400);
    return ()=>clearTimeout(t);
  }, [patientQuery, axiosInstance]);

  useEffect(()=>{ loadWards(); }, []);
  const loadWards = async ()=>{ try{ const res = await axiosInstance.get('/wards'); setWards(res.data.wards||[]); }catch(e){console.error(e);} };
  const loadRooms = async (wardId)=>{ try{ const res = await axiosInstance.get(`/wards/${wardId}/rooms`); setRooms(res.data.rooms||[]); }catch(e){console.error(e);} };
  const loadBeds = async (wardId, roomId)=>{ try{ const res = await axiosInstance.get(`/wards/${wardId}/rooms/${roomId}/beds`); setBeds(res.data.beds||[]); }catch(e){console.error(e);} };

  const handleWardChange = (v)=>{ setSelectedWard(v); setSelectedRoom(''); setBeds([]); if(v) loadRooms(v); };
  const handleRoomChange = (v)=>{ setSelectedRoom(v); setBeds([]); if(v) loadBeds(selectedWard, v); };

  const admit = async () => {
    if (!selectedBed || !patientId || !admissionType || !paymentMode) {
      alert('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      // Compose patientData and admissionData for the new API
      const patientData = { _id: patientId }; // If registering new, fill all fields; for existing, just id
      const admissionData = {
        admissionType,
        expectedStayDays: expectedStay || undefined,
        reason: admissionReason,
        clinicalNotes,
        paymentMode,
        insuranceDetails: paymentMode === 'insurance' ? insuranceDetails : undefined
      };
      const data = {
        patientData,
        admissionData,
        roomId: selectedRoom,
        bedId: selectedBed,
        medications: [] // Optionally, collect from UI
      };
      try {
        // Use the authenticated axiosInstance from AuthContext so auth headers/cookies are included
        const res = await axiosInstance.post('/inpatient/register-admit-bill', data);
        console.log('admit response', res);
        alert('Patient admitted and billed successfully');
      } catch (err) {
        console.error('Failed to admit and bill', err);
        if (err.response) {
          const msg = err.response.data?.message || JSON.stringify(err.response.data);
          alert(`Failed to admit and bill patient: (${err.response.status}) ${msg}`);
        } else {
          alert(err.message || 'Failed to admit and bill patient');
        }
      }
      // Reset form
      setSelectedWard('');
      setSelectedRoom('');
      setSelectedBed('');
      setPatientId('');
      setPatientQuery('');
      setAdmissionType('');
      setExpectedStay('');
      setAdmissionReason('');
      setClinicalNotes('');
      setPaymentMode('');
      setInsuranceDetails('');
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to admit and bill patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Admit Patient</h2>
      <div className="bg-white p-6 rounded shadow space-y-6">
        {/* Patient Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
            <input className="input w-full" value={patientId} onChange={e=>setPatientId(e.target.value)} placeholder="Patient _id or hospitalId" />
            <div className="mt-2">
              <label className="block text-xs text-gray-500">Or search patient</label>
              <input className="input w-full" value={patientQuery} onChange={e=>setPatientQuery(e.target.value)} placeholder="Search by name or hospitalId" />
              {patientResults.length > 0 && (
                <ul className="bg-white border rounded mt-1 max-h-48 overflow-auto">
                  {patientResults.map(p=> (<li key={p._id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={()=>{ setPatientId(p._id); setPatientResults([]); setPatientQuery(''); }}>{p.user?.name || p._id} — {p.hospitalId || ''}</li>))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Ward and Bed Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ward</label>
            <select className="input w-full" value={selectedWard} onChange={e=>handleWardChange(e.target.value)}>
              <option value="">-- select ward --</option>
              {wards.map(w=> (<option key={w._id} value={w._id}>{w.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
            <select className="input w-full" value={selectedRoom} onChange={e=>handleRoomChange(e.target.value)}>
              <option value="">-- select room --</option>
              {rooms.map(r=> (<option key={r._id} value={r._id}>{r.number}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bed</label>
            <select className="input w-full" value={selectedBed} onChange={e=>setSelectedBed(e.target.value)}>
              <option value="">-- select bed --</option>
              {beds.map(b=> (<option key={b._id} value={b._id}>{b.number} — {b.status}</option>))}
            </select>
          </div>
        </div>

        {/* Admission Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admission Type</label>
            <select className="input w-full" value={admissionType} onChange={e=>setAdmissionType(e.target.value)} required>
              <option value="">Select Type</option>
              <option value="emergency">Emergency</option>
              <option value="scheduled">Scheduled</option>
              <option value="elective">Elective</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Stay (Days)</label>
            <input type="number" min="1" className="input w-full" value={expectedStay} onChange={e=>setExpectedStay(e.target.value)} />
          </div>
        </div>

        {/* Clinical Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admission Reason</label>
            <textarea className="input w-full" rows="3" value={admissionReason} onChange={e=>setAdmissionReason(e.target.value)} placeholder="Primary reason for admission"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
            <textarea className="input w-full" rows="3" value={clinicalNotes} onChange={e=>setClinicalNotes(e.target.value)} placeholder="Additional clinical notes"></textarea>
          </div>
        </div>

        {/* Billing Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <select className="input w-full" value={paymentMode} onChange={e=>setPaymentMode(e.target.value)} required>
              <option value="">Select Payment Mode</option>
              <option value="cash">Cash</option>
              <option value="insurance">Insurance</option>
              <option value="nhif">NHIF</option>
            </select>
          </div>
          {paymentMode === 'insurance' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Details</label>
              <input className="input w-full" value={insuranceDetails} onChange={e=>setInsuranceDetails(e.target.value)} placeholder="Insurance provider, policy number" />
            </div>
          )}
        </div>

        <div className="pt-4">
          <button 
            className="btn-brand w-full md:w-auto" 
            onClick={admit}
            disabled={!selectedBed || !patientId || loading}
          >
            {loading ? 'Admitting...' : 'Admit Patient'}
          </button>
        </div>
      </div>
    </div>
  );
}
