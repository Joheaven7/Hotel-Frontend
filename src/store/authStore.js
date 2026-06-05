import { create } from 'zustand';
import apiClient from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  isInitialized: false,

  // Boot: load from localStorage, then verify token is still valid
  loadUser: async () => {
    try {
      const token = localStorage.getItem('token');
      const userRaw = localStorage.getItem('user');

      // ✅ FIX: If no token/user, mark as initialized and return immediately
      if (!token || !userRaw) {
        set({ token: null, user: null, isInitialized: true });
        // Remove auth header if no token
        delete apiClient.defaults.headers.common['Authorization'];
        return;
      }

      // Optimistically set state for fast UI render
      const user = JSON.parse(userRaw);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ token, user, isInitialized: true });

      // Then silently verify the token is still valid
      try {
        const response = await apiClient.get('/auth/me');
        const freshUser = response.data;
        localStorage.setItem('user', JSON.stringify(freshUser));
        set({ user: freshUser });
      } catch (verifyError) {
        console.warn('Token verification failed, attempting refresh...');
        // Token expired or invalid — attempt refresh
        try {
          const refreshResponse = await apiClient.post('/auth/refresh');
          const { token: newToken, user: newUser } = refreshResponse.data;
          localStorage.setItem('token', newToken);
          localStorage.setItem('user', JSON.stringify(newUser));
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          set({ token: newToken, user: newUser });
        } catch (refreshError) {
          console.warn('Token refresh failed, logging out...');
          // Refresh also failed — force logout
          get().logout();
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      set({ isInitialized: true, token: null, user: null });
      delete apiClient.defaults.headers.common['Authorization'];
    }
  },

  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ token, user, error: null });
  },

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ token, user, loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      set({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/auth/register', userData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ token, user, loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      set({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (_) {
      // Logout endpoint failed, but we still clear local state
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete apiClient.defaults.headers.common['Authorization'];
    set({ token: null, user: null, error: null, isInitialized: true });
  },

  getCurrentUser: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get('/auth/me');
      const freshUser = response.data;
      set({ user: freshUser, loading: false });
      localStorage.setItem('user', JSON.stringify(freshUser));
      return freshUser;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));