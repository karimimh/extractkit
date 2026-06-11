import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export type AuthUser = {
  id: number;
  email: string;
  balance_cents: number;
  balance_usd: string;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (access: string, refresh: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchMe(accessToken: string): Promise<{ user: AuthUser | null; newToken?: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/me/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (refreshRes.ok) {
        const data = (await refreshRes.json()) as { access: string };
        localStorage.setItem("access_token", data.access);
        const retryRes = await fetch(`${API_BASE_URL}/api/auth/me/`, {
          headers: { Authorization: `Bearer ${data.access}` },
        });
        if (retryRes.ok) {
          return { user: (await retryRes.json()) as AuthUser, newToken: data.access };
        }
      }
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return { user: null };
  }

  if (!res.ok) return { user: null };
  return { user: (await res.json()) as AuthUser };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("access_token"));
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem("access_token"));

  useEffect(() => {
    const stored = localStorage.getItem("access_token");
    if (!stored) {
      setIsLoading(false);
      return;
    }
    fetchMe(stored).then(({ user: u, newToken }) => {
      setUser(u);
      if (newToken) setToken(newToken);
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (access: string, refresh: string) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    setToken(access);
    const { user: u, newToken } = await fetchMe(access);
    setUser(u);
    if (newToken) setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem("access_token");
    if (!currentToken) return;
    const { user: u, newToken } = await fetchMe(currentToken);
    setUser(u);
    if (newToken) setToken(newToken);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
