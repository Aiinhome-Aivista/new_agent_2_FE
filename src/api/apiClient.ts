import axios from 'axios';

// Dynamically determine backend API base URL
// Priority:
// 1. Environment variable (VITE_API_BASE_URL from .env or Docker build arg)
// 2. Dynamic browser location (/api relative to current origin, or localhost:8080 during local dev)
export const getBaseURL = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8080/api';
    }
    // For production/VPS deployment behind reverse proxy or served on the same host
    return `${window.location.origin}/api`;
  }
  return '/api';
};

export const baseURL = getBaseURL();

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
