import axios, { AxiosResponse } from 'axios';
import { API_BASE_URL } from '../config/api';
import { ApiResponse } from '../types';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: (status) => status >= 200 && status < 300,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      data: config.data,
      params: config.params
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API Response:', {
      status: response.status,
      data: response.data
    });
    // Validate response data
    if (response.data === null || response.data === undefined) {
      throw new Error('Invalid response data');
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    console.error('API Response Error:', error.response || error);
    throw error;
  }
);

export default api;

// API helper functions with direct data access
export const apiRequest = {
  get: <T>(url: string): Promise<T> =>
    api.get(url).then(res => {
      console.log('API Response:', {
        url,
        data: res.data,
        status: res.status
      });
      return res.data;
    }),
  
  post: <T>(url: string, data?: any): Promise<T> =>
    api.post(url, data).then(res => res.data),
  
  put: <T>(url: string, data?: any): Promise<T> =>
    api.put(url, data).then(res => res.data),
  
  delete: <T>(url: string): Promise<T> =>
    api.delete(url).then(res => res.data),
};
