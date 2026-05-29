// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'tenant' | 'landlord' | 'owner' | 'admin';

interface User {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  profilePicture?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (name: string, role: UserRole, email?: string, id?: string, isVerified?: boolean) => void;
  signup: (name: string, email: string, role: UserRole) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('flatmate_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error restoring user session:', error);
      localStorage.removeItem('flatmate_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (name: string, role: UserRole, email = '', id?: string, isVerified?: boolean) => {
    const u: User = { id, name, email, role, isVerified };
    setUser(u);
    localStorage.setItem('flatmate_user', JSON.stringify(u));
  };

  const signup = (name: string, email: string, role: UserRole) => {
    const u: User = { name, email, role };
    setUser(u);
    localStorage.setItem('flatmate_user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('flatmate_user');
    localStorage.removeItem('token');
    localStorage.removeItem('flatmate_token');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('flatmate_user', JSON.stringify(updatedUser));
    }
  };

  // Show loading state while checking for stored user
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-button-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}