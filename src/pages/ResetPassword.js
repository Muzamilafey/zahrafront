import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    setToken(searchParams.get('token'));
    setEmail(searchParams.get('email'));
  }, [searchParams]);

  const submit = async e => {
    e.preventDefault();
    if (!token) return setError('Invalid or missing token');
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await axios.post(`${API_BASE}/auth/reset-password`, { token, password });
      setMessage(res.data.message || 'Password reset successful');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center page-hero">
      <div className="w-full max-w-md p-6">
        <form onSubmit={submit} className="card">
          <h2 className="text-2xl mb-4 font-bold text-center text-brand-700">Reset Password</h2>
          {message && <p className="text-green-600 mb-4">{message}</p>}
          {error && <p className="text-red-600 mb-4">{error}</p>}

          <input
            type="password"
            placeholder="New password"
            className="input mb-3"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <button type="submit" className="btn-brand w-full" disabled={loading}>{loading ? 'Resetting...' : 'Reset password'}</button>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-brand-600 hover:underline">Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}