import React from 'react';

const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center">
      <div className={`text-3xl ${color} mr-4`}>{icon}</div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
        <p className="text-gray-800 dark:text-gray-200 text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;