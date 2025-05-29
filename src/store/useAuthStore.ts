import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { login, logout, getUserAuth } from '../utils/api'; // Impor fungsi API yang sudah ada
import type { ICredentials, IUser } from '../types/core.types'; // Pastikan IUser ada di core.types

// Definisi tipe untuk state store
interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: ICredentials) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

// Buat store Zustand untuk autentikasi
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Fungsi login
        login: async (credentials: ICredentials) => {
          set({ isLoading: true, error: null });
          try {
            const response = await login(credentials);
            if (response.success) {
              const userData = await getUserAuth();
              if (userData.success !== false) {
                set({ user: userData, isAuthenticated: true, isLoading: false });
              } else {
                throw new Error(userData.message || 'Failed to fetch user data');
              }
            } else {
              throw new Error(response.message);
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Login failed',
              isLoading: false,
              isAuthenticated: false,
            });
          }
        },

        // Fungsi logout
        logout: async () => {
          set({ isLoading: true, error: null });
          try {
            const response = await logout();
            if (response.success) {
              set({ user: null, isAuthenticated: false, isLoading: false });
            } else {
              throw new Error(response.message);
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Logout failed',
              isLoading: false,
            });
          }
        },

        // Fungsi untuk mengambil data pengguna
        fetchUser: async () => {
          set({ isLoading: true, error: null });
          try {
            const userData = await getUserAuth();
            if (userData.success !== false) {
              set({ user: userData, isAuthenticated: true, isLoading: false });
            } else {
              set({ user: null, isAuthenticated: false, isLoading: false });
            }
          } catch (error) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch user',
            });
          }
        },

        // Fungsi untuk membersihkan error
        clearError: () => set({ error: null }),
      }),
      {
        name: 'auth-storage', // Nama untuk persistensi di localStorage
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }), // Hanya simpan user dan isAuthenticated di localStorage
      }
    )
  )
);