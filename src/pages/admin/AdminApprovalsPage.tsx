import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle,
  XCircle,
  AlertOctagon,
  RotateCcw,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  Building2,
  Calendar,
  Hash,
  Shield,
  Lock,
  Mail,
  Key,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { User } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface AdminApprovalsPageProps {
  onNavigate?: (view: string) => void;
}

export function AdminApprovalsPage({ onNavigate }: AdminApprovalsPageProps) {
  const { user, login, bootstrapAdmin } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick stats
  const [statsSummary, setStatsSummary] = useState<{ pending: number; total: number; approved: number }>({
    pending: 0,
    total: 0,
    approved: 0,
  });

  // Modal for Reject or Suspend reason
  const [reasonModal, setReasonModal] = useState<{
    studentId: string;
    studentName: string;
    action: 'reject' | 'suspend';
  } | null>(null);
  const [reasonInput, setReasonInput] = useState('');

  // Inline Admin Gateway State (shown if unauthenticated or non-admin)
  const [authTab, setAuthTab] = useState<'login' | 'bootstrap'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authSecret, setAuthSecret] = useState('');
  const [authName, setAuthName] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [inlineAuthError, setInlineAuthError] = useState<string | null>(null);

  const [authRequired, setAuthRequired] = useState(false);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminStudents({
        status: statusFilter,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        search: search.trim() || undefined,
      });
      setStudents(res.students || []);
      setAuthRequired(false);

      // Also refresh summary counts
      try {
        const statsRes = await api.getAdminStats();
        setStatsSummary({
          pending: statsRes.students.pending,
          total: statsRes.students.total,
          approved: statsRes.students.approved,
        });
      } catch {}
    } catch (err: any) {
      if (
        err.status === 401 ||
        err.status === 403 ||
        err.message?.includes('Authentication required') ||
        err.message?.includes('Administrator privileges')
      ) {
        setAuthRequired(true);
      } else {
        setActionMsg({ type: 'error', text: err.message || 'Failed to fetch student registrations.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [statusFilter, departmentFilter, search]);

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineAuthError(null);
    setIsAuthSubmitting(true);
    try {
      const loggedUser = await login(authEmail.trim(), authPassword);
      if (loggedUser.role !== 'admin') {
        setInlineAuthError('This account does not have administrator privileges. Please sign in with an admin account.');
        return;
      }
      setActionMsg({ type: 'success', text: `Administrator session active: Welcome, ${loggedUser.name}!` });
    } catch (err: any) {
      setInlineAuthError(err.message || 'Administrator authentication failed. Verify your email and password.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleInlineBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineAuthError(null);
    setIsAuthSubmitting(true);
    try {
      const adminUser = await bootstrapAdmin({
        setupSecret: authSecret.trim(),
        name: authName.trim() || 'System Administrator',
        email: authEmail.trim(),
        password: authPassword,
      });
      setActionMsg({ type: 'success', text: `Administrator initialized successfully for ${adminUser.email}!` });
    } catch (err: any) {
      setInlineAuthError(err.message || 'Failed to initialize administrator. Check the setup secret.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleApprove = async (id: string, name: string) => {
    try {
      await api.approveStudent(id);
      setActionMsg({
        type: 'success',
        text: `✓ Approved student: ${name}! Account is now active.`,
      });
      // If we just approved the last pending student in view, switch to approved list
      if (statusFilter === 'pending' && students.length <= 1) {
        setStatusFilter('approved');
      } else {
        fetchStudents();
      }
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to approve student.' });
    }
  };

  const handleReactivate = async (id: string, name: string) => {
    try {
      await api.reactivateStudent(id);
      setActionMsg({ type: 'success', text: `✓ Reactivated student account: ${name}` });
      fetchStudents();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to reactivate student.' });
    }
  };

  const handleConfirmReasonAction = async () => {
    if (!reasonModal) return;
    try {
      if (reasonModal.action === 'reject') {
        await api.rejectStudent(reasonModal.studentId, reasonInput);
        setActionMsg({ type: 'success', text: `Rejected registration for ${reasonModal.studentName}.` });
      } else {
        await api.suspendStudent(reasonModal.studentId, reasonInput);
        setActionMsg({ type: 'success', text: `Suspended account for ${reasonModal.studentName}.` });
      }
      setReasonModal(null);
      setReasonInput('');
      fetchStudents();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message });
    }
  };

  // IF USER IS NOT LOGGED IN AS ADMIN: RENDER THE ADMIN AUTHENTICATION GATEWAY
  if (authRequired || (!isLoading && user && user.role !== 'admin')) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white">
              Administrator Access Required
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              The Student Approvals portal is restricted to authorized college administrators.
              {user && user.role === 'student' && (
                <span className="block mt-1 text-amber-400 font-medium">
                  (Currently signed in as student: <span className="underline">{user.email}</span>)
                </span>
              )}
            </p>
          </div>

          <div className="navy-card rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-2xl space-y-5">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setInlineAuthError(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  authTab === 'login'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('bootstrap');
                  setInlineAuthError(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  authTab === 'bootstrap'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                First-Time Setup
              </button>
            </div>

            {inlineAuthError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{inlineAuthError}</span>
              </div>
            )}

            {authTab === 'login' ? (
              <form onSubmit={handleInlineLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="admin@college.edu"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
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
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthSubmitting}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Shield className="w-4 h-4" />
                  <span>{isAuthSubmitting ? 'Authenticating...' : 'Unlock Approvals Portal'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleInlineBootstrap} className="space-y-3.5">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
                  <span className="font-semibold text-amber-300">Setup Secret: </span>
                  Enter the secret configured in <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">ADMIN_SETUP_SECRET</code>{' '}
                  (default: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">admin123</code>).
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
                      placeholder="Enter setup secret (e.g. admin123)"
                      value={authSecret}
                      onChange={(e) => setAuthSecret(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Administrator Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dean of Academics"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@college.edu"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password (Min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthSubmitting}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAuthSubmitting ? 'Configuring...' : 'Initialize & Sign In'}</span>
                </button>
              </form>
            )}

            {onNavigate && (
              <div className="pt-2 text-center border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onNavigate('landing')}
                  className="text-xs text-slate-400 hover:text-amber-400"
                >
                  ← Return to Home
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMINISTRATOR VIEW: FULL APPROVALS CONTROL PORTAL
  return (
    <div className="space-y-6 pb-16">
      {/* Header & Quick Counter Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-amber-400" />
            <span>Student Approvals & Account Control</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review candidate identity documents, verify college enrollment, and authorize quiz access.
          </p>
        </div>

        {/* Counter Summary Pills */}
        <div className="flex items-center gap-2">
          <div
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <span className="text-[10px] uppercase font-bold block">Pending</span>
            <span className="text-lg font-black text-amber-400 leading-none">
              {statsSummary.pending}
            </span>
          </div>

          <div
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <span className="text-[10px] uppercase font-bold block">Approved</span>
            <span className="text-lg font-black text-emerald-400 leading-none">
              {statsSummary.approved}
            </span>
          </div>

          <div
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'all'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <span className="text-[10px] uppercase font-bold block">Total</span>
            <span className="text-lg font-black text-white leading-none">
              {statsSummary.total}
            </span>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 ${
            actionMsg.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{actionMsg.text}</span>
          </div>
          <button
            onClick={() => setActionMsg(null)}
            className="text-slate-400 hover:text-white p-1 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'pending', label: 'Pending Requests', count: statsSummary.pending, icon: '⏳' },
            { id: 'approved', label: 'Approved Students', count: statsSummary.approved, icon: '✓' },
            { id: 'rejected', label: 'Rejected', icon: '✕' },
            { id: 'suspended', label: 'Suspended', icon: '⊘' },
            { id: 'all', label: 'All Registered', count: statsSummary.total },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? tab.id === 'approved'
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                    statusFilter === tab.id ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-amber-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search student by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Student List Table */}
      <div className="navy-card rounded-3xl border border-amber-500/20 overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">Loading student records from MongoDB Atlas...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-300">
              No student records found under filter "{statusFilter}".
            </p>
            {statusFilter === 'pending' && statsSummary.approved > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setStatusFilter('approved')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow inline-flex items-center gap-2 cursor-pointer transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>View Approved Students ({statsSummary.approved})</span>
                </button>
              </div>
            )}
            {statusFilter !== 'all' && statusFilter !== 'pending' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="text-xs text-amber-400 underline hover:text-amber-300 cursor-pointer block mx-auto"
              >
                View all registered students
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-amber-400 uppercase tracking-wider text-[10px] border-b border-amber-500/10">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Student Name</th>
                  <th className="py-3.5 px-4 font-bold">Student ID</th>
                  <th className="py-3.5 px-4 font-bold">Department & Year</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold">Registered On</th>
                  <th className="py-3.5 px-4 font-bold text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((student) => {
                  return (
                    <tr key={student.id || student._id} className="hover:bg-slate-900/50 text-slate-300 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-white">{student.name}</p>
                          <p className="text-[11px] text-slate-400">{student.email}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-amber-300 font-semibold">
                        {student.studentId || 'N/A'}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-slate-300">{student.department || 'General'}</p>
                        <p className="text-[10px] text-slate-500">Year {student.yearOfStudy || 1}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            student.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : student.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              : student.status === 'suspended'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {student.status}
                        </span>
                        {student.statusReason && (
                          <p className="text-[10px] text-slate-400 mt-0.5 italic max-w-xs truncate">
                            Note: {student.statusReason}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {student.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(student.id || student._id, student.name)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>

                              <button
                                onClick={() =>
                                  setReasonModal({
                                    studentId: student.id || student._id,
                                    studentName: student.name,
                                    action: 'reject',
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold text-xs transition-colors cursor-pointer"
                              >
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {student.status === 'approved' && (
                            <button
                              onClick={() =>
                                setReasonModal({
                                  studentId: student.id || student._id,
                                  studentName: student.name,
                                  action: 'suspend',
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs transition-colors cursor-pointer"
                            >
                              <span>Suspend</span>
                            </button>
                          )}

                          {(student.status === 'suspended' || student.status === 'rejected') && (
                            <button
                              onClick={() => handleReactivate(student.id || student._id, student.name)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs flex items-center gap-1 border border-amber-500/30 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reactivate</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reason Dialog Modal for Reject / Suspend */}
      {reasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="navy-card max-w-md w-full rounded-3xl p-6 sm:p-8 border border-amber-500/40 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white capitalize">
              {reasonModal.action} Student Account
            </h3>
            <p className="text-xs text-slate-300">
              Please state the administrative reason for {reasonModal.action}ing the account of{' '}
              <span className="font-semibold text-white">{reasonModal.studentName}</span>:
            </p>

            <textarea
              required
              rows={3}
              placeholder="e.g. Invalid college ID number provided; Unmatched department records..."
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setReasonModal(null);
                  setReasonInput('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmReasonAction}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs cursor-pointer"
              >
                Confirm {reasonModal.action === 'reject' ? 'Rejection' : 'Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
