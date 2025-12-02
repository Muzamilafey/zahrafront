import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { FaPlus, FaEye } from 'react-icons/fa';

export default function PayrollManagement() {
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useToast();
  const [payrolls, setPayrolls] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    month: new Date().toISOString().slice(0, 7),
    baseSalary: '',
    allowances: { house: '', medical: '', transport: '' },
    deductions: { paye: '', nhif: '', nssf: '', loans: '' },
    overtimeHours: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const res = await axiosInstance.get('/api/payroll');
      setPayrolls(res.data.data || []);
    } catch (err) {
      showToast('Failed to load payroll', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/payroll', formData);
      showToast('Payroll processed', 'success');
      setShowForm(false);
      fetchPayrolls();
    } catch (err) {
      showToast('Failed to process payroll', 'error');
    }
  };

  const calculateTakeHome = (p) => {
    const totalAllowances = Object.values(p.allowances || {}).reduce((a, b) => a + (parseFloat(b) || 0), 0);
    const totalDeductions = Object.values(p.deductions || {}).reduce((a, b) => a + (parseFloat(b) || 0), 0);
    return parseFloat(p.baseSalary || 0) + totalAllowances - totalDeductions;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
          <FaPlus /> Process Payroll
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg mb-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Process Monthly Payroll</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Employee ID" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="month" value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="number" placeholder="Base Salary" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="number" placeholder="House Allowance" value={formData.allowances.house} onChange={e => setFormData({...formData, allowances: {...formData.allowances, house: e.target.value}})} className="border rounded px-3 py-2" />
            <input type="number" placeholder="Medical Allowance" value={formData.allowances.medical} onChange={e => setFormData({...formData, allowances: {...formData.allowances, medical: e.target.value}})} className="border rounded px-3 py-2" />
            <input type="number" placeholder="Transport Allowance" value={formData.allowances.transport} onChange={e => setFormData({...formData, allowances: {...formData.allowances, transport: e.target.value}})} className="border rounded px-3 py-2" />
            <input type="number" placeholder="PAYE" value={formData.deductions.paye} onChange={e => setFormData({...formData, deductions: {...formData.deductions, paye: e.target.value}})} className="border rounded px-3 py-2" />
            <input type="number" placeholder="NHIF" value={formData.deductions.nhif} onChange={e => setFormData({...formData, deductions: {...formData.deductions, nhif: e.target.value}})} className="border rounded px-3 py-2" />
            <input type="number" placeholder="NSSF" value={formData.deductions.nssf} onChange={e => setFormData({...formData, deductions: {...formData.deductions, nssf: e.target.value}})} className="border rounded px-3 py-2" />
            <input type="number" placeholder="Loans Deduction" value={formData.deductions.loans} onChange={e => setFormData({...formData, deductions: {...formData.deductions, loans: e.target.value}})} className="border rounded px-3 py-2" />
            <input type="number" placeholder="Overtime Hours" value={formData.overtimeHours} onChange={e => setFormData({...formData, overtimeHours: e.target.value})} className="border rounded px-3 py-2" />
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="border rounded px-3 py-2">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
            </select>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700">Process Payroll</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-900 px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg overflow-hidden shadow">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Employee ID</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Month</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Base Salary</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Take Home</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map(p => (
              <tr key={p._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3">{p.employeeId}</td>
                <td className="px-6 py-3">{p.month}</td>
                <td className="px-6 py-3">KES {parseFloat(p.baseSalary || 0).toLocaleString()}</td>
                <td className="px-6 py-3 font-bold">KES {calculateTakeHome(p).toLocaleString()}</td>
                <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.status}</span></td>
                <td className="px-6 py-3"><button className="text-blue-600 hover:text-blue-800"><FaEye /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
