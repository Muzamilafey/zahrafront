import React, { useState, useEffect, useContext } from 'react';
import { DollarSign, Users, TrendingUp } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';

export default function PayrollPage() {
  const { axiosInstance } = useContext(AuthContext);
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState([]);

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        const res = await axiosInstance.get('/employees/dashboard');
        setPayrollData(res.data?.payrollSummary);
      } catch (err) {
        console.error('Error fetching payroll:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayroll();
  }, []);

  const totalSalaries = payroll.reduce((sum, p) => sum + p.netSalary, 0);
  const totalEmployees = payroll.length;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Payroll Management</h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg"><DollarSign className="text-green-600" size={28} /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">₦{totalSalaries.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Payroll</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg"><Users className="text-blue-600" size={28} /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalEmployees}</div>
              <div className="text-sm text-gray-600">Total Employees</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg"><TrendingUp className="text-purple-600" size={28} /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">₦{Math.round(totalSalaries / totalEmployees).toLocaleString()}</div>
              <div className="text-sm text-gray-600">Average Salary</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Current Payroll</h2>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Process Payroll</button>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-6 font-medium text-gray-700">Employee</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Position</th>
              <th className="text-right py-3 px-6 font-medium text-gray-700">Salary</th>
              <th className="text-right py-3 px-6 font-medium text-gray-700">Bonus/Deductions</th>
              <th className="text-right py-3 px-6 font-medium text-gray-700">Net Salary</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {payroll && payroll.length > 0 ? payroll.map(emp => (
              <tr key={emp._id || emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-gray-900">{emp.name}</td>
                <td className="py-4 px-6 text-gray-600">{emp.position}</td>
                <td className="py-4 px-6 text-right font-medium">₦{(emp.salary || 0).toLocaleString()}</td>
                <td className={`py-4 px-6 text-right font-medium ${(emp.bonusDeductions || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₦{(emp.bonusDeductions || 0).toLocaleString()}
                </td>
                <td className="py-4 px-6 text-right font-bold text-gray-900">₦{(emp.netSalary || 0).toLocaleString()}</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${emp.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {emp.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="py-8 px-6 text-center text-gray-500">No payroll records</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
