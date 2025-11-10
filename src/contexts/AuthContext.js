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

  // Server-Sent Events: subscribe to permission/role updates so changes made by admin
  // are reflected immediately in the client's UI without a full reload.
  useEffect(() => {
    if (!accessToken) return;

    // EventSource can't send Authorization headers, so we pass token as a query param.
    const streamUrl = `${API_BASE}/notifications/stream?token=${accessToken}`;
    let es;
    try {
      es = new EventSource(streamUrl);
    } catch (err) {
      console.warn('Failed to create EventSource for notifications', err);
      return;
    }

    const onPermissions = (e) => {
      try {
        const payload = JSON.parse(e.data || '{}');
        if (payload && payload.permissions) {
          setUser((u) => {
            const next = { ...(u || {}), permissions: payload.permissions };
            localStorage.setItem('user', JSON.stringify(next));
            return next;
          });
        }
      } catch (err) {
        console.warn('Invalid permissions event received', err);
      }
    };

    const onRoleChanged = (e) => {
      try {
        const payload = JSON.parse(e.data || '{}');
        if (payload && payload.role) {
          setUser((u) => {
            const next = { ...(u || {}), role: payload.role };
            localStorage.setItem('user', JSON.stringify(next));
            return next;
          });
        }
      } catch (err) {
        console.warn('Invalid roleChanged event received', err);
      }
    };

    es.addEventListener('permissionsUpdated', onPermissions);
    es.addEventListener('roleChanged', onRoleChanged);
    es.onerror = (err) => {
      // keep console noise minimal; EventSource will try to reconnect automatically
      console.warn('SSE connection error for notifications', err);
    };

    return () => {
      try { es.close(); } catch (e) {}
    };
  }, [accessToken]);

  // 🔐 Axios instance with token and sensible timeout to avoid hanging requests
  const axiosInstance = axios.create({ baseURL: API_BASE, timeout: 15000 });
  axiosInstance.interceptors.request.use(
    (config) => {
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 🧠 Login
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password }, { timeout: 15000 });
      const token = res.data.accessToken;

      if (!token) throw new Error('No access token returned from server');

      setAccessToken(token);

      try {
        // fetch full user profile (includes permissions) using axiosInstance which will attach the token
        const profile = await axiosInstance.get('/users/me');
        if (profile && profile.data && profile.data.user) {
          setUser(profile.data.user);
        } else {
          // fallback to parsing token payload if profile not returned
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({ _id: payload.id || payload._id || payload.sub, role: payload.role });
        }
      } catch (e) {
        // If fetching profile fails, fall back to token payload
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({ _id: payload.id || payload._id || payload.sub, role: payload.role });
        } catch (errPayload) {
          console.warn('Failed to parse access token payload', errPayload);
          setUser(null);
          throw new Error('Invalid access token received');
        }
      }
    } catch (err) {
      // Normalize common network errors for UI
      if (err.code === 'ECONNABORTED') {
        throw new Error('Login request timed out. Check your network or try again.');
      }
      if (err.response && err.response.data && err.response.data.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error(err.message || 'Login failed');
    }
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
