import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData] = useState([
    { id: 1, name: 'John Doe', checkIn: '09:05', checkOut: '18:30', status: 'Present' },
    { id: 2, name: 'Jane Smith', checkIn: '09:00', checkOut: '17:45', status: 'Present' },
    { id: 3, name: 'Mike Johnson', checkIn: '-', checkOut: '-', status: 'Absent' },
  ]);

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
              <div className="text-2xl font-bold text-gray-900">85</div>
              <div className="text-sm text-gray-600">Present Today</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg"><Clock className="text-red-600" size={28} /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">5</div>
              <div className="text-sm text-gray-600">Absent Today</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg"><Calendar className="text-yellow-600" size={28} /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">10</div>
              <div className="text-sm text-gray-600">Late Today</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <input 
            type="date" 
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-6 font-medium text-gray-700">Employee</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Check In</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Check Out</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.map(record => (
              <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-gray-900">{record.name}</td>
                <td className="py-4 px-6 text-gray-600">{record.checkIn}</td>
                <td className="py-4 px-6 text-gray-600">{record.checkOut}</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${record.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
