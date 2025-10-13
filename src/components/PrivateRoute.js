import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const PrivateRoute = ({ children, roles = [] }) => {
  const { user } = React.useContext(AuthContext);

  if (!user) return <Navigate to="/login" />;

  if (roles.length && !roles.includes(user.role)) return <Navigate to="/dashboard" />;

  return children;
};

export default PrivateRoute;