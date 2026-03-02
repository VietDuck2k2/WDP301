import axios from 'axios';

// Get base URL from environment variable or use default
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
   baseURL,
   headers: {
      'Content-Type': 'application/json',
   },
});

// Request interceptor: attach token; for FormData omit Content-Type (browser sets multipart boundary)
axiosInstance.interceptors.request.use(
   (config) => {
      const token = localStorage.getItem('token');
      if (token) {
         config.headers.Authorization = `Bearer ${token}`;
      }
      if (config.data instanceof FormData) {
         delete config.headers['Content-Type'];
      }
      return config;
   },
   (error) => {
      return Promise.reject(error);
   }
);

// Response interceptor: handle errors globally
axiosInstance.interceptors.response.use(
   (response) => {
      return response.data; // Return the 'data' part directly if suitable
   },
   (error) => {
      // Handle 401 Unauthorized globally
      if (error.response && error.response.status === 401) {
         // localStorage.removeItem('token');
         // window.location.href = '/login';
         console.error('Unauthorized! Token might be expired.');
      }
      return Promise.reject(error);
   }
);

export default axiosInstance;
