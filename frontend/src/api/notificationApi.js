import axiosInstance from './axios';

export const notificationApi = {
   getNotifications: (params) => axiosInstance.get('/notifications', { params }),
   markAsRead: (id) => axiosInstance.put(`/notifications/${id}/read`),
   markAllAsRead: () => axiosInstance.put('/notifications/read-all'),
   deleteNotification: (id) => axiosInstance.delete(`/notifications/${id}`),
};
