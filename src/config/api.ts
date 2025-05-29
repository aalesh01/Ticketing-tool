export const API_BASE_URL = 'https://ticketing-tool-mnma.onrender.com:3001/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me'
  },
  TICKETS: {
    LIST: `${API_BASE_URL}/tickets`,
    GET: (id: string) => `${API_BASE_URL}/tickets/${id}`,
    CREATE: `${API_BASE_URL}/tickets`,
    UPDATE: (id: string) => `${API_BASE_URL}/tickets/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/tickets/${id}`,
    MESSAGES: (id: string) => `${API_BASE_URL}/tickets/${id}/messages`,
    ADD_MESSAGE: (id: string) => `${API_BASE_URL}/tickets/${id}/messages`,
  },
  DASHBOARD: {
    STATS: `${API_BASE_URL}/dashboard/stats`,
    PERFORMANCE: `${API_BASE_URL}/dashboard/performance`,
  },
};
