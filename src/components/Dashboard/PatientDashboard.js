import React, { useState, useEffect, useContext } from 'react';
// Sidebar and Topbar are handled by the global Layout
import DataTable from '../ui/DataTable';
import { AuthContext } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';

export default function PatientDashboard() {
  const { axiosInstance } = useContext(AuthContext);
  const [appts, setAppts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [consultationsList, setConsultationsList] = useState([]);

  // calendar days for quick 3-day view
  const [calendarDays, setCalendarDays] = useState([]);

  // Booking state
  const [selectedConsultation, setSelectedConsultation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsForSelectedDate, setSlotsForSelectedDate] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [patientDetails, setPatientDetails] = useState({
    name: '',
    idNumber: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
    concern: '',
    contactMethod: 'Email'
  });

  useEffect(() => {
    const load = async () => {
      try {
        // Load only upcoming appointments (non-served, non-expired)
        const upRes = await axiosInstance.get('/appointments?upcoming=true');
        const upcoming = (upRes.data.appointments || []).map(a => {
          const scheduled = new Date(a.scheduledAt);
          return {
            _id: a._id,
            date: scheduled.toLocaleDateString(),
            time: scheduled.toLocaleTimeString(),
            doctor: a.doctor?.user?.name || a.doctor?.name || 'Unknown',
            consultation: a.consultation?.name || '',
            status: a.status || 'requested',
            scheduledAt: a.scheduledAt,
          };
        });
        setAppts(upcoming);

        // invoices + payments
  const invRes = await axiosInstance.get('/billing/mine');
  const invs = invRes.data.invoices || [];
  setInvoices(invs);
        setPayments(
          invs.filter(i => i.status === 'paid').map(inv => ({
            date: new Date(inv.createdAt).toLocaleDateString(),
            amount: inv.amount,
            method: inv.method || inv.type
          }))
        );
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await axiosInstance.put(`/appointments/${appointmentId}`, { status: 'cancelled' });
      // reload upcoming appointments and invoices
      const upRes = await axiosInstance.get('/appointments?upcoming=true');
      const upcoming = (upRes.data.appointments || []).map(a => {
        const scheduled = new Date(a.scheduledAt);
        return {
          _id: a._id,
          date: scheduled.toLocaleDateString(),
          time: scheduled.toLocaleTimeString(),
          doctor: a.doctor?.user?.name || a.doctor?.name || 'Unknown',
          consultation: a.consultation?.name || '',
          status: a.status || 'requested',
          scheduledAt: a.scheduledAt,
        };
      });
      setAppts(upcoming);
      const invRes = await axiosInstance.get('/billing/mine');
      setInvoices(invRes.data.invoices || []);
    } catch (e) {
      console.error(e);
      alert('Failed to cancel appointment');
    }
  };

  // load patient profile to prefill name/email
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await axiosInstance.get('/patients/me');
        const patient = res.data.patient || {};
        setPatientDetails(prev => ({
          ...prev,
          name: patient.user?.name || prev.name,
          email: patient.user?.email || prev.email,
          phone: patient.phone || prev.phone
        }));
      } catch (e) {
        // fallback: maybe user is not a patient endpoint; try users/me
        try {
          const r2 = await axiosInstance.get('/users/me');
          const user = r2.data.user || {};
          setPatientDetails(prev => ({ ...prev, name: user.name || prev.name, email: user.email || prev.email }));
        } catch (er) {
          // ignore
        }
      }
    };
    loadProfile();

    // prepare 3-day calendar starting today
    const days = [];
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      days.push(d);
    }
    setCalendarDays(days);
  }, []);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await axiosInstance.get('/doctors');
        setDoctorsList(res.data.doctors || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadDoctors();
  }, []);

  useEffect(()=>{
    const load = async ()=>{
      try{
        const r = await axiosInstance.get('/consultations');
        setConsultationsList(r.data.consultations || []);
      }catch(e){ console.error(e); }
    };
    load();
  },[]);

  // load available slots when consultation changes (fetch all slots for that consultation)
  useEffect(()=>{
    const loadSlots = async ()=>{
      if (!selectedConsultation) return setAvailableSlots([]);
      try{
        const r = await axiosInstance.get(`/slots?consultation=${selectedConsultation}`);
        setAvailableSlots(r.data.slots || []);
      }catch(e){ console.error(e); setAvailableSlots([]); }
    };
    loadSlots();
  },[selectedConsultation]);

  // load slots specifically for the selected date (used in booking modal if user picks a date)
  useEffect(()=>{
    const loadForDate = async ()=>{
      if (!selectedConsultation || !selectedDate) return setSlotsForSelectedDate([]);
      try{
        const r = await axiosInstance.get(`/slots?consultation=${selectedConsultation}&date=${selectedDate}`);
        setSlotsForSelectedDate(r.data.slots || []);
      }catch(e){ console.error(e); setSlotsForSelectedDate([]); }
    };
    loadForDate();
  }, [selectedConsultation, selectedDate]);

  // Fallback static times (used if no slots are defined for the consultation)
  const fallbackTimes = ['09:00 AM', '09:30 AM', '10:00 AM', '11:00 AM', '12:00 PM'];

  // parse time strings like '09:00 AM' into minutes for sorting
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(' ');
    const timePart = parts[0];
    const meridian = parts[1] ? parts[1].toUpperCase() : null;
    const [hStr, mStr] = timePart.split(':');
    let hh = parseInt(hStr || '0', 10);
    const mm = parseInt(mStr || '0', 10) || 0;
    if (meridian === 'PM' && hh !== 12) hh += 12;
    if (meridian === 'AM' && hh === 12) hh = 0;
    return hh * 60 + mm;
  };

  // derive the time rows dynamically from availableSlots for the visible calendarDays
  const timeSlots = React.useMemo(() => {
    try{
      if (!availableSlots || availableSlots.length === 0) return fallbackTimes;
      const calDates = (calendarDays || []).map(d => d.toISOString().split('T')[0]);
      const timesSet = new Set();
      availableSlots.forEach(s => {
        if (!s || !s.date || !s.time) return;
        if (calDates.includes(s.date)) timesSet.add(s.time);
      });
      const arr = Array.from(timesSet);
      if (arr.length === 0) return fallbackTimes;
      arr.sort((a,b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
      return arr;
    } catch(e) { console.error(e); return fallbackTimes; }
  }, [availableSlots, calendarDays]);

  const handleBookSlot = (date, time) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setShowBookingForm(true);
  };

  const submitBooking = async e => {
    e.preventDefault();
    try {
      if (!selectedConsultation) return alert('Please select a consultation/service');
      if (!selectedDate || !selectedTime) return alert('Select a date & time');

      // Persist patient details to profile so the user doesn't need to re-enter next time
      try {
        await axiosInstance.put('/patients/me', {
          name: patientDetails.name,
          email: patientDetails.email,
          phone: patientDetails.phone,
          idNumber: patientDetails.idNumber,
          gender: patientDetails.gender,
          dob: patientDetails.dob
        });
      } catch (err) {
        // not fatal; proceed to booking but log
        console.warn('Failed to save profile details', err?.response?.data || err.message);
      }

      const scheduledAt = new Date(`${selectedDate} ${selectedTime}`).toISOString();
      const res = await axiosInstance.post('/appointments', {
        scheduledAt,
        consultationId: selectedConsultation || undefined,
        patientDetails
      });

      const invoice = res.data.invoice;
      if (invoice) {
        alert(`Appointment requested. An invoice #${invoice.invoiceNumber} for KES ${invoice.amount} was created.`);
        const invRes = await axiosInstance.get('/billing/mine');
        setInvoices(invRes.data.invoices || []);
      } else {
        alert('Appointment requested. It will be visible to doctor, admin, receptionist.');
      }
      setShowBookingForm(false);

      // reload appointments
      const aRes = await axiosInstance.get('/appointments');
      const now = new Date();
      const allAppointments = (aRes.data.appointments || []).map(a => {
        const scheduled = new Date(a.scheduledAt);
        const isExpired = scheduled <= now || a.status === 'expired';
        return {
          date: scheduled.toLocaleDateString(),
          time: scheduled.toLocaleTimeString(),
          doctor: isExpired
            ? `${a.doctor?.user?.name || 'Unknown'} (Expired)`
            : a.doctor?.user?.name || 'Unknown',
          expired: isExpired
        };
      });
      setAppts(allAppointments);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Booking failed');
    }
  };

  const requestCashPayment = async invoiceId => {
    try {
      await axiosInstance.post(`/billing/${invoiceId}/cash`);
      alert('Cash payment requested.');
      const invRes = await axiosInstance.get('/billing/mine');
      setInvoices(invRes.data.invoices || []);
    } catch (err) {
      console.error(err);
      alert('Request failed');
    }
  };

  const initiateMobilePay = async invoice => {
    try {
      const phone = prompt('Enter your mobile number (07xxxxxxxx):');
      if (!phone) return;
      await axiosInstance.post('/payments/stk', {
        amount: invoice.amount,
        phone,
        accountRef: `INV${invoice.invoiceNumber}`,
        invoiceNumber: invoice.invoiceNumber
      });
      alert('Payment initiated.');
    } catch (err) {
      console.error(err);
      alert('Payment failed');
    }
  };

  return (
    <>
  <div className="flex items-center justify-between mt-0 mb-0">
    <h1 className="text-2xl font-bold mt-0 mb-0">My Dashboard</h1>
    <ThemeToggle />
  </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded p-4 shadow">
          <h3 className="font-semibold">Total Paid</h3>
          <div className="text-xl font-bold text-brand-700">
            ${(payments.reduce((s, p) => s + (p.amount || 0), 0) || 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded p-4 shadow">
          <h3 className="font-semibold">Next Due</h3>
          <div className="text-xl font-bold text-brand-700">
            ${(invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.amount || 0), 0) || 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded p-4 shadow">
          <h3 className="font-semibold">Upcoming</h3>
          <div className="text-xl font-bold text-brand-700">
            {appts.filter(a => !a.expired).length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Appointment List */}
        <div className="bg-white rounded p-4 shadow">
          <h3 className="font-semibold mb-2">Appointments</h3>
          <DataTable
            columns={[
              { header: 'Date', accessor: 'date' },
              { header: 'Time', accessor: 'time' },
              { header: 'Doctor', accessor: 'doctor' },
              { header: 'Consultation', accessor: 'consultation' },
              { header: 'Actions', accessor: 'actions' }
            ]}
            data={appts.map(a => ({ ...a, actions: (!a.expired && a.status !== 'cancelled') ? (<button className="btn-outline" onClick={()=>cancelAppointment(a._id)}>Cancel</button>) : null }))}
          />
        </div>

        {/* Appointment Booking (like image) */}
        <div className="bg-teal-600 text-white rounded p-5 shadow-lg">
          <h3 className="text-center text-xl font-semibold mb-4">Book an Appointment</h3>

          <div className="space-y-3 mb-4">
            <select
              className="w-full p-2 rounded bg-white text-gray-800 mb-2"
              value={selectedConsultation}
              onChange={e => setSelectedConsultation(e.target.value)}
            >
              <option value="">Select service</option>
              {consultationsList.map(c => (
                <option key={c._id} value={c._id}>{c.name} {c.price?`- KES ${c.price}`:''}</option>
              ))}
            </select>

            {/* doctor is auto-assigned from consultation; we don't show doctor selector */}
          </div>

          <div className="text-center font-semibold mb-3">Cost: <span className="text-white">{(consultationsList.find(c=>c._id===selectedConsultation)?.price) ? `KES ${consultationsList.find(c=>c._id===selectedConsultation).price}` : 'TBD'}</span></div>

          {/* Hint if no slots on the 3-day view */}
          {selectedConsultation && (() => {
            const calDateStrs = calendarDays.map(d=>d.toISOString().split('T')[0]);
            const count = availableSlots.filter(s => calDateStrs.includes(s.date)).length;
            if (count === 0) return (<div className="text-sm text-yellow-100 mb-3">No available slots for this service in the next 3 days. Please choose another date or contact reception.</div>);
            return null;
          })()}

          {/* calendar header */}
          <div className="flex items-center justify-between text-sm mb-3">
            <button className="px-2">❮</button>
            <div className="flex gap-4">
                {calendarDays.map((d, idx) => {
                  const dayStr = d.toISOString().split('T')[0];
                  const slotsCount = availableSlots.filter(s => s.date === dayStr).length;
                  return (
                  <div key={idx} className={`text-center cursor-pointer ${selectedDate===dayStr? 'ring-2 ring-white rounded':''}`} onClick={()=>{ setSelectedDate(dayStr); }}>
                    <div className="text-xs">{d.toLocaleString('en-US', { weekday: 'short' })}</div>
                    <div className="text-sm font-medium">{d.toLocaleString('en-US', { month: 'short', day: '2-digit' })}</div>
                    <div className="text-xs mt-1">{slotsCount > 0 ? `${slotsCount} slot${slotsCount>1?'s':''}` : 'No slots'}</div>
                  </div>
                )})}
              </div>
            <button className="px-2">❯</button>
          </div>

          {/* time slots grid: rows are times, columns are days */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {/* first column: time labels */}
            <div className="flex flex-col gap-3">
              {timeSlots.map(t => (
                  <div key={t} className="bg-teal-100 text-teal-900 rounded p-2 text-sm text-center">{t}</div>
                ))}
            </div>

            {/* day columns */}
            {calendarDays.map((d, di) => (
              <div key={di} className="flex flex-col gap-3">
                {timeSlots.map(t => {
                  const dateStr = d.toISOString().split('T')[0];
                  // check if slot exists in availableSlots (match by date & time)
                  const exists = availableSlots.some(s => s.date === dateStr && s.time === t);
                  return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => exists ? handleBookSlot(dateStr, t) : alert('Slot not available')}
                    className={`${exists ? 'bg-teal-50 text-teal-800 hover:bg-teal-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} rounded p-2 text-sm`}
                    disabled={!exists}
                  >
                    {exists ? 'Book' : 'N/A'}
                  </button>
                )})}
              </div>
            ))}
          </div>

          <button
            className="w-full bg-orange-400 text-white py-2 rounded font-semibold"
            onClick={() => {
              if (!selectedConsultation) return alert('Please select a service first');
              // open modal where user can pick date and time
              setShowBookingForm(true);
            }}
          >
            Request an appointment
          </button>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 px-4">
          <div className="bg-white rounded shadow-lg w-full max-w-4xl relative overflow-hidden">
            {/* teal header */}
            <div className="bg-teal-400 p-4 text-white font-semibold flex justify-between items-center">
              <div>Book a Service With The Selected Provider</div>
              <button onClick={() => setShowBookingForm(false)} className="text-white text-2xl leading-none">✕</button>
            </div>

            <div className="p-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Patient's details & appointment <span className="text-xs text-gray-400">(* indicates required fields)</span></h4>
              <form onSubmit={submitBooking} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-sm text-gray-600 mb-1">Preferred appointment date</label>
                  <input type="date" className="border p-2 rounded w-full" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} required />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm text-gray-600 mb-1">Available times for {selectedDate || 'selected date'}</label>
                  <select className="border p-2 rounded w-full" value={selectedTime} onChange={e=>setSelectedTime(e.target.value)} required>
                    <option value="">-- Select time --</option>
                    {slotsForSelectedDate.length === 0 && <option value="" disabled>No available times</option>}
                    {slotsForSelectedDate.map(s => (<option key={s._id} value={s.time}>{s.time}{s.doctor?.user?.name ? ` — ${s.doctor.user.name}` : ''}</option>))}
                  </select>
                  {slotsForSelectedDate.length === 0 && (
                    <div className="text-sm text-red-600 mt-2">No slots available for this date. Try another date or consult admin.</div>
                  )}
                </div>
                <input
                  className="border p-2 rounded md:col-span-1"
                  placeholder="Full name *"
                  value={patientDetails.name}
                  onChange={e => setPatientDetails({ ...patientDetails, name: e.target.value })}
                  required
                />
                <input
                  className="border p-2 rounded"
                  placeholder="ID/Passport No."
                  value={patientDetails.idNumber}
                  onChange={e => setPatientDetails({ ...patientDetails, idNumber: e.target.value })}
                />
                <input
                  className="border p-2 rounded"
                  type="email"
                  placeholder="Email address *"
                  value={patientDetails.email}
                  onChange={e => setPatientDetails({ ...patientDetails, email: e.target.value })}
                  required
                />

                <input
                  className="border p-2 rounded"
                  placeholder="Phone number *"
                  value={patientDetails.phone}
                  onChange={e => setPatientDetails({ ...patientDetails, phone: e.target.value })}
                  required
                />
                <select
                  className="border p-2 rounded"
                  value={patientDetails.gender}
                  onChange={e => setPatientDetails({ ...patientDetails, gender: e.target.value })}
                >
                  <option value="">Gender *</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <div>
                  <input
                    type="date"
                    className="border p-2 rounded w-full"
                    value={patientDetails.dob}
                    onChange={e => setPatientDetails({ ...patientDetails, dob: e.target.value })}
                  />
                </div>

                <textarea
                  className="border p-2 rounded md:col-span-3 h-24"
                  placeholder="Medical concern *"
                  value={patientDetails.concern}
                  onChange={e => setPatientDetails({ ...patientDetails, concern: e.target.value })}
                  required
                />

                <div className="md:col-span-3">
                  <div className="font-medium mb-2">How should we contact you?</div>
                  <div className="flex items-center gap-6">
                    {['Email', 'WhatsApp', 'Phone call'].map(m => (
                      <label key={m} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="contactMethod"
                          value={m}
                          checked={patientDetails.contactMethod === m}
                          onChange={e => setPatientDetails({ ...patientDetails, contactMethod: e.target.value })}
                        />
                        <span>{m}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-3 flex justify-end mt-4">
                  <button type="submit" className="bg-orange-400 text-white px-5 py-2 rounded">Proceed</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="mt-6 bg-white rounded p-4 shadow">
        <h3 className="font-semibold mb-2">Payment History</h3>
        <div className="mb-4">
          <h4 className="font-medium">Outstanding Invoices</h4>
          {invoices.filter(i => i.status !== 'paid').length === 0 && (
            <p className="text-sm text-gray-500">No outstanding invoices</p>
          )}
          {invoices.filter(i => i.status !== 'paid').map(inv => (
            <div
              key={inv._id}
              className="p-3 border rounded mb-2 flex items-center justify-between"
            >
              <div>
                <div><strong>Invoice #{inv.invoiceNumber}</strong></div>
                <div className="text-sm text-gray-500">Amount: ${inv.amount} — {inv.type}</div>
                <div className="text-sm text-gray-400">Issued: {new Date(inv.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-outline" onClick={() => initiateMobilePay(inv)}>Pay (Mobile)</button>
                <button className="btn-brand" onClick={() => requestCashPayment(inv._id)}>I Paid Cash</button>
              </div>
            </div>
          ))}
        </div>

        <DataTable
          columns={[
            { header: 'Date', accessor: 'date' },
            { header: 'Amount', accessor: 'amount' },
            { header: 'Method', accessor: 'method' }
          ]}
          data={payments}
        />
      </div>
    </>
  );
}
