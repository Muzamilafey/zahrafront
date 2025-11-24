import React, { useEffect, useState, useContext, useMemo } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';

// --- SVG Icons (from Heroicons) ---
const UserGroupIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 00-12 0m12 0a9.094 9.094 0 01-12 0m12 0v-4.5A9.094 9.094 0 006 14.22v4.5m12 0a9.094 9.094 0 01-12 0" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.05a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.25a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0122.5 8.25v.75M7.5 14.25v.001M.75 14.25v.001M10.5 14.25v.001M13.5 14.25v.001M16.5 14.25v.001M19.5 14.25v.001M22.5 14.25v.001" />
  </svg>
);

const CalendarDaysIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" />
  </svg>
);

const BanknotesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.75A.75.75 0 013 4.5h.75m0 0A.75.75 0 014.5 6v.75m0 0v-.75A.75.75 0 014.5 4.5h.75m0 0A.75.75 0 016 6v.75m0 0v-.75A.75.75 0 016 4.5h.75m0 0A.75.75 0 017.5 6v.75m0 0v-.75A.75.75 0 017.5 4.5h.75m0 0A.75.75 0 019 6v.75m0 0v-.75A.75.75 0 019 4.5h.75m0 0A.75.75 0 0110.5 6v.75m0 0v-.75a.75.75 0 01.75-.75h.75m-1.5 0A.75.75 0 0112 6v.75m0 0v-.75a.75.75 0 01.75-.75h.75m0 0A.75.75 0 0113.5 6v.75m0 0v-.75a.75.75 0 01.75-.75h.75M15 4.5v.75A.75.75 0 0114.25 6h-.75m0 0v-.75A.75.75 0 0114.25 4.5h.75m0 0A.75.75 0 0115.75 6v.75m0 0v-.75A.75.75 0 0115.75 4.5h.75m0 0A.75.75 0 0117.25 6v.75m0 0v-.75A.75.75 0 0117.25 4.5h.75m0 0A.75.75 0 0118.75 6v.75m0 0v-.75A.75.75 0 0118.75 4.5h.75m0 0A.75.75 0 0120.25 6v.75m0 0v-.75a.75.75 0 01.75-.75h.75m-1.5 0A.75.75 0 0121 6v.75m0 0v-.75A.75.75 0 0121 4.5h.75m0 0a2.25 2.25 0 012.25 2.25v.75m0 0s-1.5 0-1.5 1.5s1.5 1.5 1.5 1.5m0 0V18a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 014.5 4.5h15" />
    </svg>
  );
  

// --- Reusable Components ---

function TopStatCard({ title, value, icon, change, changeColor }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow flex items-center justify-between">
      <div className="flex items-center">
        <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg mr-4">
          {icon}
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
      </div>
      {change && (
        <div className={`text-sm font-semibold ${changeColor}`}>
          {change}
        </div>
      )}
    </div>
  );
}

function BarChart({ data, height = 250 }) {
    const max = Math.max(...data.map(d => d.value));
    const barWidth = 30;
    const chartWidth = data.length * (barWidth + 20) + 40;
  
    return (
      <div className="w-full overflow-x-auto">
        <svg width={chartWidth} height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
          {data.map((d, i) => (
            <g key={i} transform={`translate(${i * (barWidth + 20) + 30}, 0)`}>
              <rect
                x="0"
                y={height - ((d.value / (max || 1)) * (height - 40)) - 30}
                width={barWidth}
                height={(d.value / (max || 1)) * (height - 40)}
                rx="5"
                fill="#3B82F6"
              />
              <text x={barWidth / 2} y={height - 10} fontSize="11" textAnchor="middle" fill="#6B7280" className="dark:fill-gray-400">
                {d.label}
              </text>
            </g>
          ))}
          {/* Y-axis Line */}
          <line x1="20" y1="10" x2="20" y2={height - 30} stroke="#E5E7EB" className="dark:stroke-gray-700" strokeWidth="1" />
        </svg>
      </div>
    );
}

function PieChart({ items, size = 160 }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  let acc = 0;
  const radius = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {items.map((it, i) => {
        const startAngle = (acc / total) * 360;
        acc += it.value;
        const endAngle = (acc / total) * 360;
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        const startX = radius + radius * Math.cos(Math.PI * (startAngle - 90) / 180);
        const startY = radius + radius * Math.sin(Math.PI * (startAngle - 90) / 180);
        const endX = radius + radius * Math.cos(Math.PI * (endAngle - 90) / 180);
        const endY = radius + radius * Math.sin(Math.PI * (endAngle - 90) / 180);
        
        const d = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
        
        return <path key={i} d={d} fill="none" stroke={it.color} strokeWidth="20" />;
      })}
    </svg>
  );
}


export default function AdminDashboard() {
  const { user, axiosInstance } = useContext(AuthContext);
  const [stats, setStats] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching ---
  const loadData = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const [
        pRes, 
        dRes, 
        apptsRes,
        invRes, 
        nursesRes, 
        pharmaRes, 
        labRes,
        nonMedRes,
        financeRes
      ] = await Promise.all([
        axiosInstance.get('/patients'),
        axiosInstance.get('/users?role=doctor'),
        axiosInstance.get('/appointments'),
        axiosInstance.get('/billing'),
        axiosInstance.get('/users?role=nurse'),
        axiosInstance.get('/users?role=pharmacist'),
        axiosInstance.get('/users?role=lab'),
        axiosInstance.get('/users?role=cleaning'), // Assuming non-medical roles
        axiosInstance.get('/users?role=finance'),
      ]);

      const patientCount = (pRes.data.patients || []).length;
      const doctorCount = (dRes.data.users || []).length;
      const appointmentCount = (apptsRes.data.appointments || []).length;
      const nurseCount = (nursesRes.data.users || []).length;
      const pharmaCount = (pharmaRes.data.users || []).length;
      const labCount = (labRes.data.users || []).length;
      const nonMedCount = (nonMedRes.data.users || []).length;
      const financeCount = (financeRes.data.users || []).length;

      const totalStaff = doctorCount + nurseCount + pharmaCount + labCount + nonMedCount + financeCount;
      const totalIncome = (invRes.data.invoices || []).reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

      setStats({
        patients: patientCount,
        staff: totalStaff,
        appointments: appointmentCount,
        income: totalIncome,
      });

      setAppointments(apptsRes.data.appointments || []);
      setInvoices(invRes.data.invoices || []);
      setPatients(pRes.data.patients || []);
      setDoctors(dRes.data.users || []); // Assuming /users endpoint returns user objects

    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < 1500) {
        await new Promise(resolve => setTimeout(resolve, 1500 - elapsed));
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Memoized Data for Charts ---
  const patientStatsChartData = useMemo(() => {
    const labels = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toLocaleString('default', { month: 'short' });
      }).reverse();
  
    // This is placeholder logic. Replace with actual monthly patient data if available.
    // For now, it simulates decreasing numbers for past months.
    return labels.map((label, i) => ({
      label,
      value: Math.round((stats.patients || 0) * (1 - (5 - i) * 0.15)),
    }));
  }, [stats.patients]);

  const upcomingAppointments = useMemo(() => {
    return (appointments || [])
      .filter(a => {
        const s = (a.status || '').toLowerCase();
        return s !== 'completed' && s !== 'cancelled' && new Date(a.scheduledAt) > new Date();
      })
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
      .slice(0, 5);
  }, [appointments]);

  const patientPieData = useMemo(() => {
    const byDept = {};
    (patients || []).forEach(p => {
      const dept = p.admission?.ward || p.department || 'Outpatient';
      byDept[dept] = (byDept[dept] || 0) + 1;
    });
    return Object.keys(byDept).map((k, i) => ({ 
      label: k, 
      value: byDept[k], 
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][i % 4] 
    }));
  }, [patients]);


  if (loading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <div className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {user?.name || user?.role}!</p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <div className="relative">
            <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <TopStatCard title="Total Patient" value={(stats.patients || 0).toLocaleString()} icon={<UserGroupIcon />} change="+15%" changeColor="text-green-500"/>
        <TopStatCard title="Staff" value={(stats.staff || 0).toLocaleString()} icon={<BriefcaseIcon />} change="+2" changeColor="text-green-500"/>
        <TopStatCard title="Appointments" value={(stats.appointments || 0).toLocaleString()} icon={<CalendarDaysIcon />} change="-3%" changeColor="text-red-500"/>
        <TopStatCard title="Total Income" value={`$${(stats.income || 0).toLocaleString()}`} icon={<BanknotesIcon />} change="+8%" changeColor="text-green-500"/>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Patient Statistics */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Patient Statistics</h2>
            <BarChart data={patientStatsChartData} />
          </div>
          {/* Upcoming Appointments */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Upcoming Appointments</h2>
            <div className="space-y-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map(a => (
                  <div key={a._id} className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300">
                      {a.patient?.user?.name ? a.patient.user.name.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div className="ml-4 flex-grow">
                      <p className="font-semibold text-gray-700 dark:text-gray-200">{a.patient?.user?.name || 'Walk-in Patient'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Dr. {a.doctor?.user?.name || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-700 dark:text-gray-300">{new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{a.reason || 'Check-up'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No upcoming appointments.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Patient Distribution */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Patient Distribution</h2>
            <div className="flex justify-center my-4">
                <PieChart items={patientPieData} />
            </div>
            <div className="space-y-2">
                {patientPieData.map(item => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                            <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-white">{item.value}</span>
                    </div>
                ))}
            </div>
          </div>
          {/* Hospital Staff */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Hospital Staff</h2>
            <div className="space-y-3">
              {(doctors || []).slice(0, 4).map(doc => (
                 <div key={doc._id} className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                      {doc.name ? doc.name.charAt(0).toUpperCase() : 'D'}
                    </div>
                    <div className="ml-3">
                        <p className="font-semibold text-gray-700 dark:text-gray-200">{doc.name || 'Doctor'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{doc.specialty || 'General'}</p>
                    </div>
                 </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
