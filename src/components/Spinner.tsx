
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-full animate-spin border-4 border-solid border-blue-500 border-t-transparent"></div>
      <p className="mt-4 text-lg text-gray-600">Fetching Patient Data...</p>
    </div>
  );
};

export default Spinner;
