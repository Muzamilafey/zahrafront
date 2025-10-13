import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h2 className="text-3xl mb-4 font-bold">404 - Not Found</h2>
        <p className="mb-6">Sorry, the page you're looking for doesn't exist.</p>
        <Link to="/" className="text-blue-600 hover:underline">Go home</Link>
      </div>
    </div>
  );
}