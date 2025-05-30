export const API_BASE_URL = 'https://ticketing-tool-mnma.onrender.com/api';  // Change back to localhost

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me'
  },
  TICKETS: {
    LIST: '/tickets',  // Remove API_BASE_URL prefix
    GET: (id: string) => `/tickets/${id}`,
    CREATE: '/tickets',
    UPDATE: (id: string) => `/tickets/${id}`,
    DELETE: (id: string) => `/tickets/${id}`,
    MESSAGES: (id: string) => `/tickets/${id}/messages`,
    ADD_MESSAGE: (id: string) => `/tickets/${id}/messages`,
  },
  DASHBOARD: {
    STATS: `${API_BASE_URL}/dashboard/stats`,
    PERFORMANCE: `${API_BASE_URL}/dashboard/performance`,
  },
};
