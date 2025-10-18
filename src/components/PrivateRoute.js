import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const PrivateRoute = ({ children, roles = [] }) => {
  const { user, loading } = useContext(AuthContext);

  // Wait for AuthContext to finish loading from localStorage
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg font-medium text-brand-700">
        Loading...
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // If user exists but not allowed role, redirect to dashboard
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  // If everything is fine, render protected content
  return children;
};

export default PrivateRoute;
