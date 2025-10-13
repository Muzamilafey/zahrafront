import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'app_notifications_v1';

export const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications)); } catch (e) {}
  }, [notifications]);

  const addNotification = useCallback((n) => {
    const id = Date.now() + Math.random();
    const notif = {
      id,
      type: n.type || 'info',
      message: n.message || '',
      actionLabel: n.actionLabel || null,
      actionUrl: n.actionUrl || null,
      action: n.action || null,
      createdAt: new Date().toISOString(),
      read: false,
      dismissed: false,
      persist: !!n.persist,
    };
    setNotifications(prev => [notif, ...prev]);

    if (!notif.persist) {
      const duration = typeof n.duration === 'number' ? n.duration : 6000;
      setTimeout(() => removeNotification(id), duration);
    }
    return id;
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(p => p.id === id ? { ...p, read: true } : p));
  }, []);

  const removeNotification = useCallback((id) => {
    // set dismissed so UI can animate
    setNotifications(prev => prev.map(p => p.id === id ? { ...p, dismissed: true } : p));
    // remove after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(p => p.id !== id));
    }, 300);
  }, []);

  const clearAll = useCallback(()=> setNotifications([]), []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, addNotification, removeNotification, markAsRead, clearAll, unreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
