import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  CheckCircle,
  Clock,
  BookOpen,
  Trophy,
  BarChart3,
  Bell,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface AdminDashboardProps {
  onNavigate: (view: string, data?: any) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err) {
      console.warn('Failed to load admin stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Admin Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-600/25 via-slate-900 to-[#101b3b] border border-amber-500/30 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Shield className="w-3 h-3 text-amber-400" /> Platform Administration
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
              Institutional Command Hub
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-xl">
              Manage student registrations, enforce examination integrity, publish college challenges, and monitor deterministic leaderboards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('admin-approvals')}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Review Approvals</span>
              {stats?.students?.pending > 0 && (
                <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 font-black text-[10px] flex items-center justify-center">
                  {stats.students.pending}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('admin-quizzes')}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Manage Quizzes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Approvals Card */}
        <div
          onClick={() => onNavigate('admin-approvals', { initialFilter: 'pending' })}
          className="p-5 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20 hover:border-amber-500/40 cursor-pointer transition-all shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold">Pending Students</span>
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <p className="text-2xl sm:text-3xl font-display font-black text-amber-400">
            {stats?.students?.pending ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Requires institutional review</p>
        </div>

        {/* Total Students Card */}
        <div
          onClick={() => onNavigate('admin-approvals', { initialFilter: 'approved' })}
          className="p-5 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20 hover:border-amber-500/40 cursor-pointer transition-all shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold">Registered Students</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-display font-black text-white">
            {stats?.students?.total ?? 0}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1">
            {stats?.students?.approved ?? 0} Approved & Active
          </p>
        </div>

        {/* Quizzes Count */}
        <div
          onClick={() => onNavigate('admin-quizzes')}
          className="p-5 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20 hover:border-amber-500/40 cursor-pointer transition-all shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold">Published Quizzes</span>
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-display font-black text-white">
            {stats?.quizzes?.published ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats?.quizzes?.total ?? 0} Total in Database
          </p>
        </div>

        {/* Submissions & Pass Rate */}
        <div
          onClick={() => onNavigate('admin-analytics')}
          className="p-5 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20 hover:border-amber-500/40 cursor-pointer transition-all shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold">Exam Submissions</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-display font-black text-emerald-400">
            {stats?.submissions?.total ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats?.submissions?.passRate ?? 0}% Pass Rate • {stats?.submissions?.averageAccuracy ?? 0}% Avg.
          </p>
        </div>
      </div>

      {/* Action Required: Pending Approval Requests */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-500/15 via-[#0d152c] to-[#101b3b] border-2 border-amber-500/40 p-6 sm:p-7 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-display font-extrabold text-white">
                  Student Registrations Awaiting Verification
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow">
                  {stats?.students?.pending ?? stats?.pendingRequests?.length ?? 0} Pending
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                New students who have registered and need administrator authorization to access quizzes.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('admin-approvals')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shrink-0 cursor-pointer shadow flex items-center gap-1.5"
          >
            <span>Manage Approvals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {!stats?.pendingRequests || stats.pendingRequests.length === 0 ? (
          <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-300">All registered students have been reviewed and approved! No pending requests.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-amber-400/90 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Student Name & Email</th>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Department & Year</th>
                  <th className="py-2.5 px-3">Registered On</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.pendingRequests.map((student: any) => (
                  <tr key={student.id || student._id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-white">{student.name}</p>
                      <p className="text-[11px] text-slate-400">{student.email}</p>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-amber-300">
                      {student.studentId || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <p>{student.department || 'General'}</p>
                      <p className="text-[10px] text-slate-500">Year {student.yearOfStudy || 1}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={async () => {
                          try {
                            await api.approveStudent(student.id || student._id);
                            fetchStats();
                          } catch (err: any) {
                            alert(err.message || 'Failed to approve student');
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approved Scholars & Verified Students Section */}
      <div className="rounded-3xl bg-[#0a0f24] border border-emerald-500/30 p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-display font-extrabold text-white">
                  Approved & Active Scholars
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {stats?.students?.approved ?? stats?.approvedStudents?.length ?? 0} Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Students authorized to access timed quizzes, earn badges, and compete on the leaderboard.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('admin-approvals', { initialFilter: 'approved' })}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>Full Approvals Roster ({stats?.students?.approved ?? 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {!stats?.approvedStudents || stats.approvedStudents.length === 0 ? (
          <div className="py-6 text-center text-slate-400">
            <p className="text-xs">No approved students yet. Review and approve pending requests above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-emerald-400/90 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Student Scholar</th>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Department & Year</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Approval Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.approvedStudents.map((student: any) => (
                  <tr key={student.id || student._id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-white">{student.name}</p>
                      <p className="text-[11px] text-slate-400">{student.email}</p>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-emerald-300">
                      {student.studentId || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <p>{student.department || 'General'}</p>
                      <p className="text-[10px] text-slate-500">Year {student.yearOfStudy || 1}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        ✓ Approved
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                      {student.approvedAt
                        ? new Date(student.approvedAt).toLocaleDateString()
                        : student.updatedAt
                        ? new Date(student.updatedAt).toLocaleDateString()
                        : 'Active'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Main Grid: Recent Submissions & Audit Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Submissions */}
        <div className="p-6 rounded-3xl bg-[#0d152c]/90 border border-amber-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Recent Exam Submissions</h3>
            </div>
            <button
              onClick={() => onNavigate('admin-analytics')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              View All
            </button>
          </div>

          {!stats?.recentSubmissions || stats.recentSubmissions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No student submissions recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {stats.recentSubmissions.map((sub: any) => (
                <div
                  key={sub._id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{sub.studentName}</p>
                    <p className="text-[11px] text-slate-400">
                      {sub.quizTitle} • {Math.round(sub.durationSeconds)}s
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-400 block">
                      {sub.score} / {sub.totalPossibleMarks} pts
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        sub.isPassed ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {sub.isPassed ? 'Passed' : 'Failed'} ({sub.accuracyPercent}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Activity Log */}
        <div className="p-6 rounded-3xl bg-[#0d152c]/90 border border-amber-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Administrative Audit Trail</h3>
            </div>
            <button
              onClick={fetchStats}
              title="Refresh logs"
              className="p-1 text-slate-400 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recent administrative actions.</p>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
              {stats.recentActivity.map((log: any) => (
                <div
                  key={log._id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-amber-300 uppercase tracking-wider">{log.action}</span>
                    <span className="text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-200 text-[11px]">{log.details}</p>
                  <p className="text-[10px] text-slate-400">By: {log.performedByName || 'System'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
