import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function SetupAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);

  const tokenFromQuery = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('patient');
  const [specialties, setSpecialties] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOnboard = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/auth/google/onboard', { headers: { Authorization: `Bearer ${tokenFromQuery}` } });
        setUser(res.data.user);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load onboarding data');
      } finally { setLoading(false); }
    };
    if (tokenFromQuery) fetchOnboard();
    else setError('No onboarding token provided');
  }, [tokenFromQuery, axiosInstance]);

  const submit = async e => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const body = { role, specialties: specialties ? specialties.split(',').map(s => s.trim()) : [], employeeId, licenseNumber, phone };
      const res = await axiosInstance.post('/auth/google/complete', body, { headers: { Authorization: `Bearer ${tokenFromQuery}` } });
      if (res.data.accessToken) {
        // login complete for patient
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        const payload = JSON.parse(atob(res.data.accessToken.split('.')[1]));
        // naive set user; AuthContext will pick up from localStorage on reload
        window.location.href = '/dashboard';
      } else if (res.data.pendingActivation) {
        // show pending message
        navigate('/login', { state: { message: res.data.message } });
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to complete onboarding');
    } finally { setLoading(false); }
  };

  if (loading && !user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center page-hero">
      <div className="w-full max-w-xl p-6">
        <div className="card">
          <h2 className="text-2xl mb-4 font-bold text-center text-brand-700">Complete your account setup</h2>
          {error && <p className="text-red-600">{error}</p>}
          {user && (
            <div className="mb-4 text-center">
              <img src={user.picture} alt="" className="w-24 h-24 rounded-full mx-auto" />
              <p className="mt-2 font-semibold">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          )}

          <form onSubmit={submit}>
            <label className="block mb-2">Select role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="input mb-4">
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="nurse">Nurse</option>
              <option value="lab_technician">Lab Technician</option>
            </select>

            {role === 'doctor' && (
              <>
                <input placeholder="Specialties (comma separated)" value={specialties} onChange={e => setSpecialties(e.target.value)} className="input mb-3" />
                <input placeholder="License Number" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} className="input mb-3" />
                <input placeholder="Employee ID (optional)" value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="input mb-3" />
              </>
            )}

            {(role === 'nurse' || role === 'lab_technician') && (
              <>
                <input placeholder="License Number" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} className="input mb-3" />
                <input placeholder="Employee ID" value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="input mb-3" />
              </>
            )}

            {role === 'patient' && (
              <>
                <input placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} className="input mb-3" />
              </>
            )}

            <button type="submit" className="btn-brand w-full" disabled={loading}>{loading ? 'Submitting...' : 'Complete setup'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
