import React, { useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { AlertIcon, SuccessIcon, SpinnerIcon } from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { InputField } from '../components/InputField';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useContext(AuthContext);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  
  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
        setError('Invalid reset link. No token provided.');
        return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await resetPassword(token, password);
      setMessage('Your password has been reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };
  
  const alertVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  return (
    <AnimatedPage>
      <AuthLayout
        title="Reset Your Password"
        description="Enter and confirm your new password below."
      >
        <form onSubmit={submit} className="space-y-6">
          <AnimatePresence>
            {message && (
                <motion.div variants={alertVariants} initial="hidden" animate="visible" exit="exit" className="rounded-md bg-green-50 p-4">
                    <div className="flex">
                    <div className="flex-shrink-0">
                        <SuccessIcon className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">{message}</p>
                    </div>
                    </div>
                </motion.div>
            )}
            {error && (
                <motion.div variants={alertVariants} initial="hidden" animate="visible" exit="exit" className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertIcon className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
          {!message && (
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <InputField
                id="password"
                type="password"
                label="New Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <InputField
                id="confirm-password"
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              
              <div>
                <motion.button
                  type="submit"
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading && <SpinnerIcon className="h-5 w-5 mr-2" />}
                  {loading ? 'Resetting...' : 'Reset Password'}
                </motion.button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
          <div className="text-center text-sm text-gray-600">
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500 transition-colors duration-200">
              Back to Sign in
            </Link>
          </div>
        </form>
      </AuthLayout>
    </AnimatedPage>
  );
}