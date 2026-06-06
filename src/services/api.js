import axios from 'axios';
import { useAuthStore } from '../store/authStore';

let apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Fallback just in case the Vercel environment variable is accidentally malformed (e.g. missing https:// or contains the key name)
if (apiBase.includes('VITE_API_URL=')) {
  apiBase = apiBase.replace('VITE_API_URL=', '');
}
if (!apiBase.startsWith('http')) {
  apiBase = `https://${apiBase}`;
}

const apiClient = axios.create({
  baseURL: apiBase,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── 1. REQUEST INTERCEPTOR (ATTACH FRESH TOKEN) ───────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // ✅ Always fetch the absolute freshest token directly from your Zustand store state
    // fallback to localStorage if Zustand hasn't fully hydrated yet
    const token = useAuthStore.getState().token || localStorage.getItem('token');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── 2. RESPONSE INTERCEPTOR (HANDLE EXPIRED TOKENS) ──────────────────────
let isRefreshing = false;
let refreshQueue = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ FIXED: Check token from Zustand first, then fallback to localStorage
    const token = useAuthStore.getState().token || localStorage.getItem('token');
    const hasToken = !!token;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      hasToken // Only retry if we actually have a logged-in session token to refresh
    ) {
      if (isRefreshing) {
        // Queue requests while refreshing
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await apiClient.post('/auth/refresh');
        const { token: newToken, user: updatedUser } = response.data;

        // ✅ FIXED: Update BOTH localStorage and your global Zustand store state
        localStorage.setItem('token', newToken);
        if (updatedUser) localStorage.setItem('user', JSON.stringify(updatedUser));

        // Update the Zustand store directly so components re-render with new token
        useAuthStore.getState().setAuth(newToken, updatedUser || useAuthStore.getState().user);

        // Drain queue
        refreshQueue.forEach(({ resolve }) => resolve(newToken));
        refreshQueue = [];

        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear auth completely
        refreshQueue.forEach(({ reject }) => reject(refreshError));
        refreshQueue = [];

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        try {
          const { logout } = useAuthStore.getState();
          logout();
        } catch (logoutError) {
          console.error('Logout failed:', logoutError);
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;