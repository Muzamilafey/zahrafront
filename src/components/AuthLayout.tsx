import React from 'react';
import { CoreCareLogo } from './Icons';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, description, children }) => {
  return (
    <div className="min-h-screen bg-brand-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <CoreCareLogo className="mx-auto h-16 w-auto" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-900">
          CoreCare Hospital
        </h2>
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <div className="mb-6 text-center">
             <h3 className="text-xl font-bold text-brand-800">{title}</h3>
             <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  );
};