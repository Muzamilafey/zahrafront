import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://zahra-7bi2.onrender.com/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Verifying...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    if (!token || !email) {
      setError('Invalid verification link');
      setMessage(null);
      return;
    }

    axios
      .get(`${API_BASE}/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`)
      .then(res => setMessage(res.data.message || 'Email verified'))
      .catch(err => setError(err.response?.data?.message || 'Verification failed'));
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl mb-4 font-bold">Email Verification</h2>
        {message && <p className="text-green-600">{message}</p>}
        {error && <p className="text-red-600">{error}</p>}
        <div className="mt-6">
          <Link to="/login" className="text-blue-600 hover:underline">Go to Login</Link>
        </div>
      </div>
    </div>
  );
}