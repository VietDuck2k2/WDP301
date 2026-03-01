import { Popover } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
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
      <Popover.Button className="relative p-2 hover:bg-gray-100 rounded-full">
        <BellIcon className="h-6 w-6 text-gray-600" />
        {data.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {data.unreadCount > 9 ? '9+' : data.unreadCount}
          </span>
        )}
      </Popover.Button>
      <Popover.Panel className="absolute right-0 z-50 mt-2 w-80 bg-white shadow-xl rounded-2xl border border-gray-100">
        <div className="p-3 flex justify-between items-center border-b">
          <h3 className="font-semibold">Thông báo</h3>
          {data.unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-blue-600 hover:underline"
            >
              Đọc tất cả
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {data.notifications.length === 0 ? (
            <p className="p-4 text-center text-gray-400 text-sm">Không có thông báo</p>
          ) : (
            data.notifications.map((n) => (
              <div
                key={n._id}
                className={`p-3 border-b hover:bg-gray-50 ${!n.isRead ? 'bg-blue-50' : ''}`}
              >
                <p className="font-medium text-sm">{n.title}</p>
                <p className="text-xs text-gray-500">{n.body}</p>
                <p className="text-xs text-gray-400 mt-1">
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
