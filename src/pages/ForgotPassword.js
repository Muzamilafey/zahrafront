import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://zahra-7bi2.onrender.com/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await axios.post(`${API_BASE}/auth/forgot-password`, { email });
      setMessage(res.data.message || 'Password reset email sent');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center page-hero">
      <div className="w-full max-w-md p-6">
        <form onSubmit={submit} className="card">
          <h2 className="text-2xl mb-4 font-bold text-center text-brand-700">Forgot Password</h2>
          {message && <p className="text-green-600 mb-4">{message}</p>}
          {error && <p className="text-red-600 mb-4">{error}</p>}
          <input
            type="email"
            placeholder="Your email"
            className="input mb-4"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn-brand w-full" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</button>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-brand-600 hover:underline">Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}