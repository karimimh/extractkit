import React, { useCallback, useEffect, useState } from "react";
import { apiClient } from "../utils/api";
import { AuthContext } from "./auth-context";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const authenticated = await apiClient.auth.checkAuthStatus();
      setIsAuthenticated(authenticated);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      await apiClient.auth.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token") {
        checkAuth();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [checkAuth]);

  const value = {
    isAuthenticated,
    isLoading,
    checkAuth,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

