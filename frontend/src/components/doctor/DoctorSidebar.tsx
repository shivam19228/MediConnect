import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  FileSpreadsheet,
  CalendarCheck,
  UserCheck,
  LogOut,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DoctorSidebarProps {
  pendingCount?: number;
}

export const DoctorSidebar: React.FC<DoctorSidebarProps> = ({ pendingCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, path: '/doctor/dashboard', end: true },
    { name: 'Incoming Patient Cases', icon: Inbox, path: '/doctor/dashboard', badge: pendingCount },
    { name: 'Patient Reports', icon: FileSpreadsheet, path: '/doctor/dashboard' },
    { name: 'Consultations', icon: CalendarCheck, path: '/doctor/dashboard' },
    { name: 'Profile', icon: UserCheck, path: '/doctor/dashboard' },
  ];

  return (
    <aside className="w-full lg:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Clinician Card */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-teal-600/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {user?.name || 'Dr. Anita Desai, MD'}
            </h3>
            <p className="text-xs text-teal-700 font-semibold truncate">
              {user?.specialty || 'Internal Medicine'}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
              <ShieldCheck className="w-3 h-3" />
              Verified Physician
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="p-4 flex-1 space-y-1.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
          Clinical Workspace
        </div>

        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = idx === 0 || idx === 1; // Default to overview/incoming

          return (
            <button
              key={item.name}
              onClick={() => navigate('/doctor/dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all text-left ${
                isActive
                  ? 'bg-teal-50 text-teal-900 border border-teal-200/60 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-sm">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Logout */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit / Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
