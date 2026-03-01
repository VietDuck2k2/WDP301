import axiosInstance from './axios';

export const authApi = {
  async login(email, password) {
    const res = await axiosInstance.post('/auth/login', { email, password });
    return res;
  },

  async getProfile() {
    const res = await axiosInstance.get('/me');
    return res;
  },
};
