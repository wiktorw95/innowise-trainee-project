import { create } from 'zustand';
import { api } from '@/lib/axios';

interface User {
  id: string;
  email?: string;
  role?: string;
}
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get('/users/me');
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      try {
        await api.post('/auth/logout');
      } catch (e) {
        console.error('Silent logout failed during auth check:', e);
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
      set({ user: null, isAuthenticated: false });
      window.location.href = '/auth/signin';
    } catch (error) {
      console.error('Logout failed', error);
    }
  },
}));
