import React from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = React.useContext(AuthContext);

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-md p-4 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
          <Link to="/dashboard" className="text-2xl font-extrabold text-brand-700 shimmer">GENZ</Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/profile" className="text-sm text-gray-700 hover:text-brand-600">Profile</Link>
              <button onClick={logout} className="text-sm btn-brand">Signoutbutton>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-700 hover:text-brand-600">Login</Link>
              <Link to="/register" className="text-sm btn-brand">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}