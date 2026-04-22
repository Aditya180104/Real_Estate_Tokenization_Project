import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/login", { email, password });
          api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/register", userData);
          api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        delete api.defaults.headers.common["Authorization"];
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },

      refreshUser: async () => {
        try {
          const { data } = await api.get("/auth/me");
          set({ user: data.user });
        } catch {
          get().logout();
        }
      },

      initializeAuth: () => {
        const { token } = get();
        if (token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;
