import { create } from "zustand";
import { api } from "../lib/api";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
}

interface AuthStore {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { token, user } = await api.post<{ token: string; user: AuthUser }>("/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", token);
      set({ user, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null });
  },

  hydrate: () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    // Decode payload without verification (verification happens server-side on each request)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        return;
      }
      set({ user: { id: payload.userId, email: payload.email, role: payload.role, name: "" } });
    } catch {
      localStorage.removeItem("token");
    }
  },
}));
