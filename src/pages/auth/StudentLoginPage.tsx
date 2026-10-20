import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle, Sparkles, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { AnimatedMascot } from '../../components/common/AnimatedMascot.tsx';

interface StudentLoginPageProps {
  onNavigate: (view: string) => void;
}

export function StudentLoginPage({ onNavigate }: StudentLoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide your college email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login(email.trim(), password);

      if (loggedUser.role === 'admin') {
        onNavigate('admin-dashboard');
      } else if (loggedUser.status === 'approved') {
        onNavigate('student-dashboard');
      } else if (loggedUser.status === 'pending') {
        onNavigate('pending-approval');
      } else {
        onNavigate('account-status');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or connection issue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Animated Greeting Character */}
        <AnimatedMascot
          mode="login"
          isSubmitting={isSubmitting}
          hasError={Boolean(error)}
        />

        {/* Card */}
        <div className="navy-card rounded-3xl p-8 shadow-2xl relative border border-amber-500/25">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-display font-extrabold text-white">Student Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your college credentials to access quizzes & leaderboard
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                College Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="student@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Authenticating with server...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-amber-500/10 text-center space-y-2">
            <p className="text-xs text-slate-400">
              New to QUIZUP?{' '}
              <button
                onClick={() => onNavigate('student-register')}
                className="text-amber-400 hover:text-amber-300 font-bold hover:underline"
              >
                Create Student Account
              </button>
            </p>
            <p className="text-[11px] text-slate-500">
              Administrator or Faculty?{' '}
              <button
                onClick={() => onNavigate('admin-login')}
                className="text-slate-300 hover:text-amber-400 font-medium hover:underline"
              >
                Access Admin Portal
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
