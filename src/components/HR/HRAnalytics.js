import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { FaChartBar, FaUsers, FaArrowUp, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';

export default function HRAnalytics() {
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useToast();
  const [data, setData] = useState({
    totalEmployees: 0,
    maleEmployees: 0,
    femaleEmployees: 0,
    departmentBreakdown: {},
    attendanceRate: 0,
    leaveUsage: 0,
    payrollCost: 0,
    performanceAverage: 0,
    turnoverRate: 0,
    recruitmentsInProgress: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const employeesRes = await axiosInstance.get('/api/employees');
      const attendanceRes = await axiosInstance.get('/api/attendance');
      const leavesRes = await axiosInstance.get('/api/leaves');
      const payrollRes = await axiosInstance.get('/api/payroll');
      const performanceRes = await axiosInstance.get('/api/performance');

      const employees = employeesRes.data.data || [];
      const attendance = attendanceRes.data.data || [];
      const leaves = leavesRes.data.data || [];
      const payroll = payrollRes.data.data || [];
      const performance = performanceRes.data.data || [];

      // Calculate metrics
      const maleCount = employees.filter(e => e.gender === 'male').length;
      const femaleCount = employees.filter(e => e.gender === 'female').length;
      const attendanceRate = attendance.length > 0 ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100) : 0;
      const totalPayroll = payroll.reduce((sum, p) => sum + (p.baseSalary || 0), 0);
      const avgPerformance = performance.length > 0 ? Math.round(performance.reduce((sum, p) => sum + (p.score || 0), 0) / performance.length) : 0;

      setData({
        totalEmployees: employees.length,
        maleEmployees: maleCount,
        femaleEmployees: femaleCount,
        departmentBreakdown: groupBy(employees, 'department'),
        attendanceRate,
        leaveUsage: leaves.filter(l => l.status === 'approved').length,
        payrollCost: totalPayroll,
        performanceAverage: avgPerformance,
        turnoverRate: employees.filter(e => e.status === 'terminated').length,
        recruitmentsInProgress: 0
      });
    } catch (err) {
      showToast('Failed to load analytics', 'error');
    }
  };

  const groupBy = (arr, key) => {
    return arr.reduce((result, item) => {
      const group = item[key] || 'Unassigned';
      if (!result[group]) result[group] = 0;
      result[group]++;
      return result;
    }, {});
  };

  const KPICard = ({ icon: Icon, title, value, unit = '', color = 'brand' }) => (
    <div className={`bg-white p-6 rounded-lg shadow border-l-4 border-${color}-600`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 text-sm mb-2">{title}</p>
          <p className={`text-3xl font-bold text-${color}-600`}>{value}{unit}</p>
        </div>
        <Icon className={`text-3xl text-${color}-600 opacity-20`} />
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
        <FaChartBar /> HR Analytics & KPIs
      </h1>

      {/* Main KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KPICard icon={FaUsers} title="Total Employees" value={data.totalEmployees} color="brand" />
        <KPICard icon={FaUsers} title="Male Employees" value={data.maleEmployees} color="blue" />
        <KPICard icon={FaUsers} title="Female Employees" value={data.femaleEmployees} color="pink" />
        <KPICard icon={FaCalendarAlt} title="Attendance Rate" value={data.attendanceRate} unit="%" color="green" />
        <KPICard icon={FaArrowUp} title="Avg Performance" value={data.performanceAverage} unit="/100" color="yellow" />
        <KPICard icon={FaMoneyBillWave} title="Monthly Payroll" value={`KES ${(data.payrollCost / 1000).toFixed(0)}K`} color="purple" />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <KPICard icon={FaCalendarAlt} title="Approved Leaves" value={data.leaveUsage} color="blue" />
        <KPICard icon={FaArrowUp} title="Turnover Rate" value={data.turnoverRate} color="red" />
        <KPICard icon={FaUsers} title="Pending Recruitments" value={data.recruitmentsInProgress} color="orange" />
      </div>

      {/* Department Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Staff Distribution by Department</h2>
          <div className="space-y-4">
            {Object.entries(data.departmentBreakdown).map(([dept, count]) => (
              <div key={dept}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">{dept}</span>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-brand-600 h-2 rounded-full"
                    style={{ width: `${(count / data.totalEmployees) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">HR Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-700">Total Workforce</span>
              <span className="font-bold text-gray-900">{data.totalEmployees} employees</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-700">Gender Ratio</span>
              <span className="font-bold text-gray-900">{data.maleEmployees}M : {data.femaleEmployees}F</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-700">Attendance Performance</span>
              <span className={`font-bold ${data.attendanceRate >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>{data.attendanceRate}%</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-700">Monthly Payroll Cost</span>
              <span className="font-bold text-gray-900">KES {(data.payrollCost / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-700">Average Performance Score</span>
              <span className={`font-bold ${data.performanceAverage >= 75 ? 'text-green-600' : 'text-yellow-600'}`}>{data.performanceAverage}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Turnover (Terminated)</span>
              <span className="font-bold text-red-600">{data.turnoverRate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Performance Distribution</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>90-100 (Excellent)</span>
              <div className="w-32 bg-gray-200 rounded h-2 inline-block"><div className="bg-green-500 h-2 rounded" style={{ width: '30%' }}></div></div>
            </div>
            <div className="flex justify-between">
              <span>75-89 (Good)</span>
              <div className="w-32 bg-gray-200 rounded h-2 inline-block"><div className="bg-blue-500 h-2 rounded" style={{ width: '50%' }}></div></div>
            </div>
            <div className="flex justify-between">
              <span>60-74 (Average)</span>
              <div className="w-32 bg-gray-200 rounded h-2 inline-block"><div className="bg-yellow-500 h-2 rounded" style={{ width: '15%' }}></div></div>
            </div>
            <div className="flex justify-between">
              <span>Below 60 (Needs Improvement)</span>
              <div className="w-32 bg-gray-200 rounded h-2 inline-block"><div className="bg-red-500 h-2 rounded" style={{ width: '5%' }}></div></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Leave Utilization Trend</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Annual Leave Used</span>
              <span className="font-bold">{Math.round((data.leaveUsage / (data.totalEmployees * 20)) * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Remaining Leave Balance</span>
              <span className="font-bold text-green-600">{Math.round((data.totalEmployees * 20) - data.leaveUsage)} days</span>
            </div>
            <div className="flex justify-between">
              <span>Projected Annual Usage</span>
              <span className="font-bold text-blue-600">{data.totalEmployees * 15} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
