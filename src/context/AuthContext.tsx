import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, HealthStatus } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  health: HealthStatus | null;
  isDbConnected: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    name: string;
    email: string;
    studentId: string;
    department: string;
    yearOfStudy: number;
    password: string;
  }) => Promise<User>;
  bootstrapAdmin: (data: {
    setupSecret: string;
    name: string;
    email: string;
    password: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshHealth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  const isDbConnected = Boolean(health?.database?.connected);

  const fetchHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (err) {
      console.warn('Health check failed:', err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await api.getCurrentUser();
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchCurrentUser();

    // Periodic health poll every 30s to keep DB status in sync
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.login({ email, password });
    setUser(res.user);
    await fetchHealth();
    return res.user;
  };

  const register = async (data: {
    name: string;
    email: string;
    studentId: string;
    department: string;
    yearOfStudy: number;
    password: string;
  }): Promise<User> => {
    const res = await api.registerStudent(data);
    setUser(res.user);
    await fetchHealth();
    return res.user;
  };

  const bootstrapAdmin = async (data: {
    setupSecret: string;
    name: string;
    email: string;
    password: string;
  }): Promise<User> => {
    const res = await api.bootstrapAdmin(data);
    setUser(res.user);
    await fetchHealth();
    return res.user;
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.getCurrentUser();
      setUser(res.user);
    } catch {
      setUser(null);
    }
  };

  const refreshHealth = async () => {
    await fetchHealth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        health,
        isDbConnected,
        login,
        register,
        bootstrapAdmin,
        logout,
        refreshUser,
        refreshHealth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
