import axiosInstance from './axios';

export const notificationApi = {
   getNotifications: (params) => axiosInstance.get('/notifications', { params }),
   markAllAsRead: () => axiosInstance.put('/notifications/read-all'),
   markAsRead: (id) => axiosInstance.put(`/notifications/${id}/read`),
   deleteNotification: (id) => axiosInstance.delete(`/notifications/${id}`),
};
