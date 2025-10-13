import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io as socketIOClient } from 'socket.io-client';

export const AuthContext = createContext();

const API_BASE = process.env.REACT_APP_API_BASE || 'https://zahra-7bi2.onrender.com/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://zahra-7bi2.onrender.com';

export const AuthProvider = ({ children }) => {
  // Persisted state from localStorage
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);

  // Keep localStorage in sync
  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    else localStorage.removeItem('accessToken');
  }, [accessToken]);

  // Socket.io client
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    if (!accessToken) return;

    const s = socketIOClient(SOCKET_URL, { auth: { token: accessToken } });
    setSocket(s);
    s.on('connect', () => console.log('Socket connected:', s.id));
    return () => s.disconnect();
  }, [accessToken]);

  // Axios instance
  const axiosInstance = axios.create({ baseURL: API_BASE });

  axiosInstance.interceptors.request.use(config => {
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  });

  // Instead of logging out automatically, just pass the 401 error
  axiosInstance.interceptors.response.use(
    response => response,
    error => {
      // Optional: handle 401 here if you want to show a message, but do not logout
      if (error.response?.status === 401) {
        console.warn('Unauthorized request:', error.config.url);
      }
      return Promise.reject(error);
    }
  );

  // Login function
  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
    const token = res.data.accessToken;
    setAccessToken(token);

    const payload = JSON.parse(atob(token.split('.')[1]));
    setUser({ _id: payload.id, role: payload.role });
  };

  // Manual logout
  const logout = () => {
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, axiosInstance, accessToken, socket }}>
      {children}
    </AuthContext.Provider>
  );
};
