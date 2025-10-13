import React, { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io as socketIOClient } from 'socket.io-client';

export const AuthContext = createContext();

const API_BASE = process.env.REACT_APP_API_BASE || 'https://zahra-7bi2.onrender.com/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://zahra-7bi2.onrender.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || null);
  const socketRef = useRef(null);

  // Persist user & tokens in localStorage
  useEffect(() => {
    user ? localStorage.setItem('user', JSON.stringify(user)) : localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    accessToken ? localStorage.setItem('accessToken', accessToken) : localStorage.removeItem('accessToken');
  }, [accessToken]);

  useEffect(() => {
    refreshToken ? localStorage.setItem('refreshToken', refreshToken) : localStorage.removeItem('refreshToken');
  }, [refreshToken]);

  // Initialize or reconnect socket when accessToken changes
  useEffect(() => {
    if (!accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Disconnect old socket if exists
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const s = socketIOClient(SOCKET_URL, { auth: { token: accessToken }, autoConnect: true });
    socketRef.current = s;

    s.on('connect', () => console.log('Socket connected:', s.id));
    s.on('disconnect', () => console.log('Socket disconnected'));

    s.on('auth:expired', async () => {
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh-token`, { refreshToken });
          setAccessToken(res.data.accessToken); // triggers socket reconnect automatically
        } catch (e) {
          console.warn('Socket token refresh failed', e);
        }
      }
    });

    return () => s.disconnect();
  }, [accessToken, refreshToken]);

  // Axios instance with automatic token refresh
  const axiosInstance = axios.create({ baseURL: API_BASE });

  axiosInstance.interceptors.request.use(config => {
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  });

  axiosInstance.interceptors.response.use(
    response => response,
    async error => {
      if (error.response?.status === 401 && refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh-token`, { refreshToken });
          setAccessToken(res.data.accessToken);
          error.config.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return axios(error.config);
        } catch (e) {
          console.warn('Request token refresh failed', e);
        }
      }
      return Promise.reject(error);
    }
  );

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
    setAccessToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);

    const payload = JSON.parse(atob(res.data.accessToken.split('.')[1]));
    setUser({ _id: payload.id, role: payload.role });
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    if (socketRef.current) socketRef.current.disconnect();
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      axiosInstance,
      accessToken,
      refreshToken,
      socket: socketRef.current
    }}>
      {children}
    </AuthContext.Provider>
  );
};
