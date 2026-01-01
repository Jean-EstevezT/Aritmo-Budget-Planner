import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLanguage } from './LanguageContext';

interface User {
  username: string;
  avatar?: string;
  language?: 'en' | 'es';
}

interface StoredUser extends User {
  password: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  deleteAccount: (password: string) => Promise<boolean>;
  deleteUser: (username: string) => Promise<boolean>;
  logout: () => void;
  getStoredUsers: () => Promise<User[]>;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'finsynergy_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedSession = localStorage.getItem(SESSION_KEY);
    if (storedSession) {
      try {
        setUser(JSON.parse(storedSession));
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const getStoredUsers = async (): Promise<User[]> => {
    try {
      const users = await window.electron.auth.getUsers();
      return users;
    } catch (e) {
      return [];
    }
  };

  const { setLanguage, language } = useLanguage();

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await window.electron.auth.login(username, password);

      if (result.success && result.user) {
        const sessionUser: User = {
          username: result.user.username,
          avatar: result.user.avatar,
          language: result.user.language || 'en'
        };
        setUser(sessionUser);
        if (result.user.language) {
          setLanguage(result.user.language);
        }

        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
        setIsLoading(false);
        return true;
      } else {
        setError('login.error');
        setIsLoading(false);
        return false;
      }
    } catch (e) {
      setError('login.error');
      setIsLoading(false);
      return false;
    }
  };

  const register = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const avatar = `https://ui-avatars.com/api/?name=${username}&background=4f46e5&color=fff`;
    const userLang = language;

    try {
      const result = await window.electron.auth.register(username, password, avatar, userLang);

      if (result.success) {
        const sessionUser: User = { username, avatar, language: userLang };
        setUser(sessionUser);
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
        setIsLoading(false);
        return true;
      } else {
        setError('login.userExists');
        setIsLoading(false);
        return false;
      }
    } catch (e) {
      setError('login.error');
      setIsLoading(false);
      return false;
    }
  };

  const deleteAccount = async (password: string): Promise<boolean> => {
    if (!user) return false;
    return false;
  };

  const deleteUser = async (username: string): Promise<boolean> => {
    try {
      const result = await window.electron.auth.deleteUser(username);
      if (result.success) {
        if (user && user.username === username) {
          logout();
        }
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, deleteAccount, deleteUser, logout, getStoredUsers, isAuthenticated: !!user, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
