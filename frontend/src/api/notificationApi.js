import axiosInstance from './axios';

export const notificationApi = {
  getNotifications(params = {}) {
    const { unreadOnly = false, page = 1, limit = 10 } = params;
    return axiosInstance.get('/notifications', {
      params: { unreadOnly, page, limit },
    });
  },

  markAllRead() {
    return axiosInstance.put('/notifications/read-all');
  },

  markRead(id) {
    return axiosInstance.put(`/notifications/${id}/read`);
  },

  deleteNotification(id) {
    return axiosInstance.delete(`/notifications/${id}`);
  },
};
