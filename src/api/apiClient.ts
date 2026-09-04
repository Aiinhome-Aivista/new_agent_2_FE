import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://187.127.163.17:3012/api' || 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      window.location.href = '/unauthorized';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
