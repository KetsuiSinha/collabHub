import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/auth';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Login action
      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const response = await authAPI.login(credentials);
          const { user, token } = response;

          // Store in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          // Connect socket
          socketService.connect(token);
          socketService.authenticate({
            userId: user.id,
            username: user.username
          });

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            error: null
          });

          toast.success('Logged in successfully!');
          return response;
        } catch (error) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Login failed'
          });
          throw error;
        }
      },

      // Register action
      register: async (userData) => {
        set({ loading: true, error: null });
        try {
          const response = await authAPI.register(userData);
          const { user, token } = response;

          // Store in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          // Connect socket
          socketService.connect(token);
          socketService.authenticate({
            userId: user.id,
            username: user.username
          });

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            error: null
          });

          toast.success('Account created successfully!');
          return response;
        } catch (error) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Registration failed'
          });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');

          // Disconnect socket
          socketService.disconnect();

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: null
          });

          toast.success('Logged out successfully');
        }
      },

      // Initialize auth from localStorage
      initializeAuth: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            
            // Connect socket
            socketService.connect(token);
            socketService.authenticate({
              userId: user.id,
              username: user.username
            });

            set({
              user,
              token,
              isAuthenticated: true
            });
          } catch (error) {
            console.error('Failed to initialize auth:', error);
            get().logout();
          }
        }
      },

      // Update profile
      updateProfile: async (profileData) => {
        set({ loading: true });
        try {
          const response = await authAPI.updateProfile(profileData);
          const { user } = response;

          localStorage.setItem('user', JSON.stringify(user));

          set({
            user,
            loading: false
          });

          toast.success('Profile updated successfully!');
          return response;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);