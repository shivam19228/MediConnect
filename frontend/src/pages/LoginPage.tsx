import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Stethoscope, Shield, ArrowRight, AlertCircle, CheckCircle2, Lock, Mail, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { DEMO_CREDENTIALS } from '../services/authService';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole>('PATIENT');
  const [email, setEmail] = useState<string>(DEMO_CREDENTIALS.PATIENT.email);
  const [password, setPassword] = useState<string>(DEMO_CREDENTIALS.PATIENT.pass);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setEmail(DEMO_CREDENTIALS[role].email);
    setPassword(DEMO_CREDENTIALS[role].pass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(selectedRole, email, password);
      if (result.success) {
        if (selectedRole === 'PATIENT') {
          navigate('/patient/dashboard');
        } else if (selectedRole === 'DOCTOR') {
          navigate('/doctor/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        setError(result.error || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-teal-50/50 to-slate-100">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 bg-teal-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-teal-600/25 mb-4">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            MediConnect Sign In
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Select your role to access the case-taking system
          </p>
        </div>

        {/* Role Selector Tabs (Visually Highlighted) */}
        <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-3 gap-2">
          {(
            [
              { role: 'PATIENT', label: 'Patient', icon: User, desc: 'Voice case intake' },
              { role: 'DOCTOR', label: 'Doctor', icon: Stethoscope, desc: 'Clinical review' },
              { role: 'ADMIN', label: 'Admin', icon: Shield, desc: 'System overview' },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isSelected = selectedRole === item.role;
            return (
              <button
                key={item.role}
                id={`role-select-${item.role.toLowerCase()}`}
                type="button"
                onClick={() => handleRoleChange(item.role)}
                className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 ring-2 ring-teal-500/30'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">{item.label}</span>
                <span className={`text-[10px] hidden sm:block ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                  {item.desc}
                </span>
              </button>

            );
          })}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Key className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            id="login-submit-button"
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-teal-600/20 text-sm transition-all ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <span>Authenticating with server...</span>
            ) : (
              <>
                <span>Sign In as {selectedRole}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        <p className="text-center text-xs text-slate-500">
          Connected to secure MediConnect Spring Boot backend authentication.
        </p>
      </div>
    </div>
  );
};
