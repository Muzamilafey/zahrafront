import React from 'react';
import Sidebar from './ui/Sidebar';
import React, { useState } from 'react';
import Topbar from './ui/Topbar';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { NotificationsProvider, useNotifications } from '../contexts/NotificationsContext';
import Toasts from './ui/Toasts';

export default function Layout({ children }){
  const { user, logout, socket } = React.useContext(AuthContext);
  const role = user?.role || 'patient';
  // Track sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    } catch (e) { return false; }
  });
  // Listen for sidebar collapse changes from Sidebar
  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  // push socket events into Notifications context
  function SocketListener(){
    const { addNotification } = useNotifications();
    React.useEffect(()=>{
      if(!socket) return;
      const onLab = (p) => addNotification({ type: 'info', message: `Lab result ready: #${p.labTestNumber || p.labTestId}`, actionLabel: 'View', actionUrl: `/labs/${p._id || p.labTestId}` });
      const onInv = (p) => addNotification({ type: 'warn', message: `Low stock: ${p.name} (${p.quantity})`, persist: true });
      socket.on('lab:completed', onLab);
      socket.on('inventory:low', onInv);
      return () => { socket.off('lab:completed', onLab); socket.off('inventory:low', onInv); };
    }, [socket, addNotification]);
    return null;
  }

  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-gray-50">
        <Topbar user={user} onLogout={logout} />
        <div className="flex min-h-screen">
    <Sidebar role={role} onCollapse={handleSidebarCollapse} />
          {/* make the right pane a separate scroll container so the sidebar doesn't scroll with content */}
          <div className={`flex-1 overflow-auto transition-all duration-200 md:${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
            <main className="p-6">
              {children}
              <Toasts />
            </main>
          </div>
          <SocketListener />
        </div>
      </div>
    </NotificationsProvider>
  );
}
