import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { FaPlus, FaClock } from 'react-icons/fa';

export default function AttendanceManagement() {
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useToast();
  const [attendance, setAttendance] = useState([]);
  const [showClockIn, setShowClockIn] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [formData, setFormData] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], clockInTime: '', clockOutTime: '' });
  const [manualData, setManualData] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], status: 'present' });

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await axiosInstance.get('/api/attendance');
      setAttendance(res.data.data || []);
    } catch (err) {
      showToast('Failed to load attendance', 'error');
    }
  };

  const handleClockIn = async (e) => {
    e.preventDefault();
    try {
      const clockInData = {
        employeeId: formData.employeeId,
        date: formData.date,
        clockInTime: new Date().toLocaleTimeString(),
        status: 'present'
      };
      await axiosInstance.post('/api/attendance', clockInData);
      showToast('Clocked in successfully', 'success');
      setShowClockIn(false);
      setFormData({ employeeId: '', date: new Date().toISOString().split('T')[0], clockInTime: '', clockOutTime: '' });
      fetchAttendance();
    } catch (err) {
      showToast('Failed to clock in', 'error');
    }
  };

  const handleManualEntry = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/attendance', manualData);
      showToast('Attendance recorded', 'success');
      setShowManualEntry(false);
      setManualData({ employeeId: '', date: new Date().toISOString().split('T')[0], status: 'present' });
      fetchAttendance();
    } catch (err) {
      showToast('Failed to record attendance', 'error');
    }
  };

  const calculateHoursWorked = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return '-';
    const inTime = new Date(`2000-01-01 ${clockIn}`);
    const outTime = new Date(`2000-01-01 ${clockOut}`);
    const hours = (outTime - inTime) / (1000 * 60 * 60);
    return hours.toFixed(2) + ' hrs';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowClockIn(true)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            <FaClock /> Clock In/Out
          </button>
          <button onClick={() => setShowManualEntry(true)} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
            <FaPlus /> Manual Entry
          </button>
        </div>
      </div>

      {showClockIn && (
        <div className="bg-white p-6 rounded-lg mb-6 border border-gray-200">
          <form onSubmit={handleClockIn} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Employee ID" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="border rounded px-3 py-2" />
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex-1">Clock In Now</button>
              <button type="button" onClick={() => setShowClockIn(false)} className="bg-gray-300 text-gray-900 px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showManualEntry && (
        <div className="bg-white p-6 rounded-lg mb-6 border border-gray-200">
          <form onSubmit={handleManualEntry} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Employee ID" value={manualData.employeeId} onChange={e => setManualData({...manualData, employeeId: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="date" value={manualData.date} onChange={e => setManualData({...manualData, date: e.target.value})} className="border rounded px-3 py-2" />
            <select value={manualData.status} onChange={e => setManualData({...manualData, status: e.target.value})} className="border rounded px-3 py-2 md:col-span-2">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="leave">On Leave</option>
              <option value="half-day">Half Day</option>
            </select>
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700">Record</button>
              <button type="button" onClick={() => setShowManualEntry(false)} className="bg-gray-300 text-gray-900 px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{attendance.filter(a => a.status === 'present').length}</div>
          <div className="text-gray-600 text-sm">Present</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{attendance.filter(a => a.status === 'absent').length}</div>
          <div className="text-gray-600 text-sm">Absent</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{attendance.filter(a => a.status === 'late').length}</div>
          <div className="text-gray-600 text-sm">Late</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{attendance.filter(a => a.status === 'leave').length}</div>
          <div className="text-gray-600 text-sm">On Leave</div>
        </div>
      </div>

      <div className="bg-white rounded-lg overflow-hidden shadow">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Employee ID</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Date</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Hours Worked</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((rec, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3">{rec.employeeId}</td>
                <td className="px-6 py-3">{new Date(rec.date).toLocaleDateString()}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    rec.status === 'present' ? 'bg-green-100 text-green-800' :
                    rec.status === 'absent' ? 'bg-red-100 text-red-800' :
                    rec.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {rec.status}
                  </span>
                </td>
                <td className="px-6 py-3">{calculateHoursWorked(rec.clockInTime, rec.clockOutTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
