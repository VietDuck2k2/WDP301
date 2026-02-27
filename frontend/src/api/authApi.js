import axiosInstance from './axios';

export const authApi = {
   login: (data) => axiosInstance.post('/auth/login', data),
   getProfile: () => axiosInstance.get('/me'),
};
