import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (role: UserRole, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentSession().user);
  const [role, setRole] = useState<UserRole | null>(() => authService.getCurrentSession().role);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => authService.getCurrentSession().isAuthenticated
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
  }, []);

  // Listen for unauthorized event dispatched by apiClient on 401
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('mediconnect:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('mediconnect:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = async (selectedRole: UserRole, email: string, pass: string) => {
    const res = await authService.login(selectedRole, email, pass);
    if (res.success && res.user) {
      setUser(res.user);
      setRole(res.user.role);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const switchRole = async (newRole: UserRole) => {
    const newUser = await authService.switchRole(newRole);
    setUser(newUser);
    setRole(newUser.role);
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
