import React, { useEffect, useState, useContext, useMemo } from 'react';
// Sidebar and Topbar are handled by the global Layout
import StatsCard from '../ui/StatsCard';
import DataTable from '../ui/DataTable';
import { AuthContext } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import PharmacySalesSummary from './PharmacySalesSummary';

// 
import { Link } from "react-router-dom";
// A single-file admin dashboard inspired by the provided WellNest image.
// Uses simple SVG charts and placeholder data that is easy to replace with API data.

function TopStats({items, onStartEditBeds, editingBeds, bedsCount, bedsDraft, setBedsDraft, saveBeds, cancelEditBeds}){
  const routeMap = {
    'Doctors': '/dashboard/admin/doctors',
    'Nurses': '/dashboard/admin/users?role=nurse',
    'Pharmacists': '/dashboard/admin/users?role=pharmacist',
    'Lab Techs': '/dashboard/admin/users?role=lab',
    'Finance': '/dashboard/finance/transactions',
    'Non-Medical': '/dashboard/staff',
    'Patients': '/dashboard/admin/patients',
    'Appointments': '/appointments',
    'Total Invoice': '/billing'
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 grid-rows-2 gap-4 mb-6">
      {items.map((it,idx)=>{
  if (it.title === 'Available Beds') {
          // render a special beds card handled by parent via props (value may be string)
          return (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded p-4 shadow flex flex-col">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">{it.title}</div>
                {/* edit control */}
                <div>
                  {!editingBeds ? (
                    <button title="Edit beds" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" onClick={onStartEditBeds}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z"/></svg>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button title="Save" className="text-green-600" onClick={saveBeds}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                      </button>
                      <button title="Cancel" className="text-gray-400" onClick={cancelEditBeds}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {!editingBeds ? (
                <>
                  <div className="text-2xl font-bold text-brand-700 dark:text-indigo-300 mt-2">{it.value}</div>
                  <div className={`mt-2 text-sm ${it.growth>=0? 'text-green-600':'text-red-600'}`}>{it.growth>=0? '+'+it.growth+'%': it.growth+'%'} vs yesterday</div>
                </>
              ) : (
                <div className="mt-2">
                  <input value={bedsDraft} onChange={e=>setBedsDraft(e.target.value)} className="input w-full" />
                </div>
              )}
            </div>
          );
        }
        return (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded p-4 shadow flex flex-col">
            <div className="text-sm text-gray-500 dark:text-gray-400">{it.title}</div>
            <div className="text-2xl font-bold text-brand-700 dark:text-indigo-300 mt-2">{it.value}</div>
            <div className={`mt-2 text-sm ${it.growth>=0? 'text-green-600':'text-red-600'}`}>{it.growth>=0? '+'+it.growth+'%': it.growth+'%'} vs yesterday</div>
            {/* view all button (skip for Available Beds) */}
            {routeMap[it.title] && (
              <div className="mt-3">
                <Link to={routeMap[it.title]} className="text-xs btn-outline">View all</Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GroupedBarChart({data, categories, height=160}){
  // data: array of {label, values: [v1,v2,...] }
  const max = Math.max(...data.flatMap(d=>d.values));
  const barWidth = 14;
  return (
    <div className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${data.length* (categories.length* (barWidth+6) + 20)} ${height}`}>
        {data.map((d, i)=> (
          <g key={i} transform={`translate(${i * (categories.length*(barWidth+6) + 20) + 40},0)`}>
            {d.values.map((v, j)=>{
              const x = j*(barWidth+6);
              const h = (v / (max || 1)) * (height - 40);
              return <rect key={j} x={x} y={height - h - 20} width={barWidth} height={h} rx="3" fill={["#60A5FA","#34D399","#FBBF24"][j%3]} />
            })}
            <text x={(categories.length*(barWidth+6))/2} y={height-4} fontSize="11" textAnchor="middle" fill="#6B7280">{d.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function LineChart({seriesA, seriesB, labels, height=140}){
  const max = Math.max(...seriesA.concat(seriesB));
  const w = labels.length * 28;
  const points = (arr) => arr.map((v,i)=> `${i*(w/(labels.length-1) || 0)},${height - (v/max)* (height-20) -10}`).join(' ');
  return (
    <div className="w-full overflow-x-auto">
      <svg width={Math.max(400,w)} height={height} viewBox={`0 0 ${Math.max(400,w)} ${height}`}>
        <polyline fill="none" stroke="#BFDBFE" strokeWidth="12" points={points(seriesB)} strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        <polyline fill="none" stroke="#3B82F6" strokeWidth="3" points={points(seriesA)} strokeLinecap="round" strokeLinejoin="round" />
        {labels.map((l,i)=>(<text key={i} x={i*(w/(labels.length-1)||0)} y={height-2} fontSize="10" fill="#9CA3AF">{l}</text>))}
      </svg>
    </div>
  );
}

function Pie({items, size=140}){
  const total = items.reduce((s,i)=>s+i.value,0) || 1;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {items.map((it,i)=>{
        const start = acc/total * Math.PI*2;
        acc += it.value;
        const end = acc/total * Math.PI*2;
        const x1 = size/2 + Math.cos(start) * size/2 * 0.8;
        const y1 = size/2 + Math.sin(start) * size/2 * 0.8;
        const x2 = size/2 + Math.cos(end) * size/2 * 0.8;
        const y2 = size/2 + Math.sin(end) * size/2 * 0.8;
        const large = end-start > Math.PI ? 1:0;
        const d = `M ${size/2} ${size/2} L ${x1} ${y1} A ${size*0.4} ${size*0.4} 0 ${large} 1 ${x2} ${y2} Z`;
        return <path key={i} d={d} fill={it.color} />
      })}
    </svg>
  );
}

export default function AdminDashboard(){
  const { user, logout, axiosInstance } = useContext(AuthContext);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportRecipient, setExportRecipient] = useState('');
  const [exportAppointmentId, setExportAppointmentId] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState('');

  useEffect(()=>{
    try{ const saved = localStorage.getItem('notificationRecipient'); if (saved) setExportRecipient(saved); }catch(e){}
  },[]);

  const openExportModal = (id)=>{ setExportAppointmentId(id); setExportModalOpen(true); };
  const closeExportModal = ()=>{ setExportAppointmentId(null); setExportModalOpen(false); };

  const sendExportEmail = async ()=>{
    if (!exportRecipient) { setExportError('Enter recipient'); setTimeout(()=>setExportError(''),3000); return; }
    setExportLoading(true);
    try{
      await axiosInstance.post(`/appointments/${exportAppointmentId}/export-email`, { to: exportRecipient });
      try{ localStorage.setItem('notificationRecipient', exportRecipient); }catch(e){}
      setExportSuccess(true); setTimeout(()=>setExportSuccess(false),2000);
      closeExportModal();
    }catch(e){ console.error(e); setExportError('Failed to send'); setTimeout(()=>setExportError(''),3000); }
    setExportLoading(false);
  };

  const printAppointment = (a) => {
    const w = window.open('', '_blank'); if(!w) return;
    const html = `<html><head><title>Appointment</title><style>body{font-family:Arial;padding:20px}</style></head><body><h2>Appointment</h2><div><strong>Patient:</strong> ${a.patient?.user?.name || a.patient || '-'}</div><div><strong>Doctor:</strong> ${a.doctor?.user?.name || a.doctor || '-'}</div><div><strong>Scheduled:</strong> ${new Date(a.scheduledAt).toLocaleString()}</div></body></html>`;
    w.document.write(html); w.document.close(); w.focus(); setTimeout(()=>{ w.print(); w.close(); },300);
  };

  // placeholder data
  const [stats, setStats] = useState({ patients:0, doctors:0, appointments:0 });
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [pharmacySales, setPharmacySales] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningRequest, setAssigningRequest] = useState(null);
  const [nursesList, setNursesList] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [assignRole, setAssignRole] = useState('nurse');
  const [staffList, setStaffList] = useState([]);
  const [bedsCount, setBedsCount] = useState(0);
  const [editingBeds, setEditingBeds] = useState(false);
  const [bedsDraft, setBedsDraft] = useState('');
  const [loading, setLoading] = useState(false);

  // derive chart data from real DB arrays
  const barData = useMemo(()=>{
    // last 12 days labels
    const labels = Array.from({length:12}).map((_,i)=>{
      const d = new Date(); d.setDate(d.getDate() - (11 - i));
      return d;
    });

    // For each day, count patients by age groups based on user.birthdate if available, otherwise count appointments as proxy
    return labels.map(date => {
      const start = new Date(date); start.setHours(0,0,0,0);
      const end = new Date(date); end.setHours(23,59,59,999);

      let child = 0, adult = 0, elderly = 0;

      // prefer patients with DOB
      patients.forEach(p => {
        const u = p.user || {};
        const dob = u.birthdate || u.dob || u.dateOfBirth;
        if (dob) {
          const age = Math.floor((Date.now() - new Date(dob)) / (365.25*24*3600*1000));
          if (age < 18) child++;
          else if (age < 65) adult++;
          else elderly++;
        }
      });

      // if no DOBs found, fallback: count appointments scheduled that day and assign to adult bucket
      if (child + adult + elderly === 0) {
        const appts = (appointments||[]).filter(a=>{
          const sa = new Date(a.scheduledAt);
          return sa >= start && sa <= end;
        }).length;
        adult = appts; // proxy
      }

      return { label: start.toLocaleDateString(undefined,{month:'short', day:'numeric'}), values: [child, adult, elderly] };
    });
  }, [patients, appointments]);

  const revenueSeries = useMemo(()=>{
    // compute revenue per weekday for last 7 days from invoices and pharmacy sales
    const last7 = Array.from({length:7}).map((_,i)=>{ const d = new Date(); d.setDate(d.getDate() - (6-i)); return d; });
  const seriesA = last7.map(_=>0); // invoices
    const seriesB = last7.map(_=>0); // pharmacy sales

    (invoices||[]).forEach(inv=>{
      const created = new Date(inv.createdAt || inv.createdAt);
      last7.forEach((d, idx)=>{
        if (created.toDateString() === d.toDateString()) {
          seriesA[idx] += Number(inv.amount || inv.total || 0);
        }
      });
    });

    (pharmacySales||[]).forEach(sale=>{
      const created = new Date(sale.createdAt || sale.createdAt);
      last7.forEach((d, idx)=>{
        if (created.toDateString() === d.toDateString()) {
          seriesB[idx] += Number(sale.total || sale.amount || 0);
        }
      });
    });

    return { labels: last7.map(d=>d.toLocaleDateString(undefined,{weekday:'short'})), seriesA, seriesB };
  }, [invoices, pharmacySales]);

  const finance = useMemo(() => {
    // totals for the same 7-day window used by revenueSeries
    const totalInvoices = (revenueSeries.seriesA || []).reduce((s, v) => s + Number(v || 0), 0);
    const totalPharmacy = (revenueSeries.seriesB || []).reduce((s, v) => s + Number(v || 0), 0);
    const totalRevenue = totalInvoices + totalPharmacy;
    // try to detect explicit expense records on invoices if available
    const expenses = (invoices || []).reduce((s, inv) => {
      const amt = Number(inv.amount || inv.total || inv.expense || 0) || 0;
      const isExpense = String(inv.type || '').toLowerCase().includes('expense') || !!inv.isExpense;
      return s + (isExpense ? amt : 0);
    }, 0);
    const net = totalRevenue - expenses;
    return { totalInvoices, totalPharmacy, totalRevenue, expenses, net };
  }, [revenueSeries, invoices]);

  // appointments by status counts
  const apptStatusCounts = useMemo(()=>{
    const counts = {};
    (appointments||[]).forEach(a=>{
      const s = a.status || 'unknown';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [appointments]);

  // recent appointments within last 24 hours (exclude completed/cancelled)
  const recentAppointments = useMemo(()=>{
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return (appointments || [])
      .filter(a => {
        if (!a || !a.scheduledAt) return false;
        const sa = new Date(a.scheduledAt);
        const s = (a.status || '').toLowerCase();
        if (s === 'completed' || s === 'cancelled') return false;
        return sa >= cutoff && sa <= now;
      })
      .sort((a,b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
      .slice(0,3);
  }, [appointments]);

  // average lead time in hours between creation and scheduled time
  const avgLeadHours = useMemo(()=>{
    const arr = (appointments||[]).map(a=>{
      if (!a.createdAt || !a.scheduledAt) return null;
      const created = new Date(a.createdAt);
      const sched = new Date(a.scheduledAt);
      const diffMs = sched - created; // scheduled minus created => lead time
      return diffMs / (1000*60*60);
    }).filter(v=>v !== null && !Number.isNaN(v));
    if (arr.length === 0) return 0;
    const avg = arr.reduce((s,v)=>s+v,0)/arr.length;
    return Math.round(avg*10)/10; // 1 decimal
  }, [appointments]);

  const pieItems = useMemo(()=>{
    const byDept = {};
    (patients||[]).forEach(p=>{
      const dept = p.admission?.ward || p.department || 'Other';
      byDept[dept] = (byDept[dept] || 0) + 1;
    });
    const entries = Object.keys(byDept).map((k,i)=>({ label:k, value: byDept[k], color: ['#60A5FA','#34D399','#FBBF24','#F472B6'][i%4] }));
    // normalize to percentages
    const total = entries.reduce((s,e)=>s+e.value,0) || 1;
    return entries.map(e=>({ ...e, value: Math.round((e.value/total)*100) }));
  }, [patients]);
  const reports = [
    'Room Cleaning Needed', 'Equipment Maintenance', 'Medication Restock', 'HVAC System Issue', 'Patient Transport Required'
  ];

  const loadAppointments = async () => {
    try {
      const res = await axiosInstance.get('/appointments');
      setAppointments(res.data.appointments || []);
    } catch (e) { console.error(e); }
  };

  const loadServiceRequests = async () => {
    try {
      const res = await axiosInstance.get('/requests');
      setServiceRequests(res.data.requests || []);
    } catch (e) { console.error('Failed to load service requests', e); }
  };

  const loadCoreData = async () => {
    const start = Date.now();
    try {
      setLoading(true);
      // ensure we have fresh appointments first so stats are accurate
      const apptsRes = await axiosInstance.get('/appointments');
      const freshAppts = apptsRes.data.appointments || [];
      setAppointments(freshAppts);

      const [pRes, dRes, invRes, drugsRes, salesRes] = await Promise.all([
        axiosInstance.get('/patients'),
        axiosInstance.get('/doctors/with-availability'),
        axiosInstance.get('/billing'),
        axiosInstance.get('/pharmacy/inventory'),
        axiosInstance.get('/pharmacy/sales'),
      ]);

      setPatients(pRes.data.patients || []);
      // doctors endpoint returns doctors with availability when called with /with-availability
      const docs = (dRes.data.doctors || dRes.data || []);
      setDoctors(docs.map(d => ({ 
        name: d.user?.name || (d.user && d.user.name) || 'Doctor', 
        specialties: d.specialties || [],
        specialty: (d.specialties && d.specialties[0]) || '',
        available: d.availability ? !!d.availability.available : undefined,
        availabilityMessage: d.availability ? d.availability.message : ''
      })));
  setInvoices(invRes.data.invoices || []);
  setDrugs(drugsRes.data.drugs || []);
  setPharmacySales(salesRes.data.sales || []);

      setStats({ patients: (pRes.data.patients || []).length, doctors: docs.length, appointments: freshAppts.length });
      // load beds from settings
      try {
        const bRes = await axiosInstance.get('/admin/settings/beds');
        setBedsCount(typeof bRes.data.beds === 'number' ? bRes.data.beds : Number(bRes.data.beds || 0));
      } catch (e) { console.error('Failed to load beds setting', e); }
      setStats({ patients: (pRes.data.patients || []).length, doctors: docs.length, appointments: freshAppts.length });
    } catch (e) { console.error('Failed to load core data', e); }
    finally {
      // enforce a minimum loading time so the spinner is visible for at least 3s
      const elapsed = Date.now() - start;
      const minMs = 3000;
      if (elapsed < minMs) {
        await new Promise(resolve => setTimeout(resolve, minMs - elapsed));
      }
      setLoading(false);
    }
  };

  // fetch counts for user roles
  const loadRoleCounts = async () => {
    try {
      const [doctorsRes, nursesRes, pharmacistsRes, labRes, cleaningRes, maintenanceRes, financeRes] = await Promise.all([
        axiosInstance.get('/users?role=doctor'),
        axiosInstance.get('/users?role=nurse'),
        axiosInstance.get('/users?role=pharmacist'),
        // lab technicians may be under role 'lab' or 'lab_technician' depending on backend; try 'lab'
        axiosInstance.get('/users?role=lab'),
        axiosInstance.get('/users?role=cleaning'),
        axiosInstance.get('/users?role=maintenance'),
        axiosInstance.get('/users?role=finance'),
      ]);
      const labCount = (labRes.data.users || []).length;
      const cleaningCount = (cleaningRes.data.users || []).length;
      const maintenanceCount = (maintenanceRes.data.users || []).length;
      const nonMedicalCount = cleaningCount + maintenanceCount;
      // set stats by merging into stats state
      setStats(s => ({
        ...s,
        doctors: (doctorsRes.data.users || []).length,
        nurses: (nursesRes.data.users || []).length,
        pharmacists: (pharmacistsRes.data.users || []).length,
        labTechnicians: labCount,
        nonMedical: nonMedicalCount,
        financeWorkers: (financeRes.data.users || []).length,
      }));
    } catch (err) { console.error('Failed to load role counts', err); }
  };

  // helper: compute growth percentage vs yesterday
  const computeGrowthVsYesterday = (todayCount, yesterdayCount) => {
    if (yesterdayCount === 0) {
      if (todayCount === 0) return 0; // no change
      return 100; // from 0 to something => show 100%
    }
    return ((todayCount - yesterdayCount) / Math.abs(yesterdayCount)) * 100;
  };

  const approveAppointment = async (id) => {
    try {
      await axiosInstance.put(`/appointments/${id}`, { status: 'confirmed' });
      await loadAppointments();
    } catch (e) { console.error(e); alert(e?.response?.data?.message || 'Failed to approve'); }
  };

  const declineAppointment = async (id) => {
    try {
      await axiosInstance.put(`/appointments/${id}`, { status: 'cancelled' });
      await loadAppointments();
    } catch (e) { console.error(e); alert(e?.response?.data?.message || 'Failed to decline'); }
  };

  // load appointments and core data when admin dashboard mounts
  React.useEffect(() => {
    (async ()=>{
      // load core data (which now also fetches fresh appointments) on mount
      await loadCoreData();
  // load role counts (doctors, nurses, pharmacists)
      await loadRoleCounts();
      // load service requests for admin
      if (user?.role === 'admin') await loadServiceRequests();
    })();
  }, []);

  const startEditBeds = () => { setBedsDraft(String(bedsCount)); setEditingBeds(true); };
  const cancelEditBeds = () => { setEditingBeds(false); setBedsDraft(''); };
  const saveBeds = async () => {
    const num = Number(bedsDraft);
    if (Number.isNaN(num) || num < 0) return alert('Please enter a valid number');
    try {
      const res = await axiosInstance.put('/admin/settings/beds', { beds: num });
      setBedsCount(res.data.beds);
      setEditingBeds(false);
    } catch (e) { console.error(e); alert(e?.response?.data?.message || 'Failed to update'); }
  };

  // (summary removed)

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 z-50 flex items-center justify-center">
          <div className="bg-white rounded p-4 flex items-center gap-3 shadow">
            <svg className="animate-spin h-6 w-6 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <div>Loading dashboard...</div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Administration Panel</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="text-sm text-gray-500">Welcome, {user?.name || user?.role}</div>
          </div>
        </div>

        <TopStats items={[
          { title: 'Doctors', value: (stats.doctors || 0).toLocaleString(), growth: 0 },
          { title: 'Nurses', value: (stats.nurses || 0).toLocaleString(), growth: 0 },
          { title: 'Pharmacists', value: (stats.pharmacists || 0).toLocaleString(), growth: 0 },
          { title: 'Lab Techs', value: (stats.labTechnicians || 0).toLocaleString(), growth: 0 },
          { title: 'Finance', value: (stats.financeWorkers || 0).toLocaleString(), growth: 0 },
          { title: 'Non-Medical', value: (stats.nonMedical || 0).toLocaleString(), growth: 0 },
          { title: 'Patients', value: (stats.patients || 0).toLocaleString(), growth: 0 },
          { title: 'Available Beds', value: (bedsCount || 0).toString(), growth: 0 },
          { title: 'Appointments', value: (stats.appointments || 0).toLocaleString(), growth: 0 },
          { title: 'Total Invoice', value: ((invoices || []).length || 0).toLocaleString(), growth: 0 },
  ]} onStartEditBeds={startEditBeds} editingBeds={editingBeds} bedsCount={bedsCount} bedsDraft={bedsDraft} setBedsDraft={setBedsDraft} saveBeds={saveBeds} cancelEditBeds={cancelEditBeds} />

        <div className="md:flex md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded p-4 shadow overflow-visible">
                <h3 className="font-semibold mb-3">Patient Overview</h3>
                <GroupedBarChart data={barData} categories={["Child","Adult","Elderly"]} />
              </div>
              <div className="bg-white rounded p-4 shadow">
                <h3 className="font-semibold mb-3">Revenue</h3>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="min-w-0">
                      <LineChart seriesA={revenueSeries.seriesA} seriesB={revenueSeries.seriesB} labels={revenueSeries.labels} />
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-40 hidden sm:block">
                    <div className="bg-white dark:bg-gray-800 rounded p-3 shadow flex flex-col gap-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400">7-day summary</div>
                      <div className="text-lg font-bold text-indigo-600 dark:text-indigo-300">{(finance.totalRevenue || 0).toLocaleString()}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Invoices: <span className="text-gray-900 dark:text-gray-100 font-medium">{(finance.totalInvoices || 0).toLocaleString()}</span></div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Pharmacy: <span className="text-gray-900 dark:text-gray-100 font-medium">{(finance.totalPharmacy || 0).toLocaleString()}</span></div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Expenses: <span className="text-gray-900 dark:text-gray-100 font-medium">{(finance.expenses || 0).toLocaleString()}</span></div>
                      <div className={`mt-2 font-semibold ${finance.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>Net: {(finance.net || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="bg-white rounded p-4 shadow lg:col-span-2">
                <h3 className="font-semibold mb-3">Unserved & Upcoming Appointments</h3>
                <DataTable
                  columns={[{header:'Name',accessor:'name'},{header:'Date',accessor:'date'},{header:'Time',accessor:'time'},{header:'Doctor',accessor:'doctor'},{header:'Treatment',accessor:'treatment'},{header:'Status',accessor:'status'},{header:'Actions',accessor:'actions'}]}
                  data={ (appointments||[])
                    .filter(a => {
                      const s = (a.status || '').toLowerCase();
                      return s !== 'completed' && s !== 'cancelled';
                    })
                    .slice(0,10)
                    .map(a=>({ name: a.patient?.user?.name || '-', date: a.scheduledAt ? new Date(a.scheduledAt).toLocaleDateString() : '-', time: a.scheduledAt ? new Date(a.scheduledAt).toLocaleTimeString() : '-', doctor: a.doctor?.user?.name || '-', treatment: a.reason || a.status, status: a.status, actions: '' })) }
                />
              </div>
              <div className="bg-white rounded p-4 shadow">
                <h3 className="font-semibold mb-3">Today's Schedule</h3>
                <ul className="mt-2 text-sm space-y-2">
                  { recentAppointments.map((a,i)=>(<li key={a._id || i} className="p-2 bg-gray-50 rounded">{new Date(a.scheduledAt).toLocaleTimeString()} — {a.reason || a.status} ({a.doctor?.user?.name || '-'})</li>)) }
                </ul>
              </div>
            </div>
          </div>

          <div className="w-72">
            <PharmacySalesSummary axiosInstance={axiosInstance} />
            {/* summary area (removed) */}
            
            <div className="mt-4 bg-white rounded p-4 shadow">
              <h4 className="font-semibold mb-2">Service Requests (Recent)</h4>
              {serviceRequests.length === 0 ? (<div className="text-sm text-gray-500">No service requests</div>) : (
                <div className="space-y-2">
                  {(serviceRequests || [])
                    .filter(sr => (sr.status || '').toLowerCase() !== 'completed')
                    .slice(0,6)
                    .map(r => (
                    <div key={r._id} className="p-2 border rounded flex items-start justify-between">
                      <div>
                        <div className="font-medium">{r.type} — {r.requestedBy?.name || r.requestedBy?.email || 'Staff'}</div>
                        <div className="text-xs text-gray-500">{r.details || '-'} {r.ward ? `— Ward: ${r.ward}` : ''}</div>
                        <div className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`text-xs px-2 py-1 rounded ${r.status==='pending'?'bg-yellow-100 text-yellow-800': r.status==='in_progress' ? 'bg-blue-100 text-blue-800' : r.status==='completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{r.status}</div>
                        <div className="flex items-center gap-2">
                          {r.status !== 'completed' && <button className="text-xs btn-primary" onClick={async ()=>{ try{ await axiosInstance.put(`/requests/${r._id}`, { status: 'completed' }); await loadServiceRequests(); }catch(e){ console.error(e); } }}>Complete</button>}
                          <button className="text-xs btn-outline" onClick={async ()=>{ try{ await axiosInstance.put(`/requests/${r._id}`, { status: 'cancelled' }); await loadServiceRequests(); }catch(e){ console.error(e); } }}>Cancel</button>
                          <button className="text-xs btn" onClick={async ()=>{ try{ const res = await axiosInstance.get('/nurses/list'); setStaffList(res.data.nurses || []); setAssigningRequest(r); setSelectedAssignee(r.assignedTo? r.assignedTo._id || r.assignedTo : ''); setAssignModalOpen(true); }catch(e){ console.error(e); } }} disabled={!!(r.assignedTo)}>Assign</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assign Modal (kept) */}
        {assignModalOpen && assigningRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded p-4 w-11/12 max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold">Assign Request</h4>
                <button className="text-sm text-gray-600" onClick={()=>{ setAssignModalOpen(false); setAssigningRequest(null); setSelectedAssignee(''); }}>Close</button>
              </div>
              <div>
                <div className="mb-3">
                  <label className="text-xs text-gray-500">Role</label>
                  <select className="input w-full mb-2" value={assignRole} onChange={async e => {
                    const role = e.target.value; setAssignRole(role); setSelectedAssignee('');
                    try{
                      if (role === 'nurse') {
                        const res = await axiosInstance.get('/nurses/list'); setStaffList(res.data.nurses || []);
                      } else {
                        const res = await axiosInstance.get(`/users?role=${role}`); setStaffList(res.data.users || []);
                      }
                    }catch(err){ console.error('Failed to load staff for role', role, err); setStaffList([]); }
                  }}>
                    <option value="nurse">Nurse</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                  <label className="text-xs text-gray-500">Assign to</label>
                  <select className="input w-full" value={selectedAssignee} onChange={e=>setSelectedAssignee(e.target.value)}>
                    <option value="">-- Select staff --</option>
                    {staffList.map(n => <option key={n._id} value={n._id}>{n.name} {n.email ? `(${n.email})` : ''}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button className="btn-outline" onClick={()=>{ setAssignModalOpen(false); setAssigningRequest(null); setSelectedAssignee(''); }}>Cancel</button>
                  <button className="btn" onClick={async ()=>{ try{ await axiosInstance.put(`/requests/${assigningRequest._id}`, { assignedTo: selectedAssignee }); setAssignModalOpen(false); setAssigningRequest(null); setSelectedAssignee(''); await loadServiceRequests(); }catch(e){ console.error(e); alert('Failed to assign'); } }}>Assign</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export modal */}
        {exportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={closeExportModal}>
            <div className="absolute inset-0 bg-black opacity-40" />
            <div className="relative bg-white rounded p-4 w-full max-w-md mx-4" onClick={(e)=>e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-2">Send appointment PDF to (email)</h3>
              <input type="email" className="w-full border rounded p-2 mb-3" placeholder="recipient@example.com" value={exportRecipient} onChange={e=>setExportRecipient(e.target.value)} />
              <div className="flex justify-end space-x-2">
                <button className="btn-outline" onClick={closeExportModal} disabled={exportLoading}>Cancel</button>
                <button className="btn-primary" onClick={sendExportEmail} disabled={exportLoading}>{exportLoading? 'Sending...' : 'Send & Save'}</button>
              </div>
            </div>
          </div>
        )}

        {exportSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={()=>setExportSuccess(false)}>
            <div className="absolute inset-0 bg-black opacity-40" />
            <div className="relative bg-white rounded p-6 w-full max-w-sm mx-4 text-center" onClick={(e)=>e.stopPropagation()}>
              <div className="flex items-center justify-center mb-4">
                <div className="w-24 h-24 flex items-center justify-center bg-green-50 rounded-full">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
              <div className="font-semibold text-lg mb-2">Email sent</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}