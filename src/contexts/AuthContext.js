import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io as socketIOClient } from 'socket.io-client';

export const AuthContext = createContext();

const API_BASE = process.env.REACT_APP_API_BASE || 'https://zahra-7bi2.onrender.com/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || null);

  // Keep localStorage in sync
  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    else localStorage.removeItem('accessToken');
  }, [accessToken]);

  useEffect(() => {
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    else localStorage.removeItem('refreshToken');
  }, [refreshToken]);

  // Socket
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    if (!accessToken) return;

    const host = process.env.REACT_APP_SOCKET_URL || 'https://zahra-7bi2.onrender.com';
    const s = socketIOClient(host, { auth: { token: accessToken } });

    setSocket(s);
    s.on('connect', () => console.log('Socket connected', s.id));

    s.on('auth:expired', async () => {
      console.log('Socket auth expired, refreshing token...');
      await tryRefreshToken();
      // socket will reconnect with new token
    });

    return () => s.disconnect();
  }, [accessToken]);

  // Axios instance
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
          await tryRefreshToken();
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return axios(error.config);
        } catch {
          logout(); // Only logout if refresh fails
        }
      }
      return Promise.reject(error);
    }
  );

  // Refresh token helper
  const tryRefreshToken = async () => {
    if (!refreshToken) throw new Error('No refresh token');

    try {
      const res = await axios.post(`${API_BASE}/auth/refresh-token`, { refreshToken });
      setAccessToken(res.data.accessToken);

      const payload = JSON.parse(atob(res.data.accessToken.split('.')[1]));
      setUser(prev => ({ ...prev, _id: payload.id, role: payload.role }));
    } catch (err) {
      console.warn('Token refresh failed', err);
      throw err;
    }
  };

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
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, axiosInstance, accessToken, refreshToken, socket }}>
      {children}
    </AuthContext.Provider>
  );
};
