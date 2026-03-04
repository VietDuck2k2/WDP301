import React, { useEffect, useState } from 'react';
import { Popover } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { notificationApi } from '../api/notificationApi';

export default function NotificationBell() {
   const [data, setData] = useState({ notifications: [], unreadCount: 0 });

   const fetchNotifications = async () => {
      try {
         const res = await notificationApi.getNotifications({ limit: 10 });
         if (res?.success && res.data) {
            setData({
               notifications: res.data.notifications || res.data,
               unreadCount: res.data.unreadCount ?? (res.data.notifications || res.data).filter((n) => !n.isRead).length,
            });
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

   return (
      <Popover className="relative">
         <Popover.Button className="relative rounded-full p-2 hover:bg-gray-100">
            <BellIcon className="h-6 w-6" />
            {data.unreadCount > 0 && (
               <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {data.unreadCount > 9 ? '9+' : data.unreadCount}
               </span>
            )}
         </Popover.Button>
         <Popover.Panel className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-gray-100 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-3">
               <h3 className="font-semibold">Thông báo</h3>
               <button type="button" onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                  Đọc tất cả
               </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
               {data.notifications.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-400">Không có thông báo</p>
               ) : (
                  data.notifications.map((n) => (
                     <div
                        key={n._id}
                        className={`border-b p-3 hover:bg-gray-50 ${!n.isRead ? 'bg-blue-50' : ''}`}
                     >
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-gray-500">{n.body}</p>
                        <p className="mt-1 text-xs text-gray-400">
                           {new Date(n.createdAt).toLocaleString('vi-VN')}
                        </p>
                     </div>
                  ))
               )}
            </div>
         </Popover.Panel>
      </Popover>
   );
}
