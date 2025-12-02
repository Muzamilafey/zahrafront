import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Clock, CheckCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';

export default function AttendancePage() {
  const { axiosInstance } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0 });
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [checkInData, setCheckInData] = useState({ checkIn: '', checkOut: '' });

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  useEffect(() => {
    fetchEmployeesList();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/attendance?date=${selectedDate}`);
      const data = res.data.attendance || [];
      setAttendanceData(data);
      
      const present = data.filter(a => a.status === 'Present').length;
      const absent = data.filter(a => a.status === 'Absent').length;
      const late = data.filter(a => a.status === 'Late').length;
      setStats({ present, absent, late });
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setAttendanceData([]);
      setStats({ present: 0, absent: 0, late: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedEmployee || !checkInData.checkIn) return;
    try {
      await axiosInstance.post('/attendance', {
        employeeId: selectedEmployee,
        date: selectedDate,
        checkIn: checkInData.checkIn,
        checkOut: checkInData.checkOut,
      });
      setShowCheckIn(false);
      setCheckInData({ checkIn: '', checkOut: '' });
      fetchAttendance();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error recording attendance');
    }
  };

  const fetchEmployeesList = async () => {
    try {
      const res = await axiosInstance.get('/employees?limit=1000');
      setEmployeesList(res.data.employees || []);
    } catch (err) {
      console.error('Error fetching employees list:', err);
      setEmployeesList([]);
    }
  };

  const handleDeleteAttendance = async (id) => {
    if (window.confirm('Delete this attendance record?')) {
      try {
        await axiosInstance.delete(`/attendance/${id}`);
        fetchAttendance();
      } catch (err) {
        alert(err?.response?.data?.message || 'Error deleting record');
      }
    }
  };

  const handleEditAttendance = (record) => {
    setSelectedEmployee(record.employeeId);
    setCheckInData({ checkIn: record.checkIn || '', checkOut: record.checkOut || '' });
    setShowCheckIn(true);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg"><CheckCircle className="text-green-600" size={28} /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.present}</div>
              <div className="text-sm text-gray-600">Present Today</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg"><Clock className="text-red-600" size={28} /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.absent}</div>
              <div className="text-sm text-gray-600">Absent Today</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg"><Calendar className="text-yellow-600" size={28} /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.late}</div>
              <div className="text-sm text-gray-600">Late Today</div>
            </div>
          </div>
        </div>
      </div>

      {showCheckIn && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Record Attendance</h3>
          <div className="grid grid-cols-3 gap-4">
            <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2">
              <option value="">Select Employee</option>
              {employeesList.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name}</option>
              ))}
            </select>
            <input type="time" value={checkInData.checkIn} onChange={e => setCheckInData({...checkInData, checkIn: e.target.value})} placeholder="Check In" className="border border-gray-300 rounded-lg px-4 py-2" />
            <input type="time" value={checkInData.checkOut} onChange={e => setCheckInData({...checkInData, checkOut: e.target.value})} placeholder="Check Out" className="border border-gray-300 rounded-lg px-4 py-2" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleCheckIn} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Attendance</button>
            <button onClick={() => setShowCheckIn(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <input 
              type="date" 
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button onClick={() => setShowCheckIn(!showCheckIn)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={20} /> Record Attendance
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-6 font-medium text-gray-700">Employee</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Check In</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Check Out</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
              <th className="text-center py-3 px-6 font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.length > 0 ? attendanceData.map(record => (
              <tr key={record._id || record.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-gray-900">{record.name}</td>
                <td className="py-4 px-6 text-gray-600">{record.checkIn || '-'}</td>
                <td className="py-4 px-6 text-gray-600">{record.checkOut || '-'}</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    record.status === 'Present' ? 'bg-green-100 text-green-800' : 
                    record.status === 'Late' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="py-4 px-6 flex justify-center gap-2">
                  <button onClick={() => handleEditAttendance(record)} className="p-2 hover:bg-blue-100 rounded-lg text-blue-600" title="Edit"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteAttendance(record._id || record.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-600" title="Delete"><Trash2 size={18} /></button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="py-8 px-6 text-center text-gray-500">No attendance records</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
