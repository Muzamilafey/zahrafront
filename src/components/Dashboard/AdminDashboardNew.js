import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { FaUsers, FaStethoscope, FaCalendarAlt, FaDollarSign, FaPlus, FaUser, FaClock, FaCheckCircle } from 'react-icons/fa';

// Stat Card Component
function StatCard({ title, value, icon: Icon, color, trend, trendText }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className={`text-sm font-semibold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
              </span>
            )}
          </div>
          {trendText && <p className="text-xs text-gray-500 mt-1">{trendText}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="text-white text-xl" />
        </div>
      </div>
    </div>
  );
}

// Simple Bar Chart Component
function BarChart({ data, title }) {
  const max = Math.max(...data.map(d => d.value));
  const chartHeight = 200;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="flex items-end justify-around gap-4 h-64 mb-4">
        {data.map((item, idx) => {
          const height = (item.value / max) * chartHeight;
          return (
            <div key={idx} className="flex flex-col items-center gap-2 flex-1">
              <div
                className="w-full bg-blue-500 rounded-t transition hover:bg-blue-600"
                style={{ height: `${height}px` }}
                title={`${item.label}: ${item.value}`}
              />
              <span className="text-xs text-gray-600 text-center">{item.label}</span>
              <span className="text-sm font-semibold text-gray-900">{item.value}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-500 rounded-full" />
          Weekly
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-300 rounded-full" />
          Monthly
        </div>
      </div>
    </div>
  );
}

// Simple Pie Chart Component
function PieChart({ data, title }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <svg width="180" height="180" viewBox="0 0 180 180" className="flex-shrink-0">
          {(() => {
            let startAngle = -90;
            return data.map((item, idx) => {
              const percentage = (item.value / total) * 100;
              const angle = (percentage / 100) * 360;
              const endAngle = startAngle + angle;
              const isLarge = angle > 180 ? 1 : 0;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;

              const x1 = 90 + 70 * Math.cos(startRad);
              const y1 = 90 + 70 * Math.sin(startRad);
              const x2 = 90 + 70 * Math.cos(endRad);
              const y2 = 90 + 70 * Math.sin(endRad);

              const path = `M 90 90 L ${x1} ${y1} A 70 70 0 ${isLarge} 1 ${x2} ${y2} Z`;

              const result = (
                <path key={idx} d={path} fill={item.color} stroke="white" strokeWidth="2" />
              );

              startAngle = endAngle;
              return result;
            });
          })()}
        </svg>

        <div className="flex flex-col gap-3">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">{item.label}</span>
              <span className="text-sm font-semibold text-gray-900 ml-auto">
                {((item.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Quick Actions Component
function QuickActions() {
  const actions = [
    { icon: FaUser, label: 'Register\nnew patient', color: 'bg-blue-100 text-blue-600' },
    { icon: FaPlus, label: 'Start triage', color: 'bg-green-100 text-green-600' },
    { icon: FaCalendarAlt, label: 'Create\nappointment', color: 'bg-purple-100 text-purple-600' },
    { icon: FaDollarSign, label: 'Add invoice', color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              className={`flex flex-col items-center justify-center p-4 rounded-lg ${action.color} hover:shadow-md transition`}
            >
              <Icon className="text-2xl mb-2" />
              <span className="text-xs font-medium text-center text-gray-800">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Send Bulk SMS Component
function SendBulkSMS() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Send bulk SMS</h3>
      <div className="flex flex-col gap-4">
        <button className="flex items-center justify-center gap-2 bg-blue-100 text-blue-600 hover:bg-blue-200 transition p-3 rounded-lg">
          <FaUser className="text-xl" />
          <span className="text-sm font-medium">Send message</span>
        </button>
        <button className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 transition p-3 rounded-lg border border-blue-200">
          <FaCheckCircle className="text-xl" />
          <span className="text-sm font-medium">View status</span>
        </button>
        <button className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 transition p-3 rounded-lg border border-blue-200">
          <FaClock className="text-xl" />
          <span className="text-sm font-medium">Scheduled</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { axiosInstance } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalPatients: 121,
    totalDoctors: 8,
    pendingLabResults: 5,
    admissionsToday: 12,
    appointmentsToday: 9,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch data from API
        const [patientsRes, doctorsRes, appointmentsRes, admissionsRes] = await Promise.all([
          axiosInstance.get('/patients').catch(() => ({ data: { patients: [] } })),
          axiosInstance.get('/users?role=doctor').catch(() => ({ data: { users: [] } })),
          axiosInstance.get('/appointments').catch(() => ({ data: { appointments: [] } })),
          axiosInstance.get('/admissions').catch(() => ({ data: { admissions: [] } })),
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const admissionsToday = (admissionsRes.data.admissions || []).filter(a => {
          const date = new Date(a.createdAt);
          date.setHours(0, 0, 0, 0);
          return date.getTime() === today.getTime();
        }).length;

        const appointmentsToday = (appointmentsRes.data.appointments || []).filter(a => {
          const date = new Date(a.scheduledAt);
          date.setHours(0, 0, 0, 0);
          return date.getTime() === today.getTime();
        }).length;

        setStats({
          totalPatients: (patientsRes.data.patients || []).length,
          totalDoctors: (doctorsRes.data.users || []).length,
          pendingLabResults: 5,
          admissionsToday,
          appointmentsToday,
        });
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [axiosInstance]);

  const patientsData = [
    { label: 'Mon', value: 120 },
    { label: 'Tue', value: 150 },
    { label: 'Wed', value: 140 },
    { label: 'Thu', value: 160 },
    { label: 'Fri', value: 170 },
    { label: 'Sat', value: 130 },
    { label: 'Sun', value: 110 },
  ];

  const revenueData = [
    { label: 'Cash', value: 3500 },
    { label: 'M-PESA', value: 4200 },
    { label: 'Insurance', value: 2800 },
  ];

  const diseasesData = [
    { label: 'Gastroenteritis', value: 45, color: '#3B82F6' },
    { label: 'Malaria', value: 35, color: '#10B981' },
    { label: 'Pneumonia', value: 25, color: '#F59E0B' },
  ];

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Total Patients Today"
          value={stats.totalPatients}
          icon={FaUsers}
          color="bg-blue-500"
          trend={12}
          trendText="From last month"
        />
        <StatCard
          title="Doctors on Duty"
          value={stats.totalDoctors}
          icon={FaStethoscope}
          color="bg-green-500"
          trendText="Available now"
        />
        <StatCard
          title="Pending Lab Results"
          value={stats.pendingLabResults}
          icon={FaCheckCircle}
          color="bg-yellow-500"
          trendText="Awaiting review"
        />
        <StatCard
          title="Admissions Today"
          value={stats.admissionsToday}
          icon={FaUser}
          color="bg-purple-500"
          trendText="New admissions"
        />
        <StatCard
          title="Appointments Today"
          value={stats.appointmentsToday}
          icon={FaCalendarAlt}
          color="bg-pink-500"
          trendText="Scheduled"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BarChart data={patientsData} title="Patients" />
        <div className="grid grid-cols-1 gap-6">
          <BarChart
            data={revenueData}
            title="Revenue Collections"
          />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PieChart data={diseasesData} title="Top Diseases This Month" />
        <QuickActions />
        <SendBulkSMS />
      </div>
    </div>
  );
}
