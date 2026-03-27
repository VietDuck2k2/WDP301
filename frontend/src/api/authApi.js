import axiosInstance from './axios';

export const authApi = {
   login: (data) => axiosInstance.post('/auth/login', data),
   getProfile: () => axiosInstance.get('/me'),
   /** POST /auth/logout — backend revokes refresh token if sent; no body needed when using only access token */
   logout: () => axiosInstance.post('/auth/logout', {}),
   /** PUT /auth/change-password — requires Bearer token */
   changePassword: (currentPassword, newPassword) =>
      axiosInstance.put('/auth/change-password', { currentPassword, newPassword }),
};
