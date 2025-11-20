import React from 'react';
import { CoreCareLogo } from './Icons';

export const AuthLayout = ({ title, description, children }) => {
  return (
    <div className="min-h-screen bg-brand-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md transition-transform duration-500 ease-out">
        <CoreCareLogo className="mx-auto h-16 w-auto" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-900">CoreCare HMIS</h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md transition-opacity duration-500 delay-100">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <div className="mb-6 text-center">
             <h3 className="text-xl font-bold text-brand-800">{title}</h3>
             <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
