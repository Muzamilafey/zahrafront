import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API_BASE = process.env.REACT_APP_API_BASE || 'https://zahra-7bi2.onrender.com/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ added

  // 🔁 Load user and token from localStorage on startup
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('accessToken');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setAccessToken(savedToken);
    }
    setLoading(false); // ✅ important — marks when done loading
  }, []);

  // 🧩 Keep localStorage synced
  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    else localStorage.removeItem('accessToken');
  }, [accessToken]);

  // 🔐 Axios instance with token
  const axiosInstance = axios.create({ baseURL: API_BASE });
  axiosInstance.interceptors.request.use(
    (config) => {
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 🧠 Login
  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
    const token = res.data.accessToken;

    setAccessToken(token);

    const payload = JSON.parse(atob(token.split('.')[1]));
    setUser({ _id: payload.id, role: payload.role });
  };

  // 🚪 Logout
  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        axiosInstance,
        login,
        logout,
        loading, // ✅ pass this down
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
