import React, { useState, useEffect, useRef } from 'react';
import { notificationApi } from '../api/notificationApi';
import './NotificationBell.css';

export default function NotificationBell() {
   const [data, setData] = useState({ notifications: [], unreadCount: 0 });
   const [open, setOpen] = useState(false);
   const [loading, setLoading] = useState(false);
   const panelRef = useRef(null);

   const fetchNotifications = async () => {
      try {
         const res = await notificationApi.getNotifications({ limit: 10, unreadOnly: false });
         if (res?.success && res.data) {
            setData({
               notifications: res.data.notifications || [],
               unreadCount: res.data.unreadCount ?? 0,
            });
         }
      } catch (_) {
         // Notifications API may not exist yet
      }
   };

   useEffect(() => {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
   }, []);

   useEffect(() => {
      if (!open) return;
      const onOutside = (e) => {
         if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener('click', onOutside);
      return () => document.removeEventListener('click', onOutside);
   }, [open]);

   const markAllRead = async () => {
      setLoading(true);
      try {
         await notificationApi.markAllAsRead();
         setData((prev) => ({
            ...prev,
            unreadCount: 0,
            notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
         }));
      } catch (_) {}
      setLoading(false);
   };

   const markOneRead = async (id) => {
      try {
         await notificationApi.markAsRead(id);
         setData((prev) => ({
            ...prev,
            unreadCount: Math.max(0, prev.unreadCount - 1),
            notifications: prev.notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
         }));
      } catch (_) {}
   };

   return (
      <div className="notification-bell-wrapper" ref={panelRef}>
         <button
            type="button"
            className="notification-bell-btn"
            onClick={() => setOpen(!open)}
            aria-label="Thông báo"
         >
            <span className="bell-icon">🔔</span>
            {data.unreadCount > 0 && (
               <span className="notification-bell-badge">
                  {data.unreadCount > 9 ? '9+' : data.unreadCount}
               </span>
            )}
         </button>
         {open && (
            <div className="notification-bell-panel">
               <div className="notification-bell-panel-header">
                  <h3 className="notification-bell-panel-title">Thông báo</h3>
                  {data.unreadCount > 0 && (
                     <button
                        type="button"
                        className="notification-bell-mark-all"
                        onClick={markAllRead}
                        disabled={loading}
                     >
                        Đọc tất cả
                     </button>
                  )}
               </div>
               <div className="notification-bell-list">
                  {data.notifications.length === 0 ? (
                     <p className="notification-bell-empty">Không có thông báo</p>
                  ) : (
                     data.notifications.map((n) => (
                        <div
                           key={n._id}
                           className={`notification-bell-item ${!n.isRead ? 'unread' : ''}`}
                           onClick={() => !n.isRead && markOneRead(n._id)}
                        >
                           <p className="notification-bell-item-title">{n.title}</p>
                           {n.body && <p className="notification-bell-item-body">{n.body}</p>}
                           <p className="notification-bell-item-time">
                              {n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}
                           </p>
                        </div>
                     ))
                  )}
               </div>
            </div>
         )}
      </div>
   );
}
