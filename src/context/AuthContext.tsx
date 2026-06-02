import { API_URL } from '../config';
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface User {
  id: number;
  username: string;
  role: string;
  token?: string;
}

interface AuthContextType {
  isAdmin: boolean;
  isOrganizer: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<User | null>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Global Fetch Interceptor to automatically attach JWT authorization headers
const setupFetchInterceptor = () => {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    // Only intercept requests to our backend API
    if (url.startsWith(API_URL)) {
      const saved = localStorage.getItem('matchup_user');
      if (saved) {
        try {
          const userData = JSON.parse(saved) as User;
          if (userData && userData.token) {
            init = init || {};
            // Prepare headers safely preserving existing headers
            const headers = new Headers(init.headers || {});
            if (!headers.has('Authorization')) {
              headers.set('Authorization', `Bearer ${userData.token}`);
            }
            init.headers = headers;
          }
        } catch (e) {
          console.error('Error parsing auth token in fetch interceptor:', e);
        }
      }
    }
    return originalFetch(input, init);
  };
};

// Execute interceptor setup
setupFetchInterceptor();

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('matchup_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (data.success) {
        const loggedUser: User = {
          ...data.user,
          token: data.token
        };
        setUser(loggedUser);
        localStorage.setItem('matchup_user', JSON.stringify(loggedUser));
        return loggedUser;
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  };

  const register = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (data.success) {
        const loggedUser: User = {
          ...data.user,
          token: data.token
        };
        setUser(loggedUser);
        localStorage.setItem('matchup_user', JSON.stringify(loggedUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('matchup_user');
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const isOrganizer = user?.role === 'ORGANIZER';

  return (
    <AuthContext.Provider value={{ 
      isAdmin,
      isOrganizer,
      user, 
      login, 
      register, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
