import React from 'react';
import Sidebar from './ui/Sidebar';
import Topbar from './ui/Topbar';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { NotificationsProvider, useNotifications } from '../contexts/NotificationsContext';
import Toasts from './ui/Toasts';

export default function Layout({ children }){
  const { user, logout, socket } = React.useContext(AuthContext);
  const role = user?.role || 'patient';

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
      <div className="min-h-screen flex bg-gray-50">
          <Sidebar role={role} />
          {/* navigation is handled by Sidebar; removed duplicate link */}
        {/* make the right pane a separate scroll container so the sidebar doesn't scroll with content */}
        <div className="flex-1 min-h-screen overflow-auto">
          <Topbar user={user} onLogout={logout} />
          <main className="p-6">
            {children}
            <Toasts />
          </main>
        </div>
        <SocketListener />
      </div>
    </NotificationsProvider>
  );
}
