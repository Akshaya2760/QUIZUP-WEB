import React, { useState } from 'react';
import { Shield, Key, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2, Terminal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { AnimatedMascot } from '../../components/common/AnimatedMascot.tsx';

interface AdminLoginPageProps {
  onNavigate: (view: string) => void;
}

export function AdminLoginPage({ onNavigate }: AdminLoginPageProps) {
  const { login, bootstrapAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'bootstrap'>('login');

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Bootstrap fields
  const [setupSecret, setSetupSecret] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role !== 'admin') {
        setError('This account does not have administrator privileges. Please log in via the student portal.');
        return;
      }
      onNavigate('admin-dashboard');
    } catch (err: any) {
      setError(err.message || 'Administrator authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!setupSecret || !adminName || !adminEmail || !adminPassword) {
      setError('All fields including the Administrator Setup Secret are required.');
      return;
    }

    if (adminPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await bootstrapAdmin({
        setupSecret: setupSecret.trim(),
        name: adminName.trim(),
        email: adminEmail.trim(),
        password: adminPassword,
      });

      setSuccess(`Administrator account initialized for ${user.email}! Redirecting...`);
      setTimeout(() => {
        onNavigate('admin-dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize administrator. Please verify the setup secret.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Animated Mascot in Admin mode */}
        <AnimatedMascot
          mode="admin"
          isSubmitting={isSubmitting}
          hasError={Boolean(error)}
        />

        {/* Card */}
        <div className="navy-card rounded-3xl p-8 shadow-2xl relative border border-amber-500/30">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-display font-extrabold text-white">Administrator Portal</h2>
            <p className="text-xs text-slate-400 mt-1">Institutional examination & student control gateway</p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('bootstrap');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                activeTab === 'bootstrap'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              First-Time Setup
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="admin@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Shield className="w-4 h-4" />
                <span>Enter Administrator Portal</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleBootstrap} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
                <span className="font-semibold text-amber-300">Admin Setup Secret Required: </span>
                Enter the secret key defined in your environment variable <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">ADMIN_SETUP_SECRET</code>.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Setup Secret Key
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    placeholder="Enter ADMIN_SETUP_SECRET"
                    value={setupSecret}
                    onChange={(e) => setSetupSecret(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Administrator Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Eleanor Vance"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="admin@college.edu"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Terminal className="w-4 h-4" />
                <span>Initialize Administrator Account</span>
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-amber-500/10 text-center">
            <button
              onClick={() => onNavigate('student-login')}
              className="text-xs text-slate-400 hover:text-amber-400 font-medium"
            >
              ← Return to Student Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
