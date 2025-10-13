import React from 'react';
import { useNotifications } from '../../contexts/NotificationsContext';

function Icon({type}){
  if(type === 'warn') return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86A2 2 0 0021 17.07V6.93A2 2 0 0019.07 5H4.93A2 2 0 003 6.93v10.14A2 2 0 005.07 19z"/></svg>;
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 6v.01"/></svg>;
}

export default function Toasts(){
  const { notifications, removeNotification, markAsRead } = useNotifications();

  return (
    <div className="fixed bottom-6 right-6 space-y-3 z-60 pointer-events-none">
      {notifications.map(n => (
        <div key={n.id} className={`max-w-sm w-full pointer-events-auto transform transition duration-300 ease-out ${n.dismissed? 'opacity-0 translate-y-4':'opacity-100 translate-y-0'}`}>
          <div className={`flex items-start gap-3 p-3 rounded shadow-lg ${n.type==='warn'?'bg-yellow-600 text-black':'bg-white text-gray-900'}`}>
            <div className="mt-0.5"><Icon type={n.type} /></div>
            <div className="flex-1">
              <div className="text-sm font-medium">{n.message}</div>
              {n.actionLabel && (
                <div className="mt-2">
                  <button onClick={()=>{ markAsRead(n.id); if(n.action) n.action(); else if(n.actionUrl) window.location.href = n.actionUrl; }} className="text-sm underline">{n.actionLabel}</button>
                </div>
              )}
            </div>
            <div className="ml-2 self-start">
              <button onClick={()=> removeNotification(n.id)} className="text-sm text-gray-500">✕</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
