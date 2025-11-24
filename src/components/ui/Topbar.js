import React, { useContext, useEffect, useState } from 'react';
import { FaBell, FaUserCircle, FaCalendarPlus } from 'react-icons/fa';
import CreateAppointmentModal from './CreateAppointmentModal';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';

export default function Topbar({ user, onLogout }) {
  const navigate = useNavigate();
  const { axiosInstance } = useContext(AuthContext);
  const [count, setCount] = useState(0);
  const notifCtx = useNotifications();

  useEffect(()=>{
    if (notifCtx) {
      setCount(notifCtx.unreadCount || 0);
      return; // prefer local context
    }
    let mounted = true;
    const load = async ()=>{
      if(!axiosInstance) return;
      try{
        const res = await axiosInstance.get('/notifications/recent');
        if(!mounted) return;
        setCount((res.data.notifications || []).length);
      }catch(e){ /* ignore */ }
    };
    load();
    return ()=>{ mounted = false; };
  },[axiosInstance, notifCtx]);

  useEffect(()=>{
    let mounted = true;
    const load = async ()=>{
      if(!axiosInstance) return;
      try{
        const res = await axiosInstance.get('/notifications/recent');
        if(!mounted) return;
        setCount((res.data.notifications || []).length);
      }catch(e){ /* ignore */ }
    };
    load();
    return ()=>{ mounted = false; };
  },[axiosInstance]);

  const openNotifications = ()=>{
    if(user?.role === 'admin') navigate('/dashboard/admin/notifications');
    else navigate('/profile');
  };

  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const showCreateForRoles = ['admin', 'doctor', 'nurse'];
  const imagePath = '/assets/create-appointment.png';

  return (
    <div className="w-full bg-white/80 backdrop-blur py-3 px-4 flex items-center justify-between border-b sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-brand-700">CoreCare</h2>
      </div>

      <div className="flex items-center gap-3">
        {showCreateForRoles.includes(user?.role) && (
          <>
            <button
              onClick={() => setShowCreateModal(true)}
              title="Create Appointment"
              className="btn-outline mr-2 hidden sm:inline-flex items-center gap-2"
            >
              <FaCalendarPlus />
              <span className="text-sm">Create Appointment</span>
            </button>
            <CreateAppointmentModal open={showCreateModal} onClose={() => setShowCreateModal(false)} imageSrc={imagePath} />
          </>
        )}
        <button onClick={openNotifications} className="relative p-2 rounded hover:bg-gray-100">
          <FaBell className="text-gray-700" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full px-1">{count}</span>
          )}
        </button>

        <div className="flex items-center gap-2">
          <FaUserCircle className="text-2xl text-brand-700" />
          <div className="text-sm">
            <div className="font-medium">{user?.name || 'Guest'}</div>
            <div className="text-xs text-gray-500">{user?.role || 'visitor'}</div>
          </div>
        </div>

        <button onClick={onLogout} className="btn-brand ml-4">Logout</button>
      </div>
    </div>
  );
}
