import React, { useState, useEffect, useContext } from 'react';
import { DollarSign, Users, TrendingUp, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState as useLocalState } from 'react';
import ConfirmModal from '../ui/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';

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

  const handleMarkPaid = async (employeeId) => {
    try {
      // attempt to mark payroll as paid for an employee
      await axiosInstance.post('/payroll/approve', { employeeId });
      // refetch payroll list if there's an endpoint
      const res = await axiosInstance.get('/payroll');
      setPayroll(res.data.payroll || []);
    } catch (err) {
      alert(err?.response?.data?.message || 'Error marking as paid');
    }
  };

  const handleDeletePayroll = async (employeeId) => {
    setConfirm({ open: true, id: employeeId, action: 'deletePayroll' });
  };

  const handleEditPayroll = (employee) => {
    // Navigate to employees page with edit query param (EmployeesPage handles edit if present)
    try {
      navigate(`/employees?editId=${employee._id || employee.id}`);
    } catch (err) {
      console.error('Navigation error', err);
    }
  };

  // confirm modal state
  const [confirm, setConfirm] = useLocalState({ open: false, id: null, action: null });
  const navigate = useNavigate();
  const showToast = useToast();

  const runConfirm = async () => {
    if (confirm.action === 'deletePayroll') {
      try {
        await axiosInstance.delete(`/payroll/${confirm.id}`);
        const res = await axiosInstance.get('/payroll');
        setPayroll(res.data.payroll || []);
        showToast('success', 'Payroll entry deleted');
      } catch (err) {
        showToast('error', err?.response?.data?.message || 'Error deleting payroll entry');
      }
    }
    setConfirm({ open: false, id: null, action: null });
  };

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
              <div className="text-2xl font-bold text-gray-900">₦{totalEmployees ? Math.round(totalSalaries / totalEmployees).toLocaleString() : '0'}</div>
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
              <th className="text-center py-3 px-6 font-medium text-gray-700">Action</th>
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
                <td className="py-4 px-6 flex justify-center gap-2">
                  {emp.status !== 'Paid' && (
                    <button onClick={() => handleMarkPaid(emp._id || emp.id)} className="p-2 hover:bg-green-100 rounded-lg text-green-600" title="Mark Paid"><CheckCircle size={18} /></button>
                  )}
                  <button onClick={() => handleEditPayroll(emp)} className="p-2 hover:bg-blue-100 rounded-lg text-blue-600" title="Edit"><Edit size={18} /></button>
                  <button onClick={() => handleDeletePayroll(emp._id || emp.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-600" title="Delete"><Trash2 size={18} /></button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" className="py-8 px-6 text-center text-gray-500">No payroll records</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ConfirmModal isOpen={confirm.open} title="Delete Payroll Entry" message="Are you sure you want to delete this payroll entry?" onConfirm={runConfirm} onCancel={() => setConfirm({ open: false, id: null, action: null })} />
    </div>
  );
}
