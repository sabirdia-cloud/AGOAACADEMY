import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  impersonateParent: (parent: any) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('academy_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('academy_user', JSON.stringify(userData));
  };

  const impersonateParent = (parent: any) => {
    const parentUser: User = {
      id: `parent-${parent.id}`,
      username: parent.full_name,
      role: 'parent',
      parent_id: parent.id
    };
    setUser(parentUser);
    localStorage.setItem('academy_user', JSON.stringify(parentUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('academy_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, impersonateParent, isLoading }}>
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
