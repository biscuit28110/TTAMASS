import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

interface AuthState {
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  isAuthenticated: false,
  isLoading: true,

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    await SecureStore.setItemAsync("access_token", data.session.access_token);
    set({ userId: data.user.id, isAuthenticated: true });
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    if (data.session) {
      await SecureStore.setItemAsync("access_token", data.session.access_token);
      set({ userId: data.user?.id ?? null, isAuthenticated: true });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    await SecureStore.deleteItemAsync("access_token");
    set({ userId: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      await SecureStore.setItemAsync("access_token", data.session.access_token);
      set({ userId: data.session.user.id, isAuthenticated: true });
    }
    set({ isLoading: false });
  },
}));
