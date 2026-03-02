import { Popover } from '@headlessui/react';
import { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';

export default function NotificationBell() {
  const [data, setData] = useState({ notifications: [], unreadCount: 0 });

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get('/notifications?limit=10');
      if (res?.success && res?.data) {
        setData({
          notifications: res.data.notifications || [],
          unreadCount: res.data.unreadCount ?? 0,
        });
      }
    } catch {
      setData({ notifications: [], unreadCount: 0 });
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      await axiosInstance.put('/notifications/read-all');
      setData((prev) => ({
        ...prev,
        unreadCount: 0,
        notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
      }));
    } catch {
      // ignore
    }
  };

  return (
    <Popover className="relative">
      <Popover.Button className="relative p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
        <span className="material-symbols-outlined">notifications</span>
        {data.unreadCount > 0 && (
          <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1a242f]" />
        )}
      </Popover.Button>
      <Popover.Panel className="absolute right-0 z-50 mt-2 w-80 bg-white dark:bg-[#1a242f] shadow-xl rounded-xl border border-[#f0f2f4] dark:border-gray-800">
        <div className="p-3 flex justify-between items-center border-b border-[#f0f2f4] dark:border-gray-800">
          <h3 className="font-semibold text-[#111418] dark:text-white">Thông báo</h3>
          {data.unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-primary hover:underline font-medium"
            >
              Đọc tất cả
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {data.notifications.length === 0 ? (
            <p className="p-4 text-center text-[#617589] dark:text-gray-400 text-sm">Không có thông báo</p>
          ) : (
            data.notifications.map((n) => (
              <div
                key={n._id}
                className={`p-3 border-b border-[#f0f2f4] dark:border-gray-800 hover:bg-[#f0f2f4] dark:hover:bg-gray-800/50 ${!n.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
              >
                <p className="font-medium text-sm text-[#111418] dark:text-white">{n.title}</p>
                <p className="text-xs text-[#617589] dark:text-gray-400">{n.body}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
