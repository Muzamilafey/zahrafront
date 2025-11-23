import React, { createContext, useState, useEffect, useMemo } from 'react';
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
        console.debug('SSE permissionsUpdated received', payload);
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
        console.debug('SSE roleChanged received', payload);
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

    const onPharmacyNewRequest = (e) => {
      try {
        const payload = JSON.parse(e.data || '{}');
        // dispatch a window event so UI can react (e.g., refresh pending list)
        try { window.dispatchEvent(new CustomEvent('pharmacy:new-internal-request', { detail: payload })); } catch (err) { /* ignore */ }
      } catch (err) {
        console.warn('Invalid pharmacy:new-internal-request payload', err);
      }
    };

    es.addEventListener('permissionsUpdated', onPermissions);
    es.addEventListener('roleChanged', onRoleChanged);
    es.addEventListener('pharmacy:new-internal-request', onPharmacyNewRequest);
    es.onerror = (err) => {
      // keep console noise minimal; EventSource will try to reconnect automatically
      console.warn('SSE connection error for notifications', err);
    };

    return () => {
      try { es.close(); } catch (e) {}
    };
  }, [accessToken]);

  // 🔐 Axios instance with token - memoized to prevent recreation on every render
  const axiosInstance = useMemo(() => {
    const instance = axios.create({ baseURL: API_BASE, timeout: 50000 });
    instance.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
          console.log(`[AuthContext] Attached token to ${config.method?.toUpperCase()} ${config.url}`);
        } else {
          console.warn(`[AuthContext] No token available for ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle 401 errors
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          console.warn(`[AuthContext] ${status} on ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
          // If the server responded with 401/403 treat it as invalid/expired token.
          // Perform a local logout and redirect to login page.
          try {
            // clear client state (avoid calling logout here because it's defined later)
            setUser(null);
            setAccessToken(null);
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
          } catch (e) {
            console.warn('Failed to clear auth state during interceptor', e);
          }

          // Avoid redirecting when user is already on login page or when the failing
          // request itself is login/refresh endpoints to prevent loops.
          const url = (error.config && error.config.url) ? String(error.config.url) : '';
          const lower = url.toLowerCase();
          if (!lower.includes('/auth/login') && !lower.includes('/auth/refresh')) {
            // Use replace so browser back doesn't return to protected page
            try { window.location.replace('/login'); } catch (e) { window.location.href = '/login'; }
          }
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [accessToken]);

  // 🧠 Login
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password }, { timeout: 50000 });
      const token = res.data.accessToken;

      if (!token) throw new Error('No access token returned from server');

      setAccessToken(token);

      try {
        // Create a temporary axios instance with the token for this request
        // This is necessary because the memoized axiosInstance won't have the token yet
        const tempAxios = axios.create({ baseURL: API_BASE, timeout: 30000 });
        tempAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('[Login] Fetching user profile with token');
        const profile = await tempAxios.get('/users/me');
        if (profile && profile.data && profile.data.user) {
          setUser(profile.data.user);
        } else {
          // fallback to parsing token payload if profile not returned
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({ _id: payload.id || payload._id || payload.sub, role: payload.role });
        }
      } catch (e) {
        console.error('[Login] Failed to fetch profile, using token payload fallback:', e.message);
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

  const requestPasswordReset = async (email) => {
    try {
      await axios.post(`${API_BASE}/auth/request-password-reset`, { email });
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error(err.message || 'Failed to request password reset');
    }
  };

  const resetPassword = async (token, password) => {
    try {
      await axios.post(`${API_BASE}/auth/reset-password`, { token, password });
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error(err.message || 'Failed to reset password');
    }
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
        requestPasswordReset,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
