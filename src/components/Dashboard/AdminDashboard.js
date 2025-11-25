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
  const { axiosInstance } = useContext(AuthContext);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [lowStockDrugs, setLowStockDrugs] = useState([]);
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [beds, setBeds] = useState({ available: 0, roomCounts: {} });
  const [doctors, setDoctors] = useState({ available: 0, leave: 0 });
  const [patients, setPatients] = useState({ total: 0, change: 0 });
  const [appointmentsStat, setAppointmentsStat] = useState({ total: 0, change: 0 });

  // Pills removed from dashboard. Navigation will be placed in admin/tools page.
  useEffect(() => {
    // Fetch beds
    axiosInstance.get('/wards/beds/summary').then(res => {
      const roomTypes = res.data.rooms || [];
        const body = res.data || {};
        const roomCounts = {};
        // Case A: rooms is an array of { name, beds: <number> }
        if (Array.isArray(body.rooms)) {
          body.rooms.forEach(room => {
            if (room && room.name) {
              if (Array.isArray(room.beds)) {
                roomCounts[room.name] = room.beds.length;
              } else {
                roomCounts[room.name] = Number(room.beds || 0);
              }
            }
          });
        }
        // Case B: API returns beds array directly
        if (Array.isArray(body.beds) && Object.keys(roomCounts).length === 0) {
          // count beds per room name if present on each bed
          body.beds.forEach(b => {
            const rn = (b.room && b.room.name) || (b.roomName) || 'General';
            roomCounts[rn] = (roomCounts[rn] || 0) + 1;
          });
        }
        setBeds({
          available: Number(body.available || 0),
          roomCounts,
        });
    }).catch(() => setBeds({ available: 0, roomCounts: {} }));

    // Fetch doctors
    axiosInstance.get('/users?role=doctor').then(res => {
      const all = res.data.users || [];
      setDoctors({
        available: all.filter(d => d.status !== 'leave').length,
        leave: all.filter(d => d.status === 'leave').length,
      });
    }).catch(() => setDoctors({ available: 0, leave: 0 }));

    // Fetch patients
    axiosInstance.get('/patients').then(res => {
      // Simulate change percentage for demo
      setPatients({ total: (res.data.patients || []).length, change: 12 });
    }).catch(() => setPatients({ total: 0, change: 0 }));

    // Fetch appointments stat
    axiosInstance.get('/appointments').then(res => {
      // Simulate change percentage for demo
      setAppointmentsStat({ total: (res.data.appointments || []).length, change: -11 });
      // Also set upcoming appointments for main grid
      const now = new Date();
      const upcoming = (res.data.appointments || []).filter(a => {
        const s = (a.status || '').toLowerCase();
        return s !== 'completed' && s !== 'cancelled' && new Date(a.scheduledAt) > now;
      }).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)).slice(0, 5);
      setUpcomingAppointments(upcoming);
    }).catch(() => setAppointmentsStat({ total: 0, change: 0 }));

    // Fetch invoices
    axiosInstance.get('/billing')
      .then(res => setInvoices(res.data.invoices || []));

    // Fetch emergencies (placeholder endpoint)
    axiosInstance.get('/emergencies').then(res => setEmergencies(res.data.emergencies || [])).catch(() => setEmergencies([]));

    // Fetch low stock drugs (placeholder endpoint)
    axiosInstance.get('/drugs/low-stock').then(res => setLowStockDrugs(res.data.drugs || [])).catch(() => setLowStockDrugs([]));

    // Fetch inactive users (placeholder endpoint)
      // Fetch all staff users and recent audit logs, then compute last login per user
      const loadInactive = async () => {
        try {
          // fetch non-patient users
          const usersRes = await axiosInstance.get('/users?role=all');
          const usersList = (usersRes.data.users || []).filter(u => u.role !== 'patient');

          // fetch recent audit logs (notifications endpoint) and filter login actions
          const logsRes = await axiosInstance.get('/notifications/recent');
          const logs = logsRes.data.notifications || [];

          // build map of last login timestamp per user
          const lastLoginMap = {};
          logs.forEach(l => {
            if (l.action === 'login' && l.user && l.user._id) {
              const cur = lastLoginMap[l.user._id];
              const t = new Date(l.createdAt).getTime();
              if (!cur || t > cur) lastLoginMap[l.user._id] = t;
            }
          });

          // Now compute inactive users: those whose last login is older than 5 days OR have no login entry
          const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000;
          const now = Date.now();
          const inactive = usersList.filter(u => {
            const last = lastLoginMap[u._id];
            if (!last) return true; // never logged in -> consider inactive
            return (now - last) >= FIVE_DAYS;
          }).map(u => ({ ...u, lastLogin: lastLoginMap[u._id] ? new Date(lastLoginMap[u._id]).toISOString() : null }));

          setInactiveUsers(inactive);
        } catch (err) {
          console.error('Failed to load inactive users by login logs', err);
          setInactiveUsers([]);
        }
      };

      loadInactive();
  }, [axiosInstance]);

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Pills Navigation removed. Use admin/tools page for navigation. */}

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 w-full">
        {/* Total Beds */}
        <div className="bg-white rounded-xl shadow p-3 sm:p-4 md:p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg sm:text-xl">🛏️</span>
            <span className="font-semibold text-base sm:text-lg">Total Beds</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-bold">{Object.values(beds.roomCounts).reduce((a, b) => a + b, 0)}</span>
            <span className="px-2 sm:px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs sm:text-sm font-semibold">Available</span>
            <span className="text-base sm:text-lg font-bold text-green-700">{beds.available}</span>
          </div>
          <div className="flex gap-3 sm:gap-6 text-xs text-gray-500 mt-2 flex-wrap">
            {beds.roomCounts && Object.entries(beds.roomCounts).map(([name, count]) => (
              <span key={name}>{count} {name}</span>
            ))}
          </div>
        </div>
        {/* Doctors */}
        <div className="bg-white rounded-xl shadow p-3 sm:p-4 md:p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg sm:text-xl">🧑‍⚕️</span>
            <span className="font-semibold text-base sm:text-lg">Doctors</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-bold">{doctors.available}</span>
            <span className="px-2 sm:px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs sm:text-sm font-semibold">Available</span>
            <span className="text-base sm:text-lg font-bold text-gray-500">{doctors.leave} Leave</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 mt-2">Shows the current number of available doctors.</div>
        </div>
        {/* Patients */}
        <div className="bg-white rounded-xl shadow p-3 sm:p-4 md:p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg sm:text-xl">👥</span>
            <span className="font-semibold text-base sm:text-lg">Patients</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-bold">{patients.total}</span>
            <span className="px-2 sm:px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs sm:text-sm font-semibold">↗ {patients.change}%</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 mt-2">Displays live updates of patient numbers.</div>
        </div>
        {/* Appointments */}
        <div className="bg-white rounded-xl shadow p-3 sm:p-4 md:p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg sm:text-xl">📅</span>
            <span className="font-semibold text-base sm:text-lg">Appointment</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-bold">{appointmentsStat.total}</span>
            <span className="px-2 sm:px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs sm:text-sm font-semibold">↘ {Math.abs(appointmentsStat.change)}%</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 mt-2">Ensures accurate and current total patient appointment at all times.</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mt-6">
        {/* UPCOMING APPOINTMENTS */}
        <div className="bg-white rounded-xl shadow p-3 sm:p-4 md:p-6 min-h-[160px] sm:min-h-[180px] flex flex-col">
          <span className="font-bold text-base sm:text-lg mb-2">UPCOMING APPOINTMENTS</span>
          <div className="flex-1 overflow-y-auto">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map(a => (
                <div key={a._id} className="flex items-start sm:items-center p-2 border-b last:border-b-0 gap-2">
                  <div className="w-7 sm:w-8 h-7 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 flex-shrink-0 text-xs sm:text-sm">
                    {a.patient?.user?.name ? a.patient.user.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="font-semibold text-xs sm:text-sm truncate">{a.patient?.user?.name || 'Walk-in Patient'}</div>
                    <div className="text-xs text-gray-500 truncate">Dr. {a.doctor?.user?.name || 'N/A'}</div>
                  </div>
                  <div className="text-right text-xs flex-shrink-0">
                    <div>{new Date(a.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    <div>{new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center">No upcoming appointments.</div>
            )}
          </div>
        </div>

        {/* RECENT TRANSACTIONS ONLY LAST 5 */}
        <div className="bg-white rounded-xl shadow p-3 sm:p-4 md:p-6 min-h-[160px] sm:min-h-[180px] flex flex-col">
          <span className="font-bold text-base sm:text-lg mb-2 truncate">RECENT TRANSACTIONS</span>
          <div className="flex-1 overflow-y-auto">
            {invoices.slice(-5).reverse().map(inv => (
              <div key={inv._id} className="flex items-start sm:items-center p-2 border-b last:border-b-0 gap-2">
                <div className="font-semibold text-green-600 text-xs sm:text-sm flex-shrink-0">${inv.amount}</div>
                <div className="flex-grow min-w-0 text-xs">
                  <div className="truncate">{inv.patient?.user?.name || 'Patient'}</div>
                  <div className="text-gray-500 text-xs">{new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
                <div className="text-xs text-gray-500 flex-shrink-0">{inv.status}</div>
              </div>
            ))}
            {invoices.length === 0 && <div className="text-gray-400 text-center">No transactions.</div>}
          </div>
        </div>

        {/* EMERGENCY BOARD */}
        <div className="bg-white rounded-xl shadow p-3 sm:p-4 md:p-6 min-h-[160px] sm:min-h-[180px] flex flex-col">
          <span className="font-bold text-base sm:text-lg mb-2">EMERGENCY BOARD</span>
          <div className="flex-1 overflow-y-auto">
            {emergencies.length > 0 ? (
              emergencies.map(e => (
                <div key={e._id} className="text-red-600 font-semibold p-2 border-b last:border-b-0 text-xs sm:text-sm">{e.title || 'Emergency'} - {e.status}</div>
              ))
            ) : (
              <div className="text-red-600 font-semibold">No emergencies reported.</div>
            )}
          </div>
        </div>

        {/* LOW STOCKS DRUGS/MOST SELLING */}
        <div className="bg-white rounded-xl shadow p-3 sm:p-4 md:p-6 min-h-[160px] sm:min-h-[180px] flex flex-col">
          <span className="font-bold text-base sm:text-lg mb-2 truncate">LOW STOCK DRUGS</span>
          <div className="flex-1 overflow-y-auto">
            {lowStockDrugs.length > 0 ? (
              lowStockDrugs.map(d => (
                <div key={d._id} className="text-yellow-600 p-2 border-b last:border-b-0 text-xs sm:text-sm truncate" title={d.name}>{d.name} - {d.stock} left</div>
              ))
            ) : (
              <div className="text-yellow-600">No low stock drugs.</div>
            )}
          </div>
        </div>

        {/* INACTIVE USERS DIDNT LOGIN LAST 5 DAYS AND ABOVE */}
        <div className="bg-white rounded-xl shadow p-3 sm:p-4 md:p-6 min-h-[160px] sm:min-h-[180px] flex flex-col">
          <span className="font-bold text-base sm:text-lg mb-2 truncate">INACTIVE USERS (5+ DAYS)</span>
          <div className="flex-1 overflow-y-auto">
            {inactiveUsers.length > 0 ? (
              inactiveUsers.map(u => (
                <div key={u._id} className="text-gray-600 p-2 border-b last:border-b-0 text-xs sm:text-sm" title={u.name}>
                  <div className="truncate font-semibold">{u.name}</div>
                  <div className="text-xs text-gray-500">Last: {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-600">No inactive users.</div>
            )}
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="bg-white rounded-xl shadow p-3 sm:p-4 md:p-6 min-h-[160px] sm:min-h-[180px] flex flex-col">
          <span className="font-bold text-base sm:text-lg mb-2">QUICK LINKS</span>
          <div className="flex-1">
            <ul className="list-disc ml-4 sm:ml-6 space-y-1">
              <li><a href="/dashboard/admin/patients" className="text-blue-600 hover:underline text-xs sm:text-sm">Patients</a></li>
              <li><a href="/dashboard/admin/doctors" className="text-blue-600 hover:underline text-xs sm:text-sm">Doctors</a></li>
              <li><a href="/dashboard/admin/appointments" className="text-blue-600 hover:underline text-xs sm:text-sm">Appointments</a></li>
              <li><a href="/dashboard/admin/pharmacy" className="text-blue-600 hover:underline text-xs sm:text-sm">Pharmacy</a></li>
              <li><a href="/dashboard/admin/labs" className="text-blue-600 hover:underline text-xs sm:text-sm">Labs</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
