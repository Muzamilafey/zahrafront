import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const PrivateRoute = ({ children, roles = [] }) => {
  const { user, loading } = useContext(AuthContext);

  // Wait for AuthContext to finish loading (important!)
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg font-medium text-brand-700">
        Loading...
      </div>
    );
  }

  // Redirect to login if not logged in
  if (!user) return <Navigate to="/login" replace />;

  // Role check (optional)
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  // Everything okay, render children
  return children;
};

export default PrivateRoute;
