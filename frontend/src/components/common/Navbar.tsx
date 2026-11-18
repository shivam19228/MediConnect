import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Stethoscope, Globe, LogIn, LogOut, PhoneCall, Shield, User as UserIcon, Menu, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCase } from '../../context/CaseContext';
import { SUPPORTED_LANGUAGES } from '../../data/translations';
import { LanguageCode } from '../../types/case';
import { UserRole } from '../../types/auth';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, role, logout, switchRole } = useAuth();
  const { language, setLanguage } = useCase();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = (code: LanguageCode) => {
    setLanguage(code);
    setIsLangMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickSwitch = async (targetRole: UserRole) => {
    await switchRole(targetRole);
    if (targetRole === 'DOCTOR') navigate('/doctor/dashboard');
    else if (targetRole === 'ADMIN') navigate('/admin/dashboard');
    else navigate('/patient/dashboard');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-tr from-teal-600 to-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
                  Medi<span className="text-teal-600">Connect</span>
                </span>
              </div>
              <p className="hidden sm:block text-[11px] font-medium text-slate-500">
                AI-Powered Multilingual Case-Taking
              </p>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <Link
              to="/"
              className={`hover:text-teal-600 transition-colors ${location.pathname === '/' ? 'text-teal-600 font-bold' : ''}`}
            >
              Home
            </Link>
            {isAuthenticated && role === 'PATIENT' && (
              <>
                <Link
                  to="/patient/dashboard"
                  className={`hover:text-teal-600 transition-colors ${location.pathname.startsWith('/patient') ? 'text-teal-600 font-bold' : ''}`}
                >
                  Health Check
                </Link>
                <Link
                  to="/patient/upload-reports"
                  className="hover:text-teal-600 transition-colors"
                >
                  Upload Reports
                </Link>
              </>
            )}
            {isAuthenticated && role === 'DOCTOR' && (
              <Link
                to="/doctor/dashboard"
                className={`hover:text-teal-600 transition-colors ${location.pathname.startsWith('/doctor') ? 'text-teal-600 font-bold' : ''}`}
              >
                Doctor Review Workspace
              </Link>
            )}
            {isAuthenticated && role === 'ADMIN' && (
              <Link
                to="/admin/dashboard"
                className={`hover:text-teal-600 transition-colors ${location.pathname.startsWith('/admin') ? 'text-teal-600 font-bold' : ''}`}
              >
                Admin Overview
              </Link>
            )}
          </nav>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Emergency Hotline Button */}
            <a
              href="tel:112"
              className="hidden sm:flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-3 py-2 rounded-xl border border-red-200 transition-colors"
              title="Call Indian Emergency Helpline: 112"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              <span>112 Emergency</span>
            </a>

            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl transition-colors border border-slate-200"
                aria-label="Switch Language"
              >
                <Globe className="w-4 h-4 text-teal-600" />
                <span>{currentLangObj.nativeName}</span>
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 max-h-72 overflow-y-auto animate-fadeIn">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1">
                    Select Indian Language
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                        language === lang.code
                          ? 'bg-teal-50 text-teal-900 font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{lang.nativeName}</span>
                      <span className="text-[10px] text-slate-400">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile or Login CTA */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {user && (
                  <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
                    <UserIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span>{user.name}</span>
                    <span className="text-[10px] text-teal-700 font-bold uppercase">({role})</span>
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs md:text-sm font-bold px-4 py-2 md:py-2.5 rounded-xl shadow-md shadow-teal-600/20 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200 flex flex-col gap-3">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 rounded-xl"
            >
              Home
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/patient/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 rounded-xl"
                >
                  Patient Dashboard
                </Link>
                <Link
                  to="/doctor/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 rounded-xl"
                >
                  Doctor Workspace
                </Link>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 rounded-xl"
                >
                  Admin Overview
                </Link>
                <div className="px-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Switch Role:</span>
                  <div className="flex gap-1">
                    {(['PATIENT', 'DOCTOR', 'ADMIN'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          handleQuickSwitch(r);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          role === r ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
