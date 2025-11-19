import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { AlertIcon, SpinnerIcon } from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import { InputField } from '../components/InputField';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <AuthLayout
        title="Welcome Back"
        description="Sign in to continue to your dashboard."
      >
        <form onSubmit={submit} className="space-y-6">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                className="rounded-md bg-red-50 p-4"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertIcon className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Login Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                    <button
                        type="button"
                        className="mt-2 text-sm font-medium text-red-800 hover:text-red-700"
                        onClick={() => setError(null)}
                      >
                        Dismiss
                      </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <InputField
            id="email"
            type="email"
            label="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <InputField
            id="password"
            type="password"
            label="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          
          <div className="flex items-center justify-end">
              <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-brand-600 hover:text-brand-500 transition-colors duration-200">
                      Forgot your password?
                  </Link>
              </div>
          </div>

          <div>
            <motion.button
              type="submit"
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading && <SpinnerIcon className="h-5 w-5 mr-2" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </motion.button>
          </div>

          <div className="text-center text-sm text-gray-600">
            Not a member?{' '}
            <Link to="/register" className="font-medium text-brand-600 hover:text-brand-500 transition-colors duration-200">
              Create an account
            </Link>
          </div>
        </form>
      </AuthLayout>
    </AnimatedPage>
  );
}