import axios from 'axios';
import env from '@/config/env';

const axiosInstance = axios.create({
  baseURL: `${env.apiUrl}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sbr_token');
      if (token) config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('sbr_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
