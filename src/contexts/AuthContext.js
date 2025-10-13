import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io as socketIOClient } from 'socket.io-client';

export const AuthContext = createContext();

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || null);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    else localStorage.removeItem('accessToken');
  }, [accessToken]);

  // socket.io client
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    try {
      const host = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
      const s = socketIOClient(host, { auth: { token: accessToken } });
      setSocket(s);
      s.on('connect', () => console.log('socket connected', s.id));

      // handle server telling us the token expired during handshake
      s.on('auth:expired', async () => {
        console.log('socket: auth expired, attempting refresh');
        if (refreshToken) {
          try {
            const res = await axios.post(`${API_BASE}/auth/refresh-token`, { refreshToken });
            setAccessToken(res.data.accessToken);
            // socket will reconnect because accessToken changed (effect dependency)
          } catch (e) {
            console.warn('refresh failed after socket auth expired', e);
            logout();
          }
        } else {
          logout();
        }
      });

      return () => { s.disconnect(); };
    } catch (e) { console.warn('socket init failed', e); }
  }, [accessToken]);

  useEffect(() => {
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    else localStorage.removeItem('refreshToken');
  }, [refreshToken]);

  const axiosInstance = axios.create({
    baseURL: API_BASE,
  });

  axiosInstance.interceptors.request.use(
    config => {
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    },
    error => Promise.reject(error)
  );

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
          logout();
          return Promise.reject(e);
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
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, axiosInstance, accessToken, refreshToken, socket }}>
      {children}
    </AuthContext.Provider>
  );
};