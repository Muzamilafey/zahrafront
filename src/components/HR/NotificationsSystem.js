import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { FaBell, FaCheck, FaTrash } from 'react-icons/fa';

export default function NotificationsSystem() {
  const { axiosInstance } = useContext(AuthContext);
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get('/api/notifications');
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error('Failed to load notifications');
    }
  };

  const markAsRead = async (id) => {
    try {
      await axiosInstance.put(`/api/notifications/${id}`, { read: true });
      showToast('Marked as read', 'success');
      fetchNotifications();
    } catch (err) {
      showToast('Failed to update notification', 'error');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axiosInstance.delete(`/api/notifications/${id}`);
      showToast('Notification deleted', 'success');
      fetchNotifications();
    } catch (err) {
      showToast('Failed to delete notification', 'error');
    }
  };

  const getNotificationColor = (type) => {
    const colors = {
      'leave-request': 'bg-blue-50 border-blue-200 text-blue-800',
      'contract-expiry': 'bg-red-50 border-red-200 text-red-800',
      'document-expiry': 'bg-orange-50 border-orange-200 text-orange-800',
      'payroll-reminder': 'bg-green-50 border-green-200 text-green-800',
      'training-reminder': 'bg-purple-50 border-purple-200 text-purple-800',
      'recruitment-update': 'bg-indigo-50 border-indigo-200 text-indigo-800',
      'disciplinary-alert': 'bg-red-50 border-red-200 text-red-800',
      'performance-review': 'bg-yellow-50 border-yellow-200 text-yellow-800'
    };
    return colors[type] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'leave-request': '📅',
      'contract-expiry': '⚠️',
      'document-expiry': '📄',
      'payroll-reminder': '💰',
      'training-reminder': '📚',
      'recruitment-update': '👥',
      'disciplinary-alert': '⚡',
      'performance-review': '⭐'
    };
    return icons[type] || '🔔';
  };

  const filteredNotifications = filterType === 'all' ? notifications : notifications.filter(n => n.type === filterType);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FaBell /> Notifications & Alerts
          </h1>
          <p className="text-gray-600 text-sm mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg font-medium ${filterType === 'all' ? 'bg-brand-600 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}
        >
          All Notifications
        </button>
        <button
          onClick={() => setFilterType('leave-request')}
          className={`px-4 py-2 rounded-lg font-medium ${filterType === 'leave-request' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}
        >
          Leave Requests
        </button>
        <button
          onClick={() => setFilterType('contract-expiry')}
          className={`px-4 py-2 rounded-lg font-medium ${filterType === 'contract-expiry' ? 'bg-red-600 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}
        >
          Contract Expiry
        </button>
        <button
          onClick={() => setFilterType('payroll-reminder')}
          className={`px-4 py-2 rounded-lg font-medium ${filterType === 'payroll-reminder' ? 'bg-green-600 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}
        >
          Payroll
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              className={`border-l-4 p-4 rounded-lg flex justify-between items-start ${getNotificationColor(notif.type)} ${!notif.read ? 'border-2 border-l-4 shadow' : 'opacity-75'}`}
            >
              <div className="flex items-start gap-4 flex-1">
                <span className="text-2xl">{getNotificationIcon(notif.type)}</span>
                <div className="flex-1">
                  <h3 className="font-bold mb-1">{notif.title}</h3>
                  <p className="text-sm mb-2">{notif.message}</p>
                  <div className="flex items-center gap-2 text-xs">
                    {notif.relatedEmployee && <span className="bg-white bg-opacity-50 px-2 py-1 rounded">Employee: {notif.relatedEmployee}</span>}
                    <span className="bg-white bg-opacity-50 px-2 py-1 rounded">{new Date(notif.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                {!notif.read && (
                  <button
                    onClick={() => markAsRead(notif._id)}
                    className="text-white bg-brand-600 p-2 rounded hover:bg-brand-700 transition"
                    title="Mark as read"
                  >
                    <FaCheck size={14} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notif._id)}
                  className="text-red-600 bg-red-50 p-2 rounded hover:bg-red-100 transition"
                  title="Delete notification"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-lg text-center">
            <FaBell className="text-4xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No notifications</p>
          </div>
        )}
      </div>

      {/* Sample Alert Categories */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Pending Approvals</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-blue-50 rounded">
              <span>Leave Requests Awaiting Approval</span>
              <span className="font-bold bg-blue-600 text-white px-2 py-1 rounded-full text-xs">3</span>
            </div>
            <div className="flex justify-between p-2 bg-indigo-50 rounded">
              <span>Recruitment Applications to Review</span>
              <span className="font-bold bg-indigo-600 text-white px-2 py-1 rounded-full text-xs">5</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Upcoming Expirations</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-orange-50 rounded">
              <span>Documents Expiring in 30 Days</span>
              <span className="font-bold bg-orange-600 text-white px-2 py-1 rounded-full text-xs">4</span>
            </div>
            <div className="flex justify-between p-2 bg-red-50 rounded">
              <span>Contracts Expiring Soon</span>
              <span className="font-bold bg-red-600 text-white px-2 py-1 rounded-full text-xs">2</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">System Reminders</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-green-50 rounded">
              <span>Payroll Processing Due</span>
              <span className="font-bold bg-green-600 text-white px-2 py-1 rounded-full text-xs">1</span>
            </div>
            <div className="flex justify-between p-2 bg-purple-50 rounded">
              <span>Training Sessions Starting</span>
              <span className="font-bold bg-purple-600 text-white px-2 py-1 rounded-full text-xs">2</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Critical Alerts</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-red-50 rounded">
              <span>Disciplinary Cases Pending</span>
              <span className="font-bold bg-red-600 text-white px-2 py-1 rounded-full text-xs">1</span>
            </div>
            <div className="flex justify-between p-2 bg-yellow-50 rounded">
              <span>Performance Reviews Overdue</span>
              <span className="font-bold bg-yellow-600 text-white px-2 py-1 rounded-full text-xs">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
