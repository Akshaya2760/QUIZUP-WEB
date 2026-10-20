import React from 'react';
import {
  Layers,
  BookOpen,
  Trophy,
  BrainCircuit,
  Bell,
  User,
  Shield,
  CheckCircle,
  FileText,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ currentView, onNavigate, collapsed, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const studentLinks = [
    { id: 'student-dashboard', label: 'Dashboard', icon: Layers },
    { id: 'quiz-list', label: 'Quiz Arena', icon: BookOpen },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'ai-assistant', label: 'AI Study Mentor', icon: BrainCircuit },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'student-profile', label: 'My Profile', icon: User },
  ];

  const adminLinks = [
    { id: 'admin-dashboard', label: 'Overview Hub', icon: Shield },
    { id: 'admin-approvals', label: 'Student Approvals', icon: CheckCircle },
    { id: 'admin-quizzes', label: 'Quizzes & Questions', icon: BookOpen },
    { id: 'admin-analytics', label: 'Submissions & Reports', icon: BarChart3 },
    { id: 'admin-announcements', label: 'Announcements', icon: Bell },
    { id: 'leaderboard', label: 'Public Leaderboard', icon: Trophy },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <aside
      className={`relative hidden md:flex flex-col bg-[#070b19] border-r border-amber-500/15 transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer z-40"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Role Tag & Summary */}
      <div className="p-4 border-b border-amber-500/10">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400">
              {isAdmin ? <Shield className="w-5 h-5 text-amber-400" /> : <GraduationAvatar user={user} />}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold text-white truncate">{user.name}</h4>
              <p className="text-[11px] text-amber-400/80 font-medium truncate">
                {isAdmin ? 'System Administrator' : `${user.department || 'Student'} • Year ${user.yearOfStudy}`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400">
              {isAdmin ? <Shield className="w-5 h-5 text-amber-400" /> : user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Navigation links */}
      <div className="flex-1 py-4 px-2.5 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = currentView === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
              title={collapsed ? link.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-amber-500/10">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0 text-rose-400" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

function GraduationAvatar({ user }: { user: any }) {
  return <span className="text-amber-300 font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>;
}
