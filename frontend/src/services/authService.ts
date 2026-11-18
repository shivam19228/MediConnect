import { User, UserRole, AuthState } from '../types/auth';
import { apiClient, tokenStorage } from './apiClient';

const STORAGE_KEY = 'mediconnect_auth_session';

export const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string; user: User }> = {
  PATIENT: {
    email: 'patient@demo.com',
    pass: 'Patient@123',
    user: {
      id: 'demo-pat-001',
      name: 'Sunita Devi',
      email: 'patient@demo.com',
      role: 'PATIENT',
      phone: '+91 98111 22334',
    },
  },
  DOCTOR: {
    email: 'doctor@demo.com',
    pass: 'Doctor@123',
    user: {
      id: 'demo-doc-001',
      name: 'Dr. Anita Desai, MD',
      email: 'doctor@demo.com',
      role: 'DOCTOR',
      specialty: 'Internal Medicine & Primary Care',
    },
  },
  ADMIN: {
    email: 'admin@demo.com',
    pass: 'Admin@123',
    user: {
      id: 'demo-adm-001',
      name: 'MediConnect Admin',
      email: 'admin@demo.com',
      role: 'ADMIN',
    },
  },
};

export const authService = {
  getCurrentSession(): AuthState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const token = tokenStorage.get();
      if (stored && token) {
        const parsed = JSON.parse(stored) as User;
        return {
          user: parsed,
          isAuthenticated: true,
          role: parsed.role,
        };
      }
    } catch (e) {
      console.warn('Failed to parse auth session from localStorage', e);
    }
    return {
      user: null,
      isAuthenticated: false,
      role: null,
    };
  },

  async login(
    role: UserRole,
    emailInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const authRes = await apiClient.login(emailInput, passwordInput);
      const apiUser = authRes.user;

      const user: User = {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role,
        avatar: apiUser.avatar,
        phone: apiUser.phone,
        specialty: apiUser.specialty,
      };

      // Validate selected role against backend granted role
      if (user.role !== role) {
        apiClient.logout();
        return {
          success: false,
          error: `Selected role (${role}) does not match your backend credentials (${user.email} is registered as ${user.role}). Please switch role or use the appropriate account.`,
        };
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return { success: true, user };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Authentication failed. Please verify credentials.',
      };
    }
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: 'PATIENT' | 'DOCTOR';
    phone?: string;
  }): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const authRes = await apiClient.register({
        fullName: data.name,
        email: data.email,
        password: data.password,
        role: data.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
        phone: data.phone,
      });
      const apiUser = authRes.user;
      const user: User = {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role,
        avatar: apiUser.avatar,
        phone: apiUser.phone,
        specialty: apiUser.specialty,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return { success: true, user };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Registration failed.',
      };
    }
  },

  logout(): void {
    apiClient.logout();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },

  async switchRole(targetRole: UserRole): Promise<User> {
    const creds = DEMO_CREDENTIALS[targetRole];
    try {
      const res = await apiClient.login(creds.email, creds.pass);
      const user: User = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role,
        avatar: res.user.avatar,
        phone: res.user.phone,
        specialty: res.user.specialty,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return user;
    } catch {
      // Fallback to local demo user if backend offline during preview
      const fallbackUser = creds.user;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackUser));
      return fallbackUser;
    }
  },

  async refreshCurrentUser(): Promise<User | null> {
    try {
      const profile = await apiClient.getCurrentUser();
      const updatedUser: User = {
        id: profile.id,
        name: profile.fullName,
        email: profile.email,
        role: profile.role,
        avatar: profile.avatarUrl,
        phone: profile.phone,
        specialty: profile.specialty,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    } catch {
      return null;
    }
  },
};
