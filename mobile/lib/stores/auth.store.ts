import { create } from "zustand";
import { AppState } from "react-native";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";

// Supabase uses this adapter to persist its session (including refresh_token)
// onAuthStateChange then keeps our "access_token" key in sync for the API client
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Keep the "access_token" key up-to-date whenever Supabase refreshes silently
supabase.auth.onAuthStateChange(async (_event, session) => {
  if (session?.access_token) {
    await SecureStore.setItemAsync("access_token", session.access_token);
  } else {
    await SecureStore.deleteItemAsync("access_token");
  }
});

// N'auto-rafraîchit le token QUE quand l'app est au premier plan.
// En arrière-plan, le Keychain refuse l'accès ("User interaction is not allowed")
// et les requêtes réseau échouent — ce qui spammait la console.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

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
    // onAuthStateChange handles SecureStore update
    set({ userId: data.user.id, isAuthenticated: true });
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    if (data.session) {
      set({ userId: data.user?.id ?? null, isAuthenticated: true });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    // onAuthStateChange handles SecureStore cleanup
    set({ userId: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    // getSession() reads from persisted storage (SecureStore via adapter)
    // Supabase auto-refreshes if the access_token is expired but refresh_token is valid
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      set({ userId: data.session.user.id, isAuthenticated: true });
    }
    set({ isLoading: false });
  },
}));
