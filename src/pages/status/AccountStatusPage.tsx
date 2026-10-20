import React from 'react';
import { AlertOctagon, ShieldAlert, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface AccountStatusPageProps {
  onNavigate: (view: string) => void;
}

export function AccountStatusPage({ onNavigate }: AccountStatusPageProps) {
  const { user, logout } = useAuth();

  const isSuspended = user?.status === 'suspended';
  const isRejected = user?.status === 'rejected';

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="navy-card rounded-3xl p-8 text-center relative border border-rose-500/30 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5">
            {isSuspended ? <AlertOctagon className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-block mb-3">
            Account {isSuspended ? 'Suspended' : 'Rejected'}
          </span>

          <h2 className="text-2xl font-display font-extrabold text-white">
            Access Restricted
          </h2>

          <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isSuspended
              ? 'Your student account has been temporarily suspended by an institutional administrator.'
              : 'Your registration was reviewed and rejected by the examination board.'}
          </p>

          {user?.statusReason && (
            <div className="mt-5 p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/20 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                Reason from Administrator:
              </span>
              <p className="text-xs text-slate-200">{user.statusReason}</p>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => logout()}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
