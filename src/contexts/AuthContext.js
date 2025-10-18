import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API_BASE = process.env.REACT_APP_API_BASE || 'https://zahra-7bi2.onrender.com/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token and user from localStorage when app starts
  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        setAccessToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
    }

    setLoading(false);
  }, []);

  // Keep storage updated
  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    else localStorage.removeItem('accessToken');
  }, [accessToken]);

  // Axios setup
  const axiosInstance = axios.create({ baseURL: API_BASE });
  axiosInstance.interceptors.request.use(
    config => {
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    },
    error => Promise.reject(error)
  );

  // Login
  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
    const token = res.data.accessToken;
    const payload = JSON.parse(atob(token.split('.')[1]));

    const newUser = { _id: payload.id, role: payload.role };
    setUser(newUser);
    setAccessToken(token);

    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('accessToken', token);
  };

  // Logout
  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, axiosInstance, accessToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
