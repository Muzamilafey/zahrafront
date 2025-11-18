import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // AuthContext.login now throws normalized Error messages (including timeout)
      setError(err?.message || err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div className="min-h-screen flex items-center justify-center page-hero">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animated-logo {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
      <div className="w-full max-w-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="hidden md:flex flex-col items-center justify-center p-6 rounded-xl floating">
            <img src="/logo3.png" alt="Hospital Logo" className="animated-logo w-32 h-32 mb-6 object-contain" />
            <div className="bg-gradient-to-br from-brand-200 to-brand-50 rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-brand-700 mb-2">Welcome Back</h3>
              <p className="text-gray-600">Sign in to access your Muzamilafey HMIS dashboard and manage appointments, prescriptions and billing.</p>
            </div>
          </div>

          <form onSubmit={submit} className="card">
            <h2 className="text-2xl mb-4 font-bold text-center text-brand-700">Login</h2>
            {error && (
              <div className="mb-4 rounded p-3 bg-red-50 border border-red-200">
                <div className="flex justify-between items-start gap-4">
                  <div className="text-sm text-red-700">{error}</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-sm underline text-red-600"
                      onClick={() => setError(null)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                {/* Additional troubleshooting details removed per request */}
              </div>
            )}
            <input
              type="email"
              placeholder="Email"
              className="input mb-3"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="input mb-4"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn-brand w-full"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <div className="my-4 text-center">or</div>
            

            <div className="mt-4 flex justify-between text-sm">
              <Link to="/forgot-password" className="text-brand-600 hover:underline">Forgot Password?</Link>
              <Link to="/register" className="text-brand-600 hover:underline">Create an account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}