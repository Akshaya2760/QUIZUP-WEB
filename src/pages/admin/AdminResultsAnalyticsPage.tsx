import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Search,
  Filter,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Quiz } from '../../types/index.ts';

export function AdminResultsAnalyticsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const [subRes, qRes] = await Promise.all([
        api.getAdminSubmissions({
          quizId: selectedQuizId !== 'all' ? selectedQuizId : undefined,
          search: search.trim() || undefined,
        }),
        api.getAdminQuizzes(),
      ]);
      setSubmissions(subRes.submissions || []);
      setQuizzes(qRes.quizzes || []);
    } catch (err) {
      console.warn('Failed to load submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [selectedQuizId, search]);

  const totalSubs = submissions.length;
  const passedSubs = submissions.filter((s) => s.isPassed).length;
  const avgAccuracy =
    totalSubs > 0
      ? Math.round(submissions.reduce((acc, s) => acc + (s.accuracyPercent || 0), 0) / totalSubs)
      : 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-amber-400" />
          <span>Results & Academic Analytics</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review institutional assessment logs, verify scoring calculations, and audit college pass rates.
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20">
          <p className="text-xs text-slate-400 font-semibold">Total Evaluated Submissions</p>
          <p className="text-2xl font-black font-display text-white mt-1">{totalSubs}</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20">
          <p className="text-xs text-slate-400 font-semibold">Pass Rate</p>
          <p className="text-2xl font-black font-display text-emerald-400 mt-1">
            {totalSubs > 0 ? Math.round((passedSubs / totalSubs) * 100) : 0}%
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{passedSubs} passed assessments</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20">
          <p className="text-xs text-slate-400 font-semibold">Average Accuracy</p>
          <p className="text-2xl font-black font-display text-amber-400 mt-1">{avgAccuracy}%</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all completed quizzes</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-300">Quiz:</span>
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Quizzes</option>
            {quizzes.map((q) => (
              <option key={q._id} value={q._id}>
                {q.title}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search student or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Submissions Table */}
      <div className="navy-card rounded-3xl border border-amber-500/20 overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto"></div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-xs">No student submission records matching filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-amber-400 uppercase tracking-wider text-[10px] border-b border-amber-500/10">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Student</th>
                  <th className="py-3.5 px-4 font-bold">Quiz</th>
                  <th className="py-3.5 px-4 font-bold">Score</th>
                  <th className="py-3.5 px-4 font-bold">Accuracy</th>
                  <th className="py-3.5 px-4 font-bold">Duration</th>
                  <th className="py-3.5 px-4 font-bold">Outcome</th>
                  <th className="py-3.5 px-4 font-bold">Submitted Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {submissions.map((sub) => {
                  const durationMin = Math.floor(sub.durationSeconds / 60);
                  const durationSec = sub.durationSeconds % 60;
                  return (
                    <tr key={sub._id} className="hover:bg-slate-900/50 text-slate-300 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-white">{sub.studentName}</p>
                          <p className="text-[11px] text-slate-400">{sub.studentDepartment || sub.studentEmail}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-200 font-medium">
                        {sub.quizTitle}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-amber-400">
                          {sub.score} / {sub.totalPossibleMarks}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-300">
                        {sub.accuracyPercent}%
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {durationMin}m {durationSec}s
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            sub.isPassed
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {sub.isPassed ? 'Passed' : 'Failed'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        {new Date(sub.submittedAt || sub.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
