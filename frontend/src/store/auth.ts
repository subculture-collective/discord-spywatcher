// store/auth.ts (Zustand)
import { create } from 'zustand';

type AuthState = {
    accessToken: string | null;
    setToken: (token: string) => void;
    logout: () => void;
};

export const useAuth = create<AuthState>((set) => ({
    accessToken: null,
    setToken: (token) => set({ accessToken: token }),
    logout: () => {
        set({ accessToken: null });
        // Optional: clear localStorage, redirect, etc.
    },
}));
