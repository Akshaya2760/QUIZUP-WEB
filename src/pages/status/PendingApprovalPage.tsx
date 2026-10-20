import React, { useState } from 'react';
import { Clock, ShieldCheck, RefreshCw, AlertCircle, LogOut, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface PendingApprovalPageProps {
  onNavigate: (view: string) => void;
}

export function PendingApprovalPage({ onNavigate }: PendingApprovalPageProps) {
  const { user, refreshUser, logout } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setCheckMessage(null);
    try {
      await refreshUser();
      // user will update via context
      if (user?.status === 'approved') {
        onNavigate('student-dashboard');
      } else {
        setCheckMessage('Account is still awaiting administrator approval. Please check back shortly.');
      }
    } catch {
      setCheckMessage('Could not verify status. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full">
        <div className="navy-card rounded-3xl p-8 sm:p-10 text-center relative border border-amber-500/30 shadow-2xl">
          {/* Animated Hourglass / Clock */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
            <Clock className="w-10 h-10 animate-spin" style={{ animationDuration: '8s' }} />
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-block mb-3">
            Registration Status: Pending Approval
          </span>

          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            Verification In Progress
          </h2>

          <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Hello, <span className="font-semibold text-amber-300">{user?.name || 'Student'}</span>! Your registration details
            for the <span className="text-white font-medium">{user?.department || 'College Department'}</span> have been
            saved to our institutional database.
          </p>

          {/* Verification steps cards */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left text-xs space-y-2.5">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                ✓
              </span>
              <div>
                <p className="font-semibold text-slate-200">Account Created & Credentials Hashed</p>
                <p className="text-[11px] text-slate-400">Student ID: {user?.studentId || 'Provided'} (Persistent in MongoDB)</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 animate-pulse">
                ⏳
              </span>
              <div>
                <p className="font-semibold text-amber-300">Administrator Authorization Pending</p>
                <p className="text-[11px] text-slate-400">An administrator must approve your account before you can take timed quizzes.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                3
              </span>
              <div>
                <p className="font-semibold text-slate-400">Quiz & Leaderboard Access</p>
                <p className="text-[11px] text-slate-500">Unlocks instantly upon administrator approval.</p>
              </div>
            </div>
          </div>

          {checkMessage && (
            <p className="mt-4 text-xs font-medium text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
              {checkMessage}
            </p>
          )}

          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>Check Approval Status</span>
            </button>

            <button
              onClick={() => onNavigate('admin-approvals')}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Approvals Portal</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={() => logout()}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium inline-flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out of this Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
