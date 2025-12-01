import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Clock, Users, DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { Link } from 'react-router-dom';

export default function HRDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/employees/dashboard');
        setDashboard(res.data);

        // Fetch recent employees
        const empRes = await axiosInstance.get('/employees?limit=10');
        setEmployees(empRes.data.employees || []);

        setError(null);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to fetch HR dashboard');
        console.error('HR Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegistering(true);
    setMessage('');
    try {
      const payload = { ...form };
      if (payload.salary) payload.salary = Number(payload.salary);
      await axiosInstance.post('/employees/register', payload);
      setMessage('Employee registered');
      setForm({ name: '', email: '', phone: '', position: '', department: '', salary: '', employeeId: '', gender: '', employmentType: 'full-time', startDate: '' });
      // refresh summary
      const res = await axiosInstance.get('/employees/dashboard');
      setSummary(res.data);
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Registration failed');
    } finally { setRegistering(false); }
  };

  if (loading) return <div className="p-6">Loading HR dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">HR Dashboard</h1>

      {/* 1. Employee Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow">Total Employees<br/><span className="text-2xl font-bold">{summary.total}</span></div>
        <div className="bg-white p-4 rounded shadow">New hires this month<br/><span className="text-2xl font-bold">{summary.newHiresThisMonth}</span></div>
        <div className="bg-white p-4 rounded shadow">Exits this month<br/><span className="text-2xl font-bold">{summary.exitsThisMonth}</span></div>
        <div className="bg-white p-4 rounded shadow">Active / Inactive<br/><span className="text-2xl font-bold">{summary.active} / {summary.inactive}</span></div>
      </div>

      {/* Simple visuals for distribution */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">By Department</h3>
          <ul className="text-sm mt-2">
            {(summary.byDepartment||[]).map(d => (
              <li key={d._id}>{d._id || 'Unspecified'} — {d.count}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Gender</h3>
          <ul className="text-sm mt-2">
            {(summary.byGender||[]).map(g => (
              <li key={g._id}>{g._id || 'Unspecified'} — {g.count}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Employment Types</h3>
          <ul className="text-sm mt-2">
            {(summary.byEmploymentType||[]).map(t => (
              <li key={t._id}>{t._id || 'Unspecified'} — {t.count}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Registration form for HR */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Register Employee</h2>
        <form onSubmit={handleRegister} className="grid grid-cols-2 gap-4">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Full name" className="input" required />
          <input name="employeeId" value={form.employeeId} onChange={handleChange} placeholder="Employee ID (optional)" className="input" />
          <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="input" />
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="input" />
          <input name="position" value={form.position} onChange={handleChange} placeholder="Position" className="input" />
          <input name="department" value={form.department} onChange={handleChange} placeholder="Department" className="input" />
          <input name="salary" value={form.salary} onChange={handleChange} placeholder="Salary" className="input" type="number" />
+          <select name="gender" value={form.gender} onChange={handleChange} className="input">
+            <option value="">Gender (optional)</option>
+            <option value="male">Male</option>
+            <option value="female">Female</option>
+            <option value="other">Other</option>
+          </select>
+          <select name="employmentType" value={form.employmentType} onChange={handleChange} className="input">
+            <option value="full-time">Full-time</option>
+            <option value="part-time">Part-time</option>
+            <option value="contract">Contract</option>
+            <option value="temp">Temp</option>
+          </select>
+          <input name="startDate" value={form.startDate} onChange={handleChange} placeholder="Start date" className="input" type="date" />
          <div className="col-span-2">
            <button className="btn-brand" type="submit" disabled={registering}>{registering ? 'Registering...' : 'Register Employee'}</button>
            {message && <div className="mt-2 text-sm">{message}</div>}
          </div>
        </form>
      </div>

      {/* Placeholder sections for other HR features (attendance, recruitment etc.) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Attendance</h3>
          <p className="text-sm mt-2">Realtime attendance and timesheets integration placeholder. Connect with attendance service to populate.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Recruitment & Onboarding</h3>
          <p className="text-sm mt-2">Open jobs and onboarding tasks will surface here once recruitment module is connected.</p>
        </div>
      </div>

    </div>
  );
}
