import React, { useEffect, useState } from 'react';
import { Popover } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/solid';
import { notificationApi } from '../api/notificationApi';
import './NotificationBell.css';

export default function NotificationBell() {
   const [data, setData] = useState({ notifications: [], unreadCount: 0 });

   const fetchNotifications = async () => {
      try {
         const res = await notificationApi.getNotifications({ limit: 15 });
         if (res?.success && res.data) {
            const list = res.data.notifications || res.data;
            const arr = Array.isArray(list) ? list : [];
            const unread = res.data.unreadCount ?? arr.filter((n) => !n.isRead).length;
            setData({ notifications: arr, unreadCount: unread });
         }
      } catch (_) {}
   };

   useEffect(() => {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
   }, []);

   const markAllRead = async () => {
      try {
         await notificationApi.markAllAsRead();
         setData((prev) => ({
            ...prev,
            unreadCount: 0,
            notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
         }));
      } catch (_) {}
   };

   const formatTime = (dateStr) => {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now - d;
      const diffM = Math.floor(diffMs / 60000);
      const diffH = Math.floor(diffMs / 3600000);
      const diffD = Math.floor(diffMs / 86400000);
      if (diffM < 1) return 'Vừa xong';
      if (diffM < 60) return `${diffM} phút trước`;
      if (diffH < 24) return `${diffH} giờ trước`;
      if (diffD < 7) return `${diffD} ngày trước`;
      return d.toLocaleDateString('vi-VN');
   };

   return (
      <Popover className="notification-bell">
         <Popover.Button className="notification-bell__btn" aria-label="Xem thông báo">
            <BellIcon style={{ color: '#0f172a', width: 24, height: 24 }} />
            {data.unreadCount > 0 && (
               <span className="notification-bell__badge">
                  {data.unreadCount > 99 ? '99+' : data.unreadCount}
               </span>
            )}
         </Popover.Button>
         <Popover.Panel className="notification-bell__panel">
            <div className="notification-bell__header">
               <h3 className="notification-bell__title">Thông báo</h3>
               {data.unreadCount > 0 && (
                  <button type="button" className="notification-bell__mark-all" onClick={markAllRead}>
                     Đọc tất cả
                  </button>
               )}
            </div>
            <div className="notification-bell__list">
               {data.notifications.length === 0 ? (
                  <p className="notification-bell__empty">Không có thông báo</p>
               ) : (
                  data.notifications.map((n) => (
                     <div
                        key={n._id}
                        className={`notification-bell__item ${!n.isRead ? 'notification-bell__item--unread' : ''}`}
                     >
                        <div className="notification-bell__item-avatar">🔔</div>
                        <div className="notification-bell__item-body">
                           <p className="notification-bell__item-title">{n.title}</p>
                           <p className="notification-bell__item-text">{n.body}</p>
                           <p className="notification-bell__item-time">{formatTime(n.createdAt)}</p>
                        </div>
                     </div>
                  ))
               )}
            </div>
         </Popover.Panel>
      </Popover>
   );
}
