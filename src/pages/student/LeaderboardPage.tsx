import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Clock,
  Sparkles,
  Filter,
  RefreshCw,
  Search,
  CheckCircle,
  Building2,
  Calendar,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { LeaderboardEntry, Quiz } from '../../types/index.ts';

interface LeaderboardPageProps {
  quizId?: string;
  onNavigate: (view: string, data?: any) => void;
}

export function LeaderboardPage({ quizId: initialQuizId, onNavigate }: LeaderboardPageProps) {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>(initialQuizId || 'all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const [lRes, qRes] = await Promise.all([
        api.getLeaderboard({ quizId: selectedQuizId !== 'all' ? selectedQuizId : undefined }),
        api.getQuizzes(),
      ]);
      setLeaderboard(lRes.leaderboard || []);
      setQuizzes(qRes.quizzes || []);
    } catch (err) {
      console.warn('Failed to fetch leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedQuizId]);

  const filteredLeaderboard = leaderboard.filter((entry) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      entry.studentName.toLowerCase().includes(term) ||
      entry.studentDepartment.toLowerCase().includes(term) ||
      entry.quizTitle.toLowerCase().includes(term)
    );
  });

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            <span>Collegiate Hall of Fame</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Deterministic rankings: Higher Score → Shorter Duration → Earliest Submission.
          </p>
        </div>

        <button
          onClick={fetchLeaderboard}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Standings</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-300">Quiz Filter:</span>
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Quizzes Combined</option>
            {quizzes.map((q) => (
              <option key={q._id} value={q._id}>
                {q.title}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search student or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Top 3 Podium (when available) */}
      {top3.length >= 2 && (
        <div className="pt-4 pb-2">
          <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-2xl mx-auto">
            {/* Rank 2 (Silver) */}
            {top3[1] && (
              <div className="flex-1 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-300/20 border-2 border-slate-300 flex items-center justify-center font-bold text-slate-200 text-sm mb-2 shadow-[0_0_15px_rgba(203,213,225,0.3)]">
                  🥈
                </div>
                <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-700 text-center space-y-1 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rank 2</span>
                  <p className="text-xs font-bold text-white truncate">{top3[1].studentName}</p>
                  <p className="text-lg font-black text-slate-200">{top3[1].score} pts</p>
                  <p className="text-[10px] text-slate-400">{Math.round(top3[1].durationSeconds)}s</p>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold) */}
            {top3[0] && (
              <div className="flex-1 flex flex-col items-center -mt-6">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center font-bold text-amber-300 text-base mb-2 shadow-[0_0_25px_rgba(245,158,11,0.5)]">
                  👑
                </div>
                <div className="w-full p-5 rounded-3xl bg-gradient-to-b from-amber-500/20 to-slate-900 border border-amber-500/50 text-center space-y-1 shadow-2xl relative">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Champion</span>
                  <p className="text-sm font-extrabold text-white truncate">{top3[0].studentName}</p>
                  <p className="text-2xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                    {top3[0].score} pts
                  </p>
                  <p className="text-[10px] text-amber-300/80">{Math.round(top3[0].durationSeconds)}s duration</p>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {top3[2] && (
              <div className="flex-1 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-amber-800/30 border-2 border-amber-700 flex items-center justify-center font-bold text-amber-600 text-sm mb-2 shadow-[0_0_15px_rgba(217,119,6,0.3)]">
                  🥉
                </div>
                <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-700 text-center space-y-1 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Rank 3</span>
                  <p className="text-xs font-bold text-white truncate">{top3[2].studentName}</p>
                  <p className="text-lg font-black text-amber-500">{top3[2].score} pts</p>
                  <p className="text-[10px] text-slate-400">{Math.round(top3[2].durationSeconds)}s</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Leaderboard Table */}
      <div className="navy-card rounded-3xl border border-amber-500/20 overflow-hidden shadow-2xl">
        {filteredLeaderboard.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-xs">No records available for this filter yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-amber-400 uppercase tracking-wider text-[10px] border-b border-amber-500/10">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Rank</th>
                  <th className="py-3.5 px-4 font-bold">Student</th>
                  <th className="py-3.5 px-4 font-bold">Department</th>
                  <th className="py-3.5 px-4 font-bold">Quiz</th>
                  <th className="py-3.5 px-4 font-bold">Score</th>
                  <th className="py-3.5 px-4 font-bold">Duration</th>
                  <th className="py-3.5 px-4 font-bold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLeaderboard.map((entry) => {
                  const isCurrentUser = user && user.name === entry.studentName;
                  const durationMin = Math.floor(entry.durationSeconds / 60);
                  const durationSec = entry.durationSeconds % 60;

                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${
                        isCurrentUser
                          ? 'bg-amber-500/15 text-white font-bold'
                          : 'hover:bg-slate-900/60 text-slate-300'
                      }`}
                    >
                      <td className="py-3 px-4 font-display font-extrabold">
                        {entry.rank === 1 ? (
                          <span className="inline-flex items-center gap-1 text-amber-400">
                            🥇 #1
                          </span>
                        ) : entry.rank === 2 ? (
                          <span className="inline-flex items-center gap-1 text-slate-300">
                            🥈 #2
                          </span>
                        ) : entry.rank === 3 ? (
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            🥉 #3
                          </span>
                        ) : (
                          <span>#{entry.rank}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{entry.studentName}</span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500 text-slate-950 font-bold uppercase">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {entry.studentDepartment || 'Engineering'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium truncate max-w-xs">
                        {entry.quizTitle}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-amber-400 font-bold">
                          {entry.score} / {entry.totalPossibleMarks}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">({entry.accuracyPercent}%)</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {durationMin}m {durationSec}s
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        {new Date(entry.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
