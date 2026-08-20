import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiClient, type AuthUser } from "./apiClient";

const STORAGE_KEY = "jetkiz-auth-v1";

interface AuthState {
  user: AuthUser | null;
  login: (phone: string, password: string) => Promise<AuthUser>;
  register: (fullName: string, phone: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.user ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("access_token");
    }
  }, [user]);

  const login = useCallback(async (phone: string, password: string) => {
    const res = await apiClient.authLogin({ phone, password });
    localStorage.setItem("access_token", res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (fullName: string, phone: string, password: string) => {
    const res = await apiClient.authRegister({ full_name: fullName, phone, password });
    localStorage.setItem("access_token", res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}