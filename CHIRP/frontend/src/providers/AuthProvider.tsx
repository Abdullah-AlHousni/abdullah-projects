import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { fetchCurrentUser } from "../api/auth";
import { getStoredToken, setStoredToken } from "../api/client";
import type { User } from "../types/api";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!token);

  const logout = useCallback(() => {
    setToken(null);
    setStoredToken(null);
    setUser(null);
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setStoredToken(newToken);
    setUser(newUser);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    try {
      setIsLoading(true);
      const profile = await fetchCurrentUser();
      setUser(profile);
    } catch (error) {
      console.error("Failed to refresh user", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout, token]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setUser(null);
      return;
    }
    refreshUser();
  }, [token, refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, login, logout, refreshUser }),
    [user, token, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
