import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Trophy,
  BookOpen,
  Bell,
  Shield,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ChevronRight,
  BrainCircuit,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Navbar({ currentView, onNavigate }: NavbarProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getStatusBadge = () => {
    if (!user) return null;
    if (user.role === 'admin') {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
          <Shield className="w-2.5 h-2.5 text-amber-400" /> Admin
        </span>
      );
    }
    switch (user.status) {
      case 'approved':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            Pending Approval
          </span>
        );
      case 'suspended':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
            Suspended
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
            Rejected
          </span>
        );
    }
  };

  const navLinks = user
    ? user.role === 'admin'
      ? [
          { id: 'admin-dashboard', label: 'Admin Hub', icon: Shield },
          { id: 'admin-approvals', label: 'Student Approvals', icon: UserIcon },
          { id: 'admin-quizzes', label: 'Quizzes & Questions', icon: BookOpen },
          { id: 'admin-analytics', label: 'Results & Reports', icon: Trophy },
          { id: 'admin-announcements', label: 'Announcements', icon: Bell },
        ]
      : [
          { id: 'student-dashboard', label: 'Dashboard', icon: Layers },
          { id: 'quiz-list', label: 'Quizzes', icon: BookOpen },
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { id: 'ai-assistant', label: 'AI Study Mentor', icon: BrainCircuit },
          { id: 'announcements', label: 'Announcements', icon: Bell },
        ]
    : [
        { id: 'landing', label: 'Home' },
        { id: 'leaderboard', label: 'Leaderboard' },
        { id: 'student-login', label: 'Student Login' },
        { id: 'student-register', label: 'Register' },
        { id: 'admin-login', label: 'Admin Portal' },
      ];

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#070b19]/90 backdrop-blur-md border-b border-amber-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleNavClick(user ? (user.role === 'admin' ? 'admin-dashboard' : 'student-dashboard') : 'landing')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] transition-all">
              <div className="w-full h-full bg-[#090f24] rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <span className="font-display font-black text-xl tracking-wider text-white flex items-center gap-1">
                QUIZ<span className="text-amber-400">UP</span>
              </span>
              <span className="block text-[9px] uppercase tracking-widest text-amber-400/80 -mt-1 font-semibold">
                College Quiz Arena
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = (link as any).icon;
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Profile / Auth CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div
                  onClick={() => handleNavClick(user.role === 'admin' ? 'admin-dashboard' : 'student-profile')}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300 text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-medium text-slate-200 leading-none">{user.name}</p>
                    <div className="mt-0.5">{getStatusBadge()}</div>
                  </div>
                </div>

                <button
                  onClick={() => logout()}
                  title="Sign out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavClick('student-login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavClick('student-register')}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center gap-1"
                >
                  <span>Register Student</span>
                  <Sparkles className="w-3 h-3 text-slate-950" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {user && getStatusBadge()}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 bg-[#090f24] border-b border-amber-500/20 space-y-1.5">
          {user && (
            <div className="p-3 mb-2 rounded-xl bg-slate-900/90 border border-amber-500/20 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              <div>{getStatusBadge()}</div>
            </div>
          )}

          {navLinks.map((link) => {
            const Icon = (link as any).icon;
            const isActive = currentView === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between transition-colors ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {Icon && <Icon className="w-4 h-4 text-amber-400" />}
                  <span>{link.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            );
          })}

          {user ? (
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full mt-2 px-3 py-2 rounded-lg text-sm font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => handleNavClick('student-register')}
                className="w-full py-2 text-center rounded-lg bg-amber-500 text-slate-950 font-bold text-sm shadow-md"
              >
                Register as Student
              </button>
              <button
                onClick={() => handleNavClick('admin-login')}
                className="w-full py-2 text-center rounded-lg bg-slate-800 text-amber-400 font-semibold text-sm border border-amber-500/30"
              >
                Administrator Login
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
