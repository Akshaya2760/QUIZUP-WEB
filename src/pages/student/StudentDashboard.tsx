import React, { useState, useEffect } from 'react';
import {
  Trophy,
  BookOpen,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Star,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Quiz, Attempt, Announcement } from '../../types/index.ts';

interface StudentDashboardProps {
  onNavigate: (view: string, data?: any) => void;
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [history, setHistory] = useState<Attempt[]>([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalScore: 0,
    avgAccuracy: 0,
    passedCount: 0,
    passRate: 0,
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [qRes, hRes, aRes] = await Promise.all([
          api.getQuizzes(),
          api.getMyHistory(),
          api.getAnnouncements(),
        ]);
        setQuizzes(qRes.quizzes || []);
        setHistory(hRes.history || []);
        setStats(hRes.stats || { totalQuizzes: 0, totalScore: 0, avgAccuracy: 0, passedCount: 0, passRate: 0 });
        setAnnouncements(aRes.announcements || []);
      } catch (err) {
        console.warn('Dashboard load error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600/20 via-slate-900 to-[#0e1736] border border-amber-500/30 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Verified Student
              </span>
              <span className="text-xs text-amber-300/80 font-medium">
                {user?.department} • Year {user?.yearOfStudy}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
              Welcome back, <span className="gold-gradient-text">{user?.name}</span>!
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-xl">
              Sharpen your knowledge in the quiz arena. Institutional leaderboards update automatically with
              deterministic tie-breakers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('quiz-list')}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Enter Quiz Arena</span>
            </button>

            <button
              onClick={() => onNavigate('ai-assistant')}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <BrainCircuit className="w-4 h-4 text-amber-400" />
              <span>Ask AI Mentor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Quizzes Taken</span>
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-display font-black text-white">{stats.totalQuizzes}</p>
          <p className="text-[11px] text-amber-400/80 mt-1">{stats.passedCount} completed successfully</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Points</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-display font-black text-amber-400">{stats.totalScore}</p>
          <p className="text-[11px] text-slate-400 mt-1">Verified score marks</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Avg. Accuracy</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-display font-black text-emerald-400">{stats.avgAccuracy}%</p>
          <p className="text-[11px] text-slate-400 mt-1">Across all question attempts</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Pass Rate</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-display font-black text-white">{stats.passRate}%</p>
          <p className="text-[11px] text-slate-400 mt-1">Institutional pass threshold</p>
        </div>
      </div>

      {/* Main Grid: Available Quizzes & Recent Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Quizzes (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Active College Quizzes</h2>
            </div>
            <button
              onClick={() => onNavigate('quiz-list')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {quizzes.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0d152c]/60 border border-slate-800 text-center">
              <p className="text-slate-400 text-xs">No quizzes are currently published by administrators.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quizzes.slice(0, 4).map((quiz) => {
                const hasAttempted = Boolean(quiz.myAttempt);
                return (
                  <div
                    key={quiz._id}
                    className="p-5 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-amber-300 border border-amber-500/20">
                          {quiz.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            quiz.difficulty === 'easy'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : quiz.difficulty === 'medium'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {quiz.difficulty}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white line-clamp-1">{quiz.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{quiz.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> {quiz.durationMinutes}m
                        </span>
                        <span>{quiz.totalQuestions} Questions</span>
                      </div>

                      {hasAttempted ? (
                        <button
                          onClick={() => onNavigate('results', { attemptId: quiz.myAttempt?._id })}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Score: {quiz.myAttempt?.score}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onNavigate('quiz-instructions', { quizId: quiz._id })}
                          className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
                        >
                          Start Quiz
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent Quiz Attempts */}
          <div className="mt-6 pt-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Your Recent Submissions</span>
            </h3>

            {history.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
                <p className="text-xs text-slate-400">You haven't completed any quizzes yet. Start one above!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {history.slice(0, 3).map((item) => (
                  <div
                    key={item._id}
                    onClick={() => onNavigate('results', { attemptId: item._id })}
                    className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/30 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{item.quizTitle}</p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(item.submittedAt || item.startedAt).toLocaleDateString()} • {item.accuracyPercent}% accuracy
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-amber-400">
                        {item.score} / {item.totalPossibleMarks} pts
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Announcements & Badges */}
        <div className="space-y-6">
          {/* Announcements Card */}
          <div className="p-5 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Campus Bulletins</h3>
              </div>
              <button
                onClick={() => onNavigate('announcements')}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
              >
                All
              </button>
            </div>

            {announcements.length === 0 ? (
              <p className="text-xs text-slate-400">No urgent notices today.</p>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 3).map((ann) => (
                  <div key={ann._id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          ann.priority === 'urgent'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {ann.priority}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200">{ann.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{ann.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Badges & Achievements */}
          <div className="p-5 rounded-2xl bg-[#0d152c]/90 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Earned Badges</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {(user?.badges || ['New Cadet']).map((badge) => (
                <span
                  key={badge}
                  className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1 shadow-sm"
                >
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>{badge}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
